const { verificarToken } = require('../services/jwt.service');


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


function apenasAdmin(req, res, next) {
  if (!req.usuario || req.usuario.perfil !== 'Admin') {
    return res.status(403).json({ error: 'Acesso restrito ao Administrador.' });
  }
  return next();
}


function apenasVotante(req, res, next) {
  if (!req.usuario || !['Proprietario', 'Procurador'].includes(req.usuario.perfil)) {
    return res.status(403).json({ error: 'Apenas proprietários ou procuradores podem votar.' });
  }
  return next();
}

module.exports = { autenticar, apenasAdmin, apenasVotante };
