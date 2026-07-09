import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { sessao, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const nomeExibido = sessao?.nome || sessao?.proprietario_representado?.nome || sessao?.perfil;

  return (
    <header className="navbar">
      <div className="navbar-brand">SIRILO</div>
      <nav className="navbar-links">
        <NavLink to="/reunioes" className={({ isActive }) => (isActive ? 'active' : '')}>
          Reuniões
        </NavLink>
        {isAdmin && (
          <NavLink to="/auditoria" className={({ isActive }) => (isActive ? 'active' : '')}>
            Auditoria
          </NavLink>
        )}
      </nav>
      <div className="navbar-user">
        <span className="navbar-user-name">
          {nomeExibido} <span className="badge badge-neutral">{sessao?.perfil}</span>
        </span>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}
