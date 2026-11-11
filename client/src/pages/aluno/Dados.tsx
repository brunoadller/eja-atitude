import { ReactNode } from 'react';
import PageHeader, { StatusPill } from '../../components/PageHeader';
import { br, money } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Student } from '../../types';

export default function AlunoDados() {
  const { me } = useAuth();
  const a = me!.user as Student;

  return (
    <>
      <PageHeader title="Minha Matrícula" subtitle="Dados cadastrais e informações do curso" />
      <div className="card">
        <div className="p-6">
          <Row k="Matrícula">
            <code className="bg-neutral-100 px-2 py-0.5 rounded text-xs">{a.enrollment}</code>
          </Row>
          <Row k="Nome">{a.name}</Row>
          <Row k="CPF">{a.cpf || '—'}</Row>
          <Row k="RG">{a.rg || '—'}</Row>
          <Row k="Nascimento">{br(a.birthDate)}</Row>
          <Row k="Sexo">{a.gender || '—'}</Row>
          <Row k="Nome da mãe">{a.motherName || '—'}</Row>
          <Row k="Nome do pai">{a.fatherName || '—'}</Row>
          <Row k="Email">{a.email || '—'}</Row>
          <Row k="Telefone">{a.phone || '—'}</Row>
          <Row k="Endereço">
            {a.address ? `${a.address}${a.city ? `, ${a.city}` : ''}${a.state ? `/${a.state}` : ''}` : '—'}
          </Row>
          <Row k="CEP">{a.zipCode || '—'}</Row>
          <Row k="Modalidade">{a.modality || '—'}</Row>
          <Row k="Turma">{a.classGroup || '—'}</Row>
          <Row k="Data da matrícula">{br(a.enrollmentDate)}</Row>
          <Row k="Mensalidade">{money(a.monthlyFee)}</Row>
          <Row k="Status">
            <StatusPill status={a.status} />
          </Row>
        </div>
      </div>
    </>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[200px_1fr] py-3 border-b border-slate-100 last:border-none text-sm">
      <div className="text-slate-500">{k}</div>
      <div>{children}</div>
    </div>
  );
}
