const connection = require('../database/connection');
const auditoriaService = require('../services/auditoria.service');

const TIPOS_RESPOSTA_VALIDOS = ['Sim_Nao', 'Multipla_Escolha', 'Eleicao'];
const STATUS_VALIDOS = ['Aguardando', 'Aberta', 'Encerrada'];

class VotacoesController {
  /**
   * POST /api/votacoes (RF14)
   * Body: { pauta_id, pergunta, tipo_resposta, duracao_minutos, visibilidade }
   * Cria uma sessão de votação associada a uma pauta, no status inicial "Aguardando".
   */
  async criar(req, res) {
    const { pauta_id, pergunta, tipo_resposta, duracao_minutos, visibilidade } = req.body;

    if (!pauta_id || !pergunta) {
      return res.status(400).json({ error: 'Informe pauta_id e pergunta.' });
    }

    const tipoFinal = tipo_resposta || 'Sim_Nao';
    if (!TIPOS_RESPOSTA_VALIDOS.includes(tipoFinal)) {
      return res.status(400).json({
        error: `tipo_resposta inválido. Use um dos seguintes: ${TIPOS_RESPOSTA_VALIDOS.join(', ')}.`
      });
    }

    try {
      const pauta = await connection('pautas').where({ id: pauta_id }).first();
      if (!pauta) {
        return res.status(404).json({ error: 'Pauta não encontrada.' });
      }

      const [votacaoId] = await connection('votacoes').insert({
        reuniao_id: pauta.reuniao_id,
        pauta_id,
        pergunta,
        tipo_resposta: tipoFinal,
        visibilidade: visibilidade || 'Aberta',
        status: 'Aguardando',
        duracao_minutos: duracao_minutos || 15
      });

      await auditoriaService.registrar(req, {
        acao: `Votação ${votacaoId} criada para a pauta "${pauta.titulo}"`
      });

      const votacaoCriada = await connection('votacoes').where({ id: votacaoId }).first();
      return res.status(201).json(votacaoCriada);
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

      if (status === 'Aberta') {
        // Garante que não existam duas votações abertas simultaneamente na mesma reunião.
        await connection('votacoes')
          .where({ reuniao_id: votacao.reuniao_id, status: 'Aberta' })
          .andWhereNot({ id })
          .update({ status: 'Encerrada' });
      }

      await connection('votacoes').where({ id }).update({ status });

      await auditoriaService.registrar(req, {
        acao: `Votação ${id} alterada para status "${status}"`
      });

      const votacaoAtualizada = await connection('votacoes').where({ id }).first();
      return res.json(votacaoAtualizada);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar status da votação.', details: error.message });
    }
  }

  /** GET /api/votacoes/:id - detalhe de uma votação específica */
  async detalhar(req, res) {
    const { id } = req.params;
    try {
      const votacao = await connection('votacoes').where({ id }).first();
      if (!votacao) {
        return res.status(404).json({ error: 'Votação não encontrada.' });
      }
      return res.json(votacao);
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
      const votacao = await connection('votacoes')
        .where({ reuniao_id, status: 'Aberta' })
        .first();

      if (!votacao) {
        return res.json(null);
      }

      const pauta = await connection('pautas').where({ id: votacao.pauta_id }).first();

      return res.json({ ...votacao, pauta });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar votação ativa.', details: error.message });
    }
  }
}

module.exports = new VotacoesController();
