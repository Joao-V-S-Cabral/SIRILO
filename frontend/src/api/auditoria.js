import client from './client';

export function listarAuditoria() {
  return client.get('/auditoria').then((res) => res.data);
}
