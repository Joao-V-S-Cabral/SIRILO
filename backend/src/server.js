const express = require('express');
const cors = require('cors');
const connection = require('./database/connection');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint simples de status para validação de conectividade
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Comunicação com o Backend do SIRILO estabelecida!' 
  });
});

app.get('/api/debug-data', async (req, res) => {
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
});

// Endpoint Administrativo de Reset (Importante para a Apresentação)
app.post('/api/admin/reset-db', async (req, res) => {
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
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Backend] Express ativo localmente na porta ${PORT}`);
});
