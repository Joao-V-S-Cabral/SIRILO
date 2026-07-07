const express = require('express');
const cors = require('cors');

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

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Backend] Express ativo localmente na porta ${PORT}`);
});
