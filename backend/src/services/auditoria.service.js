const connection = require('../database/connection');


function extrairIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'desconhecido';
}


function extrairNavegador(req) {
  return req.headers['user-agent'] || 'desconhecido';
}


async function registrar(req, { proprietario_id = null, procurador_id = null, acao }) {
  try {
    await connection('logs_auditoria').insert({
      proprietario_id,
      procurador_id,
      acao,
      // O default da coluna (CURRENT_TIMESTAMP) grava em UTC; como o SIRILO
      // roda num único servidor local, gravamos direto no horário local do
      // servidor para exibir a hora correta no log de auditoria.
      data_hora: connection.raw("datetime('now', 'localtime')"),
      ip: extrairIp(req),
      navegador: extrairNavegador(req)
    });
  } catch (error) {
    console.error('[Auditoria] Falha ao registrar log:', error.message);
  }
}

module.exports = {
  registrar,
  extrairIp,
  extrairNavegador
};
