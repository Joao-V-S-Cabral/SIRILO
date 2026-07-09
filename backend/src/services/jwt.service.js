const jwt = require('jsonwebtoken');

// Em produção real isso viria de uma variável de ambiente (process.env.JWT_SECRET).
// Para o protótipo acadêmico, mantemos um valor fixo documentado aqui.
const JWT_SECRET = process.env.JWT_SECRET || 'sirilo_prototipo_chave_de_desenvolvimento';
const JWT_EXPIRES_IN = '8h'; // suficiente para cobrir toda uma sessão de assembleia

/**
 * Emite um token JWT contendo os dados mínimos necessários para autorizar
 * as próximas requisições, sem precisar consultar o corpo da requisição
 * (que pode ser adulterado pelo cliente).
 *
 * @param {{ perfil: 'Admin'|'Proprietario'|'Procurador', proprietario_id: number, procurador_id?: number|null, reuniao_id?: number|null }} payload
 */
function emitirToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica e decodifica um token JWT. Lança erro se inválido/expirado.
 * @param {string} token
 */
function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { emitirToken, verificarToken, JWT_SECRET };
