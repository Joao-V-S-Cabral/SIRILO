const connection = require('../database/connection');
const auditoriaService = require('./auditoria.service');


async function encerrarSeExpirada(req, votacao) {
  if (!votacao || votacao.status !== 'Aberta' || !votacao.aberta_em) {
    return votacao;
  }

  const abertaEmMs = new Date(votacao.aberta_em.replace(' ', 'T')).getTime();
  const expiraEmMs = abertaEmMs + votacao.duracao_minutos * 60 * 1000;

  if (Date.now() < expiraEmMs) {
    return votacao;
  }

  await connection('votacoes').where({ id: votacao.id }).update({ status: 'Encerrada' });

  await auditoriaService.registrar(req, {
    acao: `Votação ${votacao.id} encerrada automaticamente (tempo esgotado)`
  });

  return { ...votacao, status: 'Encerrada' };
}

module.exports = { encerrarSeExpirada };
