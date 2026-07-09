const connection = require('../database/connection');
const auditoriaService = require('../services/auditoria.service');
const { encerrarSeExpirada } = require('../services/votacao-expiracao.service');

const TIPOS_RESPOSTA_VALIDOS = ['Sim_Nao', 'Multipla_Escolha', 'Eleicao'];
const STATUS_VALIDOS = ['Aguardando', 'Aberta', 'Encerrada'];
const OPCOES_PADRAO_SIM_NAO = ['Sim', 'Não'];

/** Serializa a votação trocando o campo `opcoes` (texto JSON) por um array de fato. */
function comOpcoesParseadas(votacao) {
  if (!votacao) return votacao;
  let opcoes = OPCOES_PADRAO_SIM_NAO;
  try {
    opcoes = JSON.parse(votacao.opcoes);
  } catch (_e) {
    // Mantém o padrão se, por algum motivo, o valor salvo não for um JSON válido.
  }
  return { ...votacao, opcoes };
}

class VotacoesController {
  /**
   * POST /api/votacoes (RF14)
   * Body: { pauta_id, pergunta, tipo_resposta, duracao_minutos, visibilidade, opcoes }
   *
   * Regra de negócio: toda votação nasce com um conjunto FECHADO de opções válidas.
   *  - Sim_Nao: sempre ["Sim", "Não"] (opcoes enviado no body é ignorado para esse tipo).
   *  - Multipla_Escolha / Eleicao: `opcoes` é obrigatório e precisa ser um array
   *    com pelo menos 2 strings únicas (ex: nomes dos candidatos ou alternativas de pauta).
   *
   * Cria uma sessão de votação associada a uma pauta, no status inicial "Aguardando".
   */
  async criar(req, res) {
    const { pauta_id, pergunta, tipo_resposta, duracao_minutos, visibilidade, opcoes } = req.body;

    if (!pauta_id || !pergunta) {
      return res.status(400).json({ error: 'Informe pauta_id e pergunta.' });
    }

    const tipoFinal = tipo_resposta || 'Sim_Nao';
    if (!TIPOS_RESPOSTA_VALIDOS.includes(tipoFinal)) {
      return res.status(400).json({
        error: `tipo_resposta inválido. Use um dos seguintes: ${TIPOS_RESPOSTA_VALIDOS.join(', ')}.`
      });
    }

    let opcoesFinais;
    if (tipoFinal === 'Sim_Nao') {
      opcoesFinais = OPCOES_PADRAO_SIM_NAO;
    } else {
      if (!Array.isArray(opcoes) || opcoes.length < 2) {
        return res.status(400).json({
          error: 'Para tipo_resposta "Multipla_Escolha" ou "Eleicao", informe "opcoes" como um array com pelo menos 2 itens.'
        });
      }
      const opcoesNormalizadas = opcoes.map(o => String(o).trim()).filter(Boolean);
      const semDuplicatas = new Set(opcoesNormalizadas);
      if (semDuplicatas.size !== opcoesNormalizadas.length || opcoesNormalizadas.length < 2) {
        return res.status(400).json({ error: 'As opções informadas devem ser únicas e não vazias (mínimo 2).' });
      }
      opcoesFinais = opcoesNormalizadas;
    }

    try {
      const pauta = await connection('pautas').where({ id: pauta_id }).first();
      if (!pauta) {
        return res.status(404).json({ error: 'Pauta não encontrada.' });
      }

      const reuniaoDaPauta = await connection('reunioes').where({ id: pauta.reuniao_id }).first();
      if (reuniaoDaPauta && reuniaoDaPauta.status === 'Encerrada') {
        return res.status(400).json({ error: 'Não é possível criar votações em uma reunião encerrada.' });
      }

      const [votacaoId] = await connection('votacoes').insert({
        reuniao_id: pauta.reuniao_id,
        pauta_id,
        pergunta,
        tipo_resposta: tipoFinal,
        visibilidade: visibilidade || 'Aberta',
        status: 'Aguardando',
        duracao_minutos: duracao_minutos || 15,
        opcoes: JSON.stringify(opcoesFinais)
      });

      await auditoriaService.registrar(req, {
        acao: `Votação ${votacaoId} criada para a pauta "${pauta.titulo}"`
      });

      const votacaoCriada = await connection('votacoes').where({ id: votacaoId }).first();
      return res.status(201).json(comOpcoesParseadas(votacaoCriada));
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar votação.', details: error.message });
    }
  }

