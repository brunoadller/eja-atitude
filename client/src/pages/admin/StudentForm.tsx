import { FormEvent, ReactNode, useState } from 'react';
import Modal from '../../components/Modal';
import { EnrollmentForm, maskCep, maskCpf, maskPhone, onlyDigits, validateEnrollment } from '../../helpers/validateStudent';
import { api, money } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { MODULE_NAMES, Student } from '../../types';

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="label">{label} <span className="text-red-500">*</span></label>
      {children}
    </div>
  );
}

const firstOfNextMonth = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 1)).toISOString().slice(0, 10);
};

export default function StudentForm({ student, onClose, onSaved }: { student: Student | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!student;
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [created, setCreated] = useState<{ name: string; enrollment: string; temporaryPassword?: string } | null>(null);

  const [f, setF] = useState<EnrollmentForm>(
    student
      ? { ...student, birthDate: student.birthDate?.slice(0, 10) }
      : { nationality: 'Brasileiro', gender: '', monthlyFee: 199, installments: 6, firstDueDate: firstOfNextMonth() },
  );
  const set = (k: keyof EnrollmentForm, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateEnrollment(f, isEdit);
    setErrors(errs);
    if (errs.length) return;

    const personal = {
      name: f.name!.trim(), cpf: onlyDigits(f.cpf!), rg: f.rg!.trim(), birthDate: f.birthDate, birthplace: f.birthplace!.trim(),
      nationality: (f.nationality || 'Brasileiro').trim(), gender: f.gender, email: f.email!.trim(), phone: onlyDigits(f.phone!),
      address: f.address!.trim(), city: f.city!.trim(), state: f.state!.trim().toUpperCase(), zipCode: onlyDigits(f.zipCode!),
      motherName: f.motherName!.trim(), fatherName: f.fatherName!.trim(), educationLevel: f.educationLevel!.trim(),
      priorStudies: (f.priorStudies || '').trim() || undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api(`students/${student!.id}`, { method: 'PUT', body: { ...personal, status: f.status } });
        toast('Aluno atualizado', 'success');
        onSaved();
        onClose();
      } else {
        const r = await api<Student & { temporaryPassword?: string }>('students', {
          method: 'POST',
          body: {
            ...personal,
            moduleNumber: Number(f.moduleNumber),
            monthlyFee: Number(f.monthlyFee),
            installments: Number(f.installments),
            firstDueDate: f.firstDueDate,
            password: f.password || undefined,
          },
        });
        onSaved();
        setCreated({ name: r.name, enrollment: r.enrollment, temporaryPassword: r.temporaryPassword });
      }
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <Modal title="Matrícula realizada" onClose={onClose}>
        <div className="p-6 grid gap-3 text-sm">
          <p><strong>{created.name}</strong> foi matriculado(a). As parcelas foram geradas e o aluno ficará <strong>ativo</strong> assim que aceitar o contrato no primeiro acesso.</p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <div>Matrícula (login): <code className="font-bold">{created.enrollment}</code></div>
            {created.temporaryPassword && (
              <div className="mt-1">Senha provisória: <code className="font-bold">{created.temporaryPassword}</code></div>
            )}
          </div>
          {created.temporaryPassword && <p className="text-xs text-slate-500">Anote e entregue ao aluno agora: por segurança, esta senha não será exibida novamente. Depois ele pode trocá-la em "Esqueci minha senha".</p>}
          <div className="flex justify-end"><button className="btn-primary" onClick={onClose}>Concluir</button></div>
        </div>
      </Modal>
    );
  }

  const total = Number(f.monthlyFee || 0) * Number(f.installments || 0);

  return (
    <Modal title={isEdit ? 'Editar aluno' : 'Nova matrícula'} onClose={onClose} size="lg">
      <form onSubmit={submit} className="p-6">
        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <div className="font-medium mb-1">Corrija antes de salvar:</div>
            <ul className="list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {!isEdit && (
            <Field label="Módulo da matrícula" full>
              <select className="input" value={f.moduleNumber ?? ''} onChange={(e) => set('moduleNumber', Number(e.target.value))}>
                <option value="">Selecione…</option>
                <option value={1}>{MODULE_NAMES[1]}</option>
                <option value={2}>{MODULE_NAMES[2]}</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">O módulo define a turma, o cronograma e as apostilas que o aluno recebe.</p>
            </Field>
          )}
          <Field label="Nome completo" full><input className="input" value={f.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="CPF"><input className="input" inputMode="numeric" value={f.cpf || ''} onChange={(e) => set('cpf', maskCpf(e.target.value))} placeholder="000.000.000-00" /></Field>
          <Field label="RG (Identidade)"><input className="input" value={f.rg || ''} onChange={(e) => set('rg', e.target.value)} /></Field>
          <Field label="Data de nascimento"><input type="date" className="input" value={f.birthDate || ''} onChange={(e) => set('birthDate', e.target.value)} /></Field>
          <Field label="Naturalidade (cidade / UF)"><input className="input" placeholder="Jaguarão / RS" value={f.birthplace || ''} onChange={(e) => set('birthplace', e.target.value)} /></Field>
          <Field label="Gênero">
            <select className="input" value={f.gender || ''} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Selecione…</option><option>Masculino</option><option>Feminino</option><option>Outro</option>
            </select>
          </Field>
          <Field label="Nacionalidade"><input className="input" value={f.nationality || ''} onChange={(e) => set('nationality', e.target.value)} /></Field>
          <Field label="E-mail (recebe o código de recuperação de senha)"><input type="email" className="input" value={f.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Telefone"><input className="input" inputMode="numeric" value={f.phone || ''} onChange={(e) => set('phone', maskPhone(e.target.value))} placeholder="(53) 99999-9999" /></Field>
          <Field label="Endereço" full><input className="input" value={f.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
          <Field label="Cidade"><input className="input" value={f.city || ''} onChange={(e) => set('city', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="UF"><input className="input" maxLength={2} value={f.state || ''} onChange={(e) => set('state', e.target.value.toUpperCase())} /></Field>
            <Field label="CEP"><input className="input" inputMode="numeric" value={f.zipCode || ''} onChange={(e) => set('zipCode', maskCep(e.target.value))} /></Field>
          </div>
          <Field label="Nome da mãe"><input className="input" value={f.motherName || ''} onChange={(e) => set('motherName', e.target.value)} /></Field>
          <Field label="Nome do pai"><input className="input" placeholder='Se não houver: "Não declarado"' value={f.fatherName || ''} onChange={(e) => set('fatherName', e.target.value)} /></Field>
          <Field label="Nível escolar anterior"><input className="input" placeholder="Ex: Ensino Fundamental completo" value={f.educationLevel || ''} onChange={(e) => set('educationLevel', e.target.value)} /></Field>
          {isEdit && (
            <div>
              <label className="label">Situação</label>
              <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>
                <option value="pending">Aguardando contrato</option><option value="active">Ativo</option>
                <option value="completed">Concluído</option><option value="locked">Trancado</option>
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label">Aproveitamento de estudos (vai na página 2 do certificado)</label>
            <textarea className="input min-h-[70px]" placeholder={'1ª Série Instituto Estadual ... - 2024\n2ª Série Instituto Estadual ... - 2025'} value={f.priorStudies || ''} onChange={(e) => set('priorStudies', e.target.value)} />
          </div>
        </div>

        {!isEdit && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h4 className="font-semibold text-sm mb-3">Mensalidades (geram as parcelas e o carnê)</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Valor de cada parcela (R$)"><input type="number" step="0.01" className="input" value={f.monthlyFee ?? ''} onChange={(e) => set('monthlyFee', e.target.value)} /></Field>
              <Field label="Nº de parcelas"><input type="number" min={1} max={24} className="input" value={f.installments ?? ''} onChange={(e) => set('installments', e.target.value)} /></Field>
              <Field label="1º vencimento"><input type="date" className="input" value={f.firstDueDate || ''} onChange={(e) => set('firstDueDate', e.target.value)} /></Field>
            </div>
            <p className="text-xs text-slate-500 mt-2">{f.installments || 0}x de {money(f.monthlyFee)} = {money(total)}. Os demais vencimentos caem no mesmo dia dos meses seguintes.</p>
            <div className="mt-4">
              <label className="label">Senha inicial (opcional)</label>
              <input className="input max-w-xs" type="text" autoComplete="off" placeholder="deixe em branco para gerar" value={f.password || ''} onChange={(e) => set('password', e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Salvando…' : isEdit ? 'Salvar' : 'Matricular'}</button>
        </div>
      </form>
    </Modal>
  );
}
