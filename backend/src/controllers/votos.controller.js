const connection = require('../database/connection');
const auditoriaService = require('../services/auditoria.service');

class VotosController {
  /**
   * POST /api/votacoes/votar
   * Requer autenticação (middleware `autenticar` + `apenasVotante`).
   * Body: { votacao_id, opcao_escolhida }
   *
   * IMPORTANTE: proprietario_id e procurador_id NÃO vêm mais do corpo da
   * requisição (isso permitiria que qualquer cliente votasse em nome de
   * outra pessoa). Eles são extraídos de `req.usuario`, que é populado
   * pelo middleware de autenticação a partir do JWT emitido no login —
   * ou seja, refletem exatamente quem de fato autenticou na sessão.
   *
   * Implementa as regras de negócio centrais do sistema:
   *  1. A votação precisa estar com status "Aberta".
   *  2. A opção escolhida precisa constar na lista fechada de opções da votação.
   *  3. Se o login ativo for de um procurador (RF12), valida que ele de fato
   *     representa o proprietario_id da sessão e está credenciado na mesma reunião.
   *  4. Um proprietário (ou seu procurador) só pode votar uma vez por votação (RF18),
   *     garantido tanto na aplicação quanto pela constraint UNIQUE do banco.
   *  5. Verificação de adimplência (RF19): proprietário inadimplente vota com peso 0.0.
   *  6. Cálculo ponderado (RF19): caso contrário, aplica o peso_voto cadastrado
   *     (Terreno = 1.0, Casa construída = 2.0, já refletido em peso_voto).
   *  7. Captura IP e User-Agent para auditoria (RF4) e para a própria linha do voto.
   *  8. O voto, uma vez salvo, é definitivo e irreversível (RF18) — não há rota de edição/remoção.
   */
  async votar(req, res) {
    const { votacao_id, opcao_escolhida } = req.body;
    const { proprietario_id, procurador_id } = req.usuario; // dados confiáveis do JWT

    if (!votacao_id || !opcao_escolhida) {
      return res.status(400).json({
        error: 'Informe votacao_id e opcao_escolhida.'
      });
    }

    try {
      const votacao = await connection('votacoes').where({ id: votacao_id }).first();
      if (!votacao) {
        return res.status(404).json({ error: 'Votação não encontrada.' });
      }

      // Regra 1: votação precisa estar aberta
      if (votacao.status !== 'Aberta') {
        return res.status(400).json({ error: 'Esta votação não está aberta no momento.' });
      }

      // Regra 2: a opção precisa pertencer ao conjunto fechado de opções da votação
      // (vale para Sim_Nao, Multipla_Escolha e Eleicao igualmente).
      let opcoesValidas = ['Sim', 'Não'];
      try {
        opcoesValidas = JSON.parse(votacao.opcoes);
      } catch (_e) {
        // mantém o padrão Sim/Não se o campo não estiver populado corretamente
      }
      if (!opcoesValidas.includes(opcao_escolhida)) {
        return res.status(400).json({
          error: `Opção inválida. Opções válidas para esta votação: ${opcoesValidas.join(', ')}.`
        });
      }

      const proprietario = await connection('proprietarios').where({ id: proprietario_id }).first();
      if (!proprietario) {
        return res.status(404).json({ error: 'Proprietário não encontrado.' });
      }

      // Regra 3: se um procurador está votando, ele precisa realmente representar
      // este proprietário nesta mesma reunião (RF12).
      if (procurador_id) {
        const procurador = await connection('procuradores').where({ id: procurador_id }).first();

        if (!procurador) {
          return res.status(404).json({ error: 'Procurador não encontrado.' });
        }
        if (procurador.proprietario_id !== proprietario.id) {
          return res.status(403).json({ error: 'Este procurador não representa o proprietário informado.' });
        }
        if (procurador.reuniao_id !== votacao.reuniao_id) {
          return res.status(403).json({ error: 'Este procurador não está credenciado para esta reunião.' });
        }
      }

      // Regra 4: unicidade do voto — checagem prévia (a garantia definitiva vem da constraint UNIQUE).
      const votoExistente = await connection('votos')
        .where({ votacao_id, proprietario_id })
        .first();

      if (votoExistente) {
        return res.status(409).json({ error: 'Este proprietário já votou nesta pauta.' });
      }

      // Regras 5 e 6: adimplência define o peso aplicado ao voto.
      const pesoAplicado = proprietario.inadimplente ? 0.0 : Number(proprietario.peso_voto);

      const ip = require('../services/auditoria.service').extrairIp(req);

      let votoId;
      try {
        [votoId] = await connection('votos').insert({
          votacao_id,
          proprietario_id,
          procurador_id: procurador_id || null,
          opcao_escolhida,
          peso_aplicado: pesoAplicado,
          ip_voto: ip
        });
      } catch (dbError) {
        // Trava de segurança: mesmo em caso de corrida (duas requisições simultâneas),
        // a constraint UNIQUE(votacao_id, proprietario_id) do banco impede o voto duplicado.
        if (String(dbError.message).includes('UNIQUE')) {
          return res.status(409).json({ error: 'Este proprietário já votou nesta pauta.' });
        }
        throw dbError;
      }

      await auditoriaService.registrar(req, {
        proprietario_id,
        procurador_id: procurador_id || null,
        acao: `Voto Computado - votacao_id=${votacao_id}, opcao="${opcao_escolhida}", peso=${pesoAplicado}`
      });

      return res.status(201).json({
        status: 'success',
        message: proprietario.inadimplente
          ? 'Voto registrado, porém computado com peso zero devido à inadimplência.'
          : 'Voto registrado com sucesso.',
        voto_id: votoId,
        peso_aplicado: pesoAplicado
      });
    } catch (error) {
      console.error('[Voto Error]', error);
      return res.status(500).json({ error: 'Erro ao processar o voto.', details: error.message });
    }
  }

  /**
   * GET /api/votacoes/:id/resultados
   * Calcula a soma de pesos por opção e a porcentagem relativa (RF19).
   * Trata divisão por zero com segurança, retornando 0% para todas as opções
   * caso a soma total de pesos válidos seja 0.0.
   */
  async resultados(req, res) {
    const { id } = req.params;

    try {
      const votacao = await connection('votacoes').where({ id }).first();
      if (!votacao) {
        return res.status(404).json({ error: 'Votação não encontrada.' });
      }

      const somaPorOpcao = await connection('votos')
        .where({ votacao_id: id })
        .groupBy('opcao_escolhida')
        .select('opcao_escolhida')
        .sum({ peso_total: 'peso_aplicado' })
        .count({ quantidade_votos: 'id' });

      const totalPesos = somaPorOpcao.reduce((acc, linha) => acc + Number(linha.peso_total), 0);
      const totalVotos = somaPorOpcao.reduce((acc, linha) => acc + Number(linha.quantidade_votos), 0);

      const resultadoPorOpcao = somaPorOpcao.map(linha => ({
        opcao: linha.opcao_escolhida,
        peso_total: Number(linha.peso_total),
        quantidade_votos: Number(linha.quantidade_votos),
        // Divisão por zero segura: se a soma de pesos válidos for 0, retorna 0%.
        percentual: totalPesos > 0 ? Number(((Number(linha.peso_total) / totalPesos) * 100).toFixed(2)) : 0
      }));

      return res.json({
        votacao_id: Number(id),
        status: votacao.status,
        total_pesos: totalPesos,
        total_votos: totalVotos,
        resultados: resultadoPorOpcao
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao calcular resultados.', details: error.message });
    }
  }
}

module.exports = new VotosController();
