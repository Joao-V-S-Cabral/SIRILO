import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

function lerSessaoSalva() {
  const raw = localStorage.getItem('sirilo_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessaoSalva);

  useEffect(() => {
    if (sessao) {
      localStorage.setItem('sirilo_token', sessao.token);
      localStorage.setItem('sirilo_session', JSON.stringify(sessao));
    }
  }, [sessao]);

  function login(dadosLogin) {
    setSessao(dadosLogin);
  }

  function logout() {
    setSessao(null);
    localStorage.removeItem('sirilo_token');
    localStorage.removeItem('sirilo_session');
  }

  const value = {
    sessao,
    autenticado: Boolean(sessao?.token),
    perfil: sessao?.perfil ?? null,
    isAdmin: sessao?.perfil === 'Admin',
    isVotante: sessao?.perfil === 'Proprietario' || sessao?.perfil === 'Procurador',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  return ctx;
}
