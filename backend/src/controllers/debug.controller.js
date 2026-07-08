const connection = require('../database/connection');

class DebugController {
  getStatus(req, res) {
    return res.json({ 
      status: 'online', 
      message: 'Comunicação com o Backend do SIRILO estabelecida!' 
    });
  }

  async getDebugData(req, res) {
    try {
      const proprietarios = await connection('proprietarios').select('id', 'nome', 'email', 'lotes', 'peso_voto', 'inadimplente', 'tipo_acesso');
      const reunioes = await connection('reunioes').select('id', 'nome_assembleia', 'data', 'hora', 'status');
      const procuradores = await connection('procuradores').select('id', 'nome', 'email', 'token_reuniao');
      
      return res.json({
        proprietarios,
        reunioes,
        procuradores
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar dados de debug.', details: error.message });
    }
  }
}

module.exports = new DebugController();
