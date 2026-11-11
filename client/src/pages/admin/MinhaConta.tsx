import { FormEvent, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import { AdminUser } from '../../types';

/** Portal da secretaria: trocar a própria senha e cadastrar o e-mail de recuperação. */
export default function MinhaConta() {
  const { me } = useAuth();
  const admin = me!.user as AdminUser;

  return (
    <>
      <PageHeader title="Minha conta" subtitle={`Usuário: ${admin.username}`} />
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <ChangePasswordCard />
        <RecoveryEmailCard currentEmail={admin.email ?? ''} />
      </div>
    </>
  );
}

function ChangePasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    if (pass !== pass2) return setErr('As senhas não conferem. Digite a mesma senha nos dois campos.');
    setBusy(true);
    try {
      await api('auth/admin/change-password', {
        method: 'POST',
        body: { currentPassword: current, newPassword: pass, newPasswordConfirm: pass2 },
      });
      setCurrent('');
      setPass('');
      setPass2('');
      toast('Senha alterada. As outras sessões abertas foram encerradas.', 'success');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <h2 className="font-semibold mb-1">Trocar senha</h2>
      <p className="text-sm text-slate-500 mb-5">Mínimo de 8 caracteres, com letras e números.</p>
      {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

      <label className="label">Senha atual</label>
      <input className="input mb-3" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      <label className="label">Nova senha</label>
      <input className="input mb-3" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" minLength={8} required />
      <label className="label">Repita a nova senha</label>
      <input className="input mb-5" type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" minLength={8} required />

      <button className="btn-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
    </form>
  );
}

function RecoveryEmailCard({ currentEmail }: { currentEmail: string }) {
  const { refresh } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState(currentEmail);
  const [current, setCurrent] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('auth/admin/email', { method: 'PUT', body: { email, currentPassword: current } });
      setCurrent('');
      await refresh();
      toast('E-mail de recuperação salvo.', 'success');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <h2 className="font-semibold mb-1">E-mail de recuperação</h2>
      <p className="text-sm text-slate-500 mb-5">
        {currentEmail
          ? 'Se você esquecer a senha, o código de recuperação vai para este e-mail.'
          : 'Nenhum e-mail cadastrado. Sem ele não é possível recuperar a senha pelo "Esqueci minha senha".'}
      </p>
      {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

      <label className="label">E-mail</label>
      <input className="input mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      <label className="label">Senha atual (para confirmar)</label>
      <input className="input mb-5" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />

      <button className="btn-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar e-mail'}</button>
    </form>
  );
}
