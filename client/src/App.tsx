import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminAlunos from './pages/admin/Alunos';
import AdminApostilas from './pages/admin/Apostilas';
import AdminBoletos from './pages/admin/Boletos';
import AdminDashboard from './pages/admin/Dashboard';
import AdminDocumentos from './pages/admin/Documentos';
import AdminMinhaConta from './pages/admin/MinhaConta';
import AdminNotas from './pages/admin/Notas';
import AlunoLayout from './pages/aluno/AlunoLayout';
import AlunoApostilas from './pages/aluno/Apostilas';
import AlunoBoletos from './pages/aluno/Boletos';
import Contrato from './pages/aluno/Contrato';
import AlunoDados from './pages/aluno/Dados';
import AlunoDashboard from './pages/aluno/Dashboard';
import AlunoNotas from './pages/aluno/Notas';
import Atestado from './pages/aluno/secretaria/Atestado';
import Diploma from './pages/aluno/secretaria/Diploma';
import DocumentosMatricula from './pages/aluno/secretaria/DocumentosMatricula';
import SecretariaLayout from './pages/aluno/secretaria/SecretariaLayout';

import AdminCronograma from './pages/admin/Cronograma';
import AlunoCronograma from './pages/aluno/Cronograma';
import type { Student } from './types';

export default function App() {
  const { me, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-400 text-sm">
        Carregando…
      </div>
    );
  }

  if (!me) {
    return (
      <Routes>
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (me.type === 'admin') {
    return (
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="alunos" element={<AdminAlunos />} />
          <Route path="notas" element={<AdminNotas />} />
          <Route path="boletos" element={<AdminBoletos />} />
          <Route path="apostilas" element={<AdminApostilas />} />
          <Route path="documentos" element={<AdminDocumentos />} />
          <Route path="cronograma" element={<AdminCronograma />} />
          <Route path="minha-conta" element={<AdminMinhaConta />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  // Gate de contrato: aluno precisa aceitar antes de acessar a plataforma
  const aluno = me.user as Student;
  if (!aluno.contractAccepted) return <Contrato gate />;

  return (
    <Routes>
      <Route path="/" element={<AlunoLayout />}>
        <Route index element={<AlunoDashboard />} />
        <Route path="matricula" element={<AlunoDados />} />
        <Route path="apostilas" element={<AlunoApostilas />} />
        <Route path="notas" element={<AlunoNotas />} />
        <Route path="boletos" element={<AlunoBoletos />} />
        <Route path="cronograma" element={<AlunoCronograma />} />
        <Route path="secretaria" element={<SecretariaLayout />}>
          <Route index element={<Navigate to="atestado" replace />} />
          <Route path="atestado" element={<Atestado />} />
          <Route path="diploma" element={<Diploma />} />
          <Route path="documentos" element={<DocumentosMatricula />} />
        </Route>
        <Route path="contrato" element={<Contrato />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        

      </Route>
    </Routes>
  );
}
