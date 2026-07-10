const connection = require('../database/connection');

class AuditoriaController {
  
  async listar(req, res) {
    try {
      const logs = await connection('logs_auditoria')
        .leftJoin('proprietarios', 'logs_auditoria.proprietario_id', 'proprietarios.id')
        .leftJoin('procuradores', 'logs_auditoria.procurador_id', 'procuradores.id')
        .select(
          'logs_auditoria.id',
          'logs_auditoria.acao',
          'logs_auditoria.data_hora',
          'logs_auditoria.ip',
          'logs_auditoria.navegador',
          'proprietarios.nome as proprietario_nome',
          'procuradores.nome as procurador_nome'
        )
        .orderBy('logs_auditoria.data_hora', 'desc');

      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar logs de auditoria.', details: error.message });
    }
  }
}

module.exports = new AuditoriaController();
