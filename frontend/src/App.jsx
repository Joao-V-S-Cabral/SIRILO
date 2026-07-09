import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ReunioesListPage } from './pages/ReunioesListPage';
import { ReuniaoDetailPage } from './pages/ReuniaoDetailPage';
import { ResultadosPage } from './pages/ResultadosPage';
import { AuditoriaPage } from './pages/AuditoriaPage';

function HomeRedirect() {
  const { autenticado } = useAuth();
  return <Navigate to={autenticado ? '/reunioes' : '/login'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/reunioes" element={<ReunioesListPage />} />
              <Route path="/reunioes/:id" element={<ReuniaoDetailPage />} />
              <Route path="/votacoes/:id/resultados" element={<ResultadosPage />} />

              <Route element={<AdminRoute />}>
                <Route path="/auditoria" element={<AuditoriaPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
