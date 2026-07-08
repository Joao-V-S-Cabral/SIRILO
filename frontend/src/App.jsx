import React, { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('Estabelecendo conexão...');
  const [dbData, setDbData] = useState(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setStatus(`${data.message} [Status: ${data.status.toUpperCase()}]`);
        // Se a conexão funcionar, busca os dados de debug
        return fetch('/api/debug-data');
      })
      .then((res) => {
        if (res && res.ok) return res.json();
      })
      .then((data) => {
        if (data) setDbData(data);
      })
      .catch(() => setStatus('Falha de conexão: Verifique se o backend está ativo.'));
  }, []);

  return (
    <div style={{
      fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: '#f8fafc',
      textAlign: 'center',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', color: '#38bdf8' }}>SIRILO</h1>
      <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: '0 0 2rem 0' }}>
        Fase 2: Configuração e Validação de Persistência (Dados do Banco)
      </p>
      
      {/* Caixa de Status */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '16px',
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        width: '100%',
        backdropFilter: 'blur(8px)',
        marginBottom: '2rem',
        boxSizing: 'border-box'
      }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9', fontSize: '1.1rem', marginBottom: '8px' }}>Status de Conectividade:</h3>
        <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold' }}>{status}</p>
      </div>

      {/* Seção de Dados Crus */}
      {dbData && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '900px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Tabela Proprietários */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'left',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '8px' }}>
              👤 Proprietários Cadastrados (`proprietarios`)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>ID</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Nome</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Email</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Lotes</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Peso Voto</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Inadimplente</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {dbData.proprietarios.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{p.id}</td>
                      <td style={{ padding: '8px' }}>{p.nome}</td>
                      <td style={{ padding: '8px', color: '#38bdf8' }}>{p.email}</td>
                      <td style={{ padding: '8px' }}>{p.lotes}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{p.peso_voto}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          background: p.inadimplente ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: p.inadimplente ? '#f87171' : '#34d399'
                        }}>
                          {p.inadimplente ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>{p.tipo_acesso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Tabela Reuniões */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'left',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(8px)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#818cf8', borderBottom: '1px solid rgba(129, 140, 248, 0.2)', paddingBottom: '8px' }}>
                📅 Reuniões Ativas (`reunioes`)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>ID</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Assembleia</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Data/Hora</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.reunioes.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{r.id}</td>
                        <td style={{ padding: '8px' }}>{r.nome_assembleia}</td>
                        <td style={{ padding: '8px' }}>{r.data} às {r.hora}</td>
                        <td style={{ padding: '8px', color: '#818cf8', fontWeight: 'bold' }}>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela Procuradores */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'left',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(8px)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#fb7185', borderBottom: '1px solid rgba(251, 113, 133, 0.2)', paddingBottom: '8px' }}>
                🤝 Procuradores (`procuradores`)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>ID</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Nome</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Email</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Token</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.procuradores.map(pr => (
                      <tr key={pr.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{pr.id}</td>
                        <td style={{ padding: '8px' }}>{pr.nome}</td>
                        <td style={{ padding: '8px' }}>{pr.email}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#fb7185', fontFamily: 'monospace' }}>{pr.token_reuniao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
