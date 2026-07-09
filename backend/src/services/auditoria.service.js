const connection = require('../database/connection');

/**
 * Extrai o IP real do requisitante, considerando proxies reversos (ex: Vite).
 * @param {import('express').Request} req
 */
function extrairIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'desconhecido';
}

/**
 * Extrai o User-Agent do navegador que originou a requisição.
 * @param {import('express').Request} req
 */
function extrairNavegador(req) {
  return req.headers['user-agent'] || 'desconhecido';
}

/**
 * Registra uma ação no log de auditoria (RF4).
 * Nunca deve lançar exceção que interrompa o fluxo principal da requisição:
 * falha de auditoria é logada no console, mas não derruba a operação de negócio.
 *
 * @param {import('express').Request} req
 * @param {{ proprietario_id?: number|null, procurador_id?: number|null, acao: string }} dados
 */
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
