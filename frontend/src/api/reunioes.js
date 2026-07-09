import client from './client';

export function listarReunioes() {
  return client.get('/reunioes').then((res) => res.data);
}

export function detalharReuniao(id) {
  return client.get(`/reunioes/${id}`).then((res) => res.data);
}

export function atualizarStatusReuniao(id, status) {
  return client.patch(`/reunioes/${id}/status`, { status }).then((res) => res.data);
}

export function criarPauta(reuniao_id, titulo, descricao) {
  return client.post('/pautas', { reuniao_id, titulo, descricao }).then((res) => res.data);
}

export function uploadAnexoPauta(pautaId, arquivo) {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  return client
    .post(`/pautas/${pautaId}/anexo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
}

export async function baixarAnexoPauta(pautaId, nomeArquivo = `pauta_${pautaId}.pdf`) {
  const res = await client.get(`/pautas/${pautaId}/anexo`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
