const { verificarToken } = require('../services/jwt.service');

/**
 * Middleware de autenticação (RF de segurança).
 * Exige um header `Authorization: Bearer <token>` válido, emitido no login.
 * Em caso de sucesso, popula `req.usuario` com os dados confiáveis do token
 * (perfil, proprietario_id, procurador_id, reuniao_id) — o restante da
 * aplicação NUNCA deve confiar em proprietario_id/procurador_id vindos do
 * corpo da requisição, apenas nos valores de `req.usuario`.
 */
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente. Faça login novamente.' });
  }

  const token = authHeader.substring('Bearer '.length);

  try {
    const payload = verificarToken(token);
    req.usuario = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
  }
}

/**
 * Middleware de autorização: restringe a rota ao perfil "Admin".
 * Deve ser usado sempre depois de `autenticar`.
 */
function apenasAdmin(req, res, next) {
  if (!req.usuario || req.usuario.perfil !== 'Admin') {
    return res.status(403).json({ error: 'Acesso restrito ao Administrador.' });
  }
  return next();
}

/**
 * Middleware de autorização: restringe a rota a quem pode efetivamente votar
 * (Proprietário ou Procurador). Bloqueia o Admin de registrar votos.
 */
function apenasVotante(req, res, next) {
  if (!req.usuario || !['Proprietario', 'Procurador'].includes(req.usuario.perfil)) {
    return res.status(403).json({ error: 'Apenas proprietários ou procuradores podem votar.' });
  }
  return next();
}

module.exports = { autenticar, apenasAdmin, apenasVotante };
