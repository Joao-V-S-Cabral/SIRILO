import { useEffect, useState } from 'react';
import { listarAuditoria } from '../api/auditoria';
import { extractErrorMessage } from '../api/client';

export function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listarAuditoria()
      .then(setLogs)
      .catch((err) => setErro(extractErrorMessage(err, 'Não foi possível carregar os logs de auditoria.')))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <p>Carregando auditoria...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Log de Auditoria</h1>
      </div>

      {erro && <p className="error-text">{erro}</p>}

      <div className="card table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Ação</th>
              <th>Responsável</th>
              <th>Data/Hora</th>
              <th>IP</th>
              <th>Navegador</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td data-label="Ação">{log.acao}</td>
                <td data-label="Responsável">{log.proprietario_nome || log.procurador_nome || '—'}</td>
                <td data-label="Data/Hora">{log.data_hora}</td>
                <td data-label="IP">{log.ip}</td>
                <td data-label="Navegador" className="cell-truncate" title={log.navegador}>
                  {log.navegador}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  Nenhum registro de auditoria ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
