import client from './client';

// O SQLite retorna 0/1 (numero) para o campo booleano tem_anexo, e em JSX
// `{0 && <Botao/>}` renderiza literalmente o texto "0" na tela. Normaliza
// para um boolean de fato assim que os dados chegam do backend.
function comTemAnexoNormalizado(reuniao) {
  return {
    ...reuniao,
    pautas: (reuniao.pautas || []).map((pauta) => ({ ...pauta, tem_anexo: Boolean(pauta.tem_anexo) })),
  };
}

export function listarReunioes() {
  return client.get('/reunioes').then((res) => res.data.map(comTemAnexoNormalizado));
}

export function detalharReuniao(id) {
  return client.get(`/reunioes/${id}`).then((res) => comTemAnexoNormalizado(res.data));
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

export function removerAnexoPauta(pautaId) {
  return client.delete(`/pautas/${pautaId}/anexo`).then((res) => res.data);
}
