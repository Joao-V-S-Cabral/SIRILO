const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Backend] Express ativo localmente na porta ${PORT}`);
});
