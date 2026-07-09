import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { loginComSenha, loginComToken } from '../api/auth';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { autenticado, login } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState('senha');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tokenReuniao, setTokenReuniao] = useState('');
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  if (autenticado) return <Navigate to="/reunioes" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const dados =
        modo === 'senha' ? await loginComSenha(email, senha) : await loginComToken(email, tokenReuniao);
      login(dados);
      navigate('/reunioes');
    } catch (err) {
      setErro(extractErrorMessage(err, 'Não foi possível fazer login.'));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">SIRILO</h1>
        <p className="login-subtitle">Sistema Interativo de Reunião e Integração Local</p>

        <div className="tabs">
          <button
            type="button"
            className={modo === 'senha' ? 'tab tab-active' : 'tab'}
            onClick={() => setModo('senha')}
          >
            Proprietário / Admin
          </button>
          <button
            type="button"
            className={modo === 'token' ? 'tab tab-active' : 'tab'}
            onClick={() => setModo('token')}
          >
            Procurador
          </button>
        </div>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        {modo === 'senha' ? (
          <label className="field">
            <span>Senha</span>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </label>
        ) : (
          <label className="field">
            <span>Token da Reunião</span>
            <input
              type="text"
              value={tokenReuniao}
              onChange={(e) => setTokenReuniao(e.target.value)}
              placeholder="Ex: PROCURADOR_DEMO"
              required
            />
          </label>
        )}

        {erro && <p className="error-text">{erro}</p>}

        <button type="submit" className="btn btn-primary" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
