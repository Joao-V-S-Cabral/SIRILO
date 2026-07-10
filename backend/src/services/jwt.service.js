const jwt = require('jsonwebtoken');

// Em produção real isso viria de uma variável de ambiente (process.env.JWT_SECRET).
// Para o protótipo acadêmico, mantemos um valor fixo documentado aqui.
const JWT_SECRET = process.env.JWT_SECRET || 'sirilo_prototipo_chave_de_desenvolvimento';
const JWT_EXPIRES_IN = '8h'; // suficiente para cobrir toda uma sessão de assembleia


function emitirToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}


function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { emitirToken, verificarToken, JWT_SECRET };
