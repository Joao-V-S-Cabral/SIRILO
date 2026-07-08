const connection = require('../database/connection');

class AdminController {
  async resetDb(req, res) {
    const { secret } = req.query;

    // Validação simples de segurança contra acidentes
    if (secret !== 'SIRILO_RESET_SECRET') {
      return res.status(403).json({ error: 'Acesso negado: token inválido.' });
    }

    try {
      console.log('[Database] Reset acionado pelo administrador...');

      // Roda os rollbacks e migrações em tempo de execução
      await connection.migrate.rollback(null, true); // Rola de volta todas as tabelas
      await connection.migrate.latest();             // Recria todas as tabelas atualizadas
      await connection.seed.run();                   // Insere a massa de dados padrão

      console.log('[Database] Reset e seeds executados com sucesso!');

      return res.json({ 
        status: 'success', 
        message: 'Banco de dados reinicializado e sementes aplicadas com sucesso!' 
      });
    } catch (error) {
      console.error('[Database Error] Falha ao resetar banco de dados:', error);
      return res.status(500).json({ 
        error: 'Falha ao processar reconfiguração do banco de dados.', 
        details: error.message 
      });
    }
  }
}

module.exports = new AdminController();
