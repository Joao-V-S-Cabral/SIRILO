const connection = require('../database/connection');
const auditoriaService = require('../services/auditoria.service');

const STATUS_VALIDOS = ['Agendada', 'Em_Andamento', 'Encerrada'];

class ReunioesController {
  /** GET /api/reunioes - lista reuniões com suas pautas */
  async listar(req, res) {
    try {
      const reunioes = await connection('reunioes').select('*').orderBy('data', 'desc');
      const pautas = await connection('pautas').select(
        'id', 'reuniao_id', 'titulo', 'descricao'
      );

      const resultado = reunioes.map(reuniao => ({
        ...reuniao,
        pautas: pautas.filter(p => p.reuniao_id === reuniao.id)
      }));

      return res.json(resultado);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar reuniões.', details: error.message });
    }
  }

  /** GET /api/reunioes/:id - detalhe de uma reunião com pautas e votações */
  async detalhar(req, res) {
    const { id } = req.params;

    try {
      const reuniao = await connection('reunioes').where({ id }).first();
      if (!reuniao) {
        return res.status(404).json({ error: 'Reunião não encontrada.' });
      }

      const pautas = await connection('pautas')
        .where({ reuniao_id: id })
        .select('id', 'reuniao_id', 'titulo', 'descricao');

      const votacoes = await connection('votacoes').where({ reuniao_id: id });

      const pautasComVotacoes = pautas.map(pauta => ({
        ...pauta,
        votacoes: votacoes.filter(v => v.pauta_id === pauta.id)
      }));

      return res.json({ ...reuniao, pautas: pautasComVotacoes });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao detalhar reunião.', details: error.message });
    }
  }

  /**
   * PATCH /api/reunioes/:id/status  (RF9)
   * Body: { status: 'Agendada' | 'Em_Andamento' | 'Encerrada' }
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
      const reuniao = await connection('reunioes').where({ id }).first();
      if (!reuniao) {
        return res.status(404).json({ error: 'Reunião não encontrada.' });
      }

      // Regra de negócio: não é possível reabrir uma reunião já encerrada.
      if (reuniao.status === 'Encerrada' && status !== 'Encerrada') {
        return res.status(400).json({ error: 'Uma reunião encerrada não pode ser reaberta.' });
      }

      await connection('reunioes').where({ id }).update({ status });

      await auditoriaService.registrar(req, {
        acao: `Reunião ${id} alterada para status "${status}"`
      });

      return res.json({ status: 'success', message: `Reunião atualizada para "${status}".` });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar status da reunião.', details: error.message });
    }
  }

  /** GET /api/pautas/:id/anexo - baixa o PDF anexado à pauta (RF30) */
  async baixarAnexo(req, res) {
    const { id } = req.params;

    try {
      const pauta = await connection('pautas').where({ id }).first();

      if (!pauta) {
        return res.status(404).json({ error: 'Pauta não encontrada.' });
      }

      if (!pauta.anexo_pdf) {
        return res.status(404).json({ error: 'Esta pauta não possui anexo.' });
      }

      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `inline; filename="pauta_${id}.pdf"`);
      return res.send(pauta.anexo_pdf);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao baixar anexo da pauta.', details: error.message });
    }
  }
}

module.exports = new ReunioesController();
