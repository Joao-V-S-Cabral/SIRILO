import React, { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('Estabelecendo conexão...');

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setStatus(`${data.message} [Status: ${data.status.toUpperCase()}]`))
      .catch(() => setStatus('Falha de conexão: Verifique se o backend está ativo.'));
  }, []);

  return (
    <div style={{
      fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: '#f8fafc',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: '#38bdf8' }}>SIRILO</h1>
      <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '2rem' }}>
        Fase 1: Configuração e Validação de Conectividade
      </p>
      
      <div style={{
        padding: '24px',
        borderRadius: '16px',
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        maxWidth: '450px',
        backdropFilter: 'blur(8px)'
      }}>
        <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Status de Conectividade:</h3>
        <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold' }}>{status}</p>
      </div>
    </div>
  );
}

export default App;