  /**
   * PATCH /api/votacoes/:id/status (RF15)
   * Body: { status: 'Aguardando' | 'Aberta' | 'Encerrada' }
   *
   * Regras de negócio:
   *  - Uma votação encerrada nunca pode ser reaberta (garante integridade do resultado final).
   *  - Ao abrir uma votação, todas as demais votações "Aberta" da mesma reunião
   *    são automaticamente encerradas (apenas uma pauta em votação por vez).
   */
  async atualizarStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({
        error: `Status inválido. Use um dos seguintes: ${STATUS_VALIDOS.join(', ')}.`
      });
    }

    try {
      const votacao = await connection('votacoes').where({ id }).first();
      if (!votacao) {
        return res.status(404).json({ error: 'Votação não encontrada.' });
      }

      if (votacao.status === 'Encerrada') {
        return res.status(400).json({ error: 'Uma votação encerrada não pode ser reaberta.' });
      }

      const reuniaoDaVotacao = await connection('reunioes').where({ id: votacao.reuniao_id }).first();
      if (reuniaoDaVotacao && reuniaoDaVotacao.status === 'Encerrada') {
        return res.status(400).json({ error: 'Não é possível alterar votações de uma reunião encerrada.' });
      }

      if (status === 'Aberta') {
        // Garante que não existam duas votações abertas simultaneamente na mesma reunião.
        await connection('votacoes')
          .where({ reuniao_id: votacao.reuniao_id, status: 'Aberta' })
          .andWhereNot({ id })
          .update({ status: 'Encerrada' });
      }

      const atualizacao = { status };
      if (status === 'Aberta') {
        // Marca o instante exato da abertura para o cronômetro do frontend
        // conseguir calcular o tempo restante de forma consistente entre
        // recarregamentos de página (ver migration add_aberta_em_to_votacoes).
        atualizacao.aberta_em = connection.raw("datetime('now', 'localtime')");
      }
      await connection('votacoes').where({ id }).update(atualizacao);

      await auditoriaService.registrar(req, {
        acao: `Votação ${id} alterada para status "${status}"`
      });

      const votacaoAtualizada = await connection('votacoes').where({ id }).first();
      return res.json(comOpcoesParseadas(votacaoAtualizada));
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar status da votação.', details: error.message });
    }
  }

  /** GET /api/votacoes/:id - detalhe de uma votação específica */
  async detalhar(req, res) {
    const { id } = req.params;
    try {
      let votacao = await connection('votacoes').where({ id }).first();
      if (!votacao) {
        return res.status(404).json({ error: 'Votação não encontrada.' });
      }
      votacao = await encerrarSeExpirada(req, votacao);
      return res.json(comOpcoesParseadas(votacao));
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar votação.', details: error.message });
    }
  }

  /**
   * GET /api/votacoes/ativa?reuniao_id=ID
   * Usado pelo painel do Proprietário/Procurador para descobrir, via polling,
   * se existe uma votação "Aberta" no momento para aquela reunião.
   */
  async buscarAtiva(req, res) {
    const { reuniao_id } = req.query;

    if (!reuniao_id) {
      return res.status(400).json({ error: 'Informe reuniao_id.' });
    }

    try {
      let votacao = await connection('votacoes')
        .where({ reuniao_id, status: 'Aberta' })
        .first();

      if (votacao) {
        votacao = await encerrarSeExpirada(req, votacao);
      }

      if (!votacao || votacao.status !== 'Aberta') {
        return res.json(null);
      }

      const pauta = await connection('pautas').where({ id: votacao.pauta_id }).first();

      return res.json({ ...comOpcoesParseadas(votacao), pauta });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar votação ativa.', details: error.message });
    }
  }
}

module.exports = new VotacoesController();
