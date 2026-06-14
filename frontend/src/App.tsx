import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteDetalhe from './pages/ClienteDetalhe';
import Processos from './pages/Processos';
import ProcessoDetalhe from './pages/ProcessoDetalhe';
import Leads from './pages/Leads';
import Prazos from './pages/Prazos';
import Tarefas from './pages/Tarefas';
import Agenda from './pages/Agenda';
import NovoCliente from './pages/NovoCliente';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } }
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

const Em = ({ titulo }: { titulo: string }) => (
  <div className="p-8">
    <h1 className="font-display text-2xl font-semibold text-primary-800">{titulo}</h1>
    <p className="text-gray-400 text-sm mt-2">Em implementação na Fase 3</p>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/novo-cliente" element={<NovoCliente />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="clientes"      element={<Clientes />} />
            <Route path="clientes/:id"  element={<ClienteDetalhe />} />
            <Route path="processos"     element={<Processos />} />
            <Route path="processos/:id" element={<ProcessoDetalhe />} />
            <Route path="leads"         element={<Leads />} />
            <Route path="prazos"        element={<Prazos />} />
            <Route path="tarefas"       element={<Tarefas />} />
            <Route path="agenda"        element={<Agenda />} />
            <Route path="publicacoes"   element={<Em titulo="Publicações" />} />
            <Route path="templates"     element={<Em titulo="Templates" />} />
            <Route path="documentos"    element={<Em titulo="Documentos" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
