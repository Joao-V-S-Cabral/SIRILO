const connection = require('../database/connection');
const auditoriaService = require('./auditoria.service');

/**
 * Encerra automaticamente uma votação "Aberta" cujo tempo (duracao_minutos
 * a partir de aberta_em) já se esgotou — RF15/RF21, o ator "Tempo" do ERSW
 * é responsável por isso, não apenas o Admin clicando em "Encerrar".
 *
 * Não existe um job em segundo plano rodando: a verificação é "lazy",
 * disparada pelos próprios endpoints que leem ou usam a votação
 * (buscarAtiva, detalhar, resultados, votar). Isso é suficiente na prática
 * porque o frontend faz polling frequente em qualquer uma dessas rotas
 * enquanto alguém está acompanhando ou tentando votar.
 *
 * @param {import('express').Request} req usado só para IP/navegador no log de auditoria
 * @param {object|undefined} votacao a linha da votação já carregada do banco
 * @returns {Promise<object|undefined>} a mesma votação, ou com status "Encerrada" se acabou de expirar agora
 */
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
