import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { maskCpf, onlyDigits } from '../helpers/validateStudent';

type Step = 'cpf' | 'code' | 'password' | 'done';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('cpf');
  const [cpf, setCpf] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setErr('');
    setBusy(true);
    try { await fn(); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  const sendCpf = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const r = await api<{ message: string }>('auth/forgot-password/request', { method: 'POST', body: { cpf: onlyDigits(cpf) } });
      setMsg(r.message);
      setStep('code');
    });
  };

  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const r = await api<{ resetToken: string }>('auth/forgot-password/verify', { method: 'POST', body: { cpf: onlyDigits(cpf), code } });
      setToken(r.resetToken);
      setStep('password');
    });
  };

  const sendPassword = (e: FormEvent) => {
    e.preventDefault();
    if (pass !== pass2) return setErr('As senhas não conferem. Digite a mesma senha nos dois campos.');
    run(async () => {
      await api('auth/forgot-password/reset', { method: 'POST', body: { resetToken: token, password: pass, passwordConfirm: pass2 } });
      setStep('done');
    });
  };

  const titles: Record<Step, string> = {
    cpf: 'Esqueci minha senha',
    code: 'Confirme o código',
    password: 'Cadastre a nova senha',
    done: 'Senha alterada!',
  };

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight mb-1">{titles[step]}</h2>
        {step === 'cpf' && <p className="text-sm text-slate-500 mb-6">Informe o CPF do aluno. Enviaremos um código para o e-mail cadastrado na matrícula.</p>}
        {step === 'code' && <p className="text-sm text-slate-500 mb-6">{msg} O código tem 6 dígitos e vale por 10 minutos.</p>}
        {step === 'password' && <p className="text-sm text-slate-500 mb-6">Mínimo de 8 caracteres, com letras e números. Digite a senha duas vezes.</p>}
        {step === 'done' && <p className="text-sm text-slate-500 mb-6">Sua senha foi atualizada. Entre com a matrícula e a nova senha.</p>}

        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

        {step === 'cpf' && (
          <form onSubmit={sendCpf}>
            <label className="label">CPF</label>
            <input className="input mb-5" inputMode="numeric" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" required />
            <button className="btn-primary w-full" disabled={busy || onlyDigits(cpf).length !== 11}>{busy ? 'Enviando…' : 'Enviar código'}</button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={sendCode}>
            <label className="label">Código recebido por e-mail</label>
            <input className="input mb-5 tracking-[0.4em] text-center text-lg" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(onlyDigits(e.target.value))} placeholder="000000" required />
            <button className="btn-primary w-full" disabled={busy || code.length !== 6}>{busy ? 'Verificando…' : 'Confirmar código'}</button>
            <button type="button" className="btn-ghost w-full mt-2" onClick={() => { setCode(''); setErr(''); setStep('cpf'); }}>Reenviar código</button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={sendPassword}>
            <label className="label">Nova senha</label>
            <input className="input mb-3" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" required />
            <label className="label">Repita a nova senha</label>
            <input className="input mb-5" type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" required />
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
          </form>
        )}

        {step === 'done' && <button className="btn-primary w-full" onClick={() => nav('/')}>Ir para o login</button>}

        {step !== 'done' && (
          <div className="mt-5 text-center"><Link to="/" className="text-sm text-slate-500 hover:underline">Voltar ao login</Link></div>
        )}
      </div>
    </div>
  );
}
