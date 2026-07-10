import client from './client';

export function criarVotacao(payload) {
  return client.post('/votacoes', payload).then((res) => res.data);
}

export function atualizarStatusVotacao(id, status) {
  return client.patch(`/votacoes/${id}/status`, { status }).then((res) => res.data);
}

export function votacaoAtiva(reuniao_id) {
  return client.get('/votacoes/ativa', { params: { reuniao_id } }).then((res) => res.data);
}

export function detalharVotacao(id) {
  return client.get(`/votacoes/${id}`).then((res) => res.data);
}

export function resultadosVotacao(id) {
  return client.get(`/votacoes/${id}/resultados`).then((res) => res.data);
}

export function votar(votacao_id, opcao_escolhida) {
  return client.post('/votacoes/votar', { votacao_id, opcao_escolhida }).then((res) => res.data);
}

export function meuVoto(votacaoId) {
  return client.get(`/votacoes/${votacaoId}/meu-voto`).then((res) => res.data.voto);
}
