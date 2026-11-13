import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { SCHOOL_LOGO, useSchool } from '../lib/school';

export default function Login() {
  const { login } = useAuth();
  const school = useSchool();
  const [tipo, setTipo] = useState<'student' | 'admin'>('student');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(tipo, usuario, senha);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2">
      {/* HERO DO CELULAR E DO TABLET: faixa compacta; o formulário sobe por cima dela */}
      <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-6 pb-10 grid place-items-center">
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-sky-400/20 blur-3xl" />
        {/* logo tem letras escuras: fica numa caixa branca para aparecer no fundo escuro */}
        <div className="relative bg-white rounded-xl px-4 py-2 shadow-sm">
          <img src={SCHOOL_LOGO} alt={school?.name ?? 'Logo da escola'} className="h-12 w-auto" />
        </div>
      </div>

      {/* HERO */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-500/30 blur-3xl" />
        {/* logo tem letras escuras: fica numa caixa branca para aparecer no fundo escuro */}
        <div className="relative self-start bg-white rounded-xl px-4 py-2 shadow-sm">
          <img src={SCHOOL_LOGO} alt={school?.name ?? 'Logo da escola'} className="h-14 w-auto" />
        </div>
        <div className="relative">
          <h1 className="text-5xl font-bold tracking-tight leading-[1.05] mb-5">
            Educação de Jovens e Adultos,<br />no seu ritmo.
          </h1>
          <p className="text-slate-300 max-w-md leading-relaxed">
            Matrícula, apostilas, boletos e certificados em um só lugar.
            Estude a distância com toda a estrutura de uma escola presencial.
          </p>
          <div className="grid gap-3 mt-10">
            <Feat icon="📚" text="Apostilas de todas as disciplinas" />
            <Feat icon="📄" text="Atestado de matrícula com 1 clique" />
            <Feat icon="🏦" text="Boletos e histórico financeiro" />
            <Feat icon="🎓" text="Certificado ao concluir o curso" />
          </div>
        </div>
        <div className="relative text-xs text-slate-400">
          © {new Date().getFullYear()}{school ? ` ${school.legalName}` : ''} · Todos os direitos reservados
        </div>
      </div>

      {/* FORM */}
      {/* no celular o cartão branco sobe sobre a faixa escura (cantos de cima arredondados) */}
      <div className="flex-1 relative -mt-6 rounded-t-3xl bg-white px-6 pt-6 pb-8 grid justify-items-center items-start lg:mt-0 lg:rounded-none lg:items-center lg:p-10">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Bem-vindo(a)</h2>
          <p className="text-slate-500 mb-8">Acesse a plataforma EJA para continuar seus estudos.</p>

          <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-50 border border-slate-200 rounded-lg mb-6">
            {(['student', 'admin'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`py-2 text-sm font-medium rounded-md transition ${
                  tipo === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t === 'student' ? 'Aluno' : 'Secretaria'}
              </button>
            ))}
          </div>

          {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

          <div className="mb-4">
            <label className="label">{tipo === 'student' ? 'Matrícula' : 'Usuário'}</label>
            <input
              className="input"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder={tipo === 'student' ? 'EJA20261234' : 'admin'}
              required
            />
          </div>
          <div className="mb-6">
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          <div className="mt-4 text-center">
            <Link
              to={tipo === 'admin' ? '/esqueci-senha?tipo=secretaria' : '/esqueci-senha'}
              className="text-sm text-indigo-600 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          {
           /**
            * <div className="mt-5 p-3 bg-indigo-50 text-indigo-900 text-xs rounded-lg leading-relaxed">
            <strong>Credenciais demo:</strong>
            <br />
            Secretaria: <code className="bg-white/70 px-1.5 py-0.5 rounded">admin</code> /{' '}
            <code className="bg-white/70 px-1.5 py-0.5 rounded">admin123</code>
            <br />
            Aluno: matrícula + senha <code className="bg-white/70 px-1.5 py-0.5 rounded">aluno123</code>
          </div>
            */
          }
        </form>
      </div>
    </div>
  );
}

function Feat({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-200 text-sm">
      <div className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center text-base">{icon}</div>
      {text}
    </div>
  );
}
