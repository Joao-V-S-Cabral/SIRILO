const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Registra o centralizador de rotas
app.use(routes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Backend] Express ativo localmente na porta ${PORT}`);
});
