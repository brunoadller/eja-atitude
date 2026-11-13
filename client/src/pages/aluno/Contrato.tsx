import { useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import SchoolLogo from '../../components/SchoolLogo';
import { api, br } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import type { Student } from '../../types';

interface Props {
  /** Modo "gate": exibido antes de qualquer outra tela quando ainda não aceito */
  gate?: boolean;
}

export default function Contrato({ gate = false }: Props) {
  const { me, refresh } = useAuth();
  const a = me!.user as Student;
  const aceito = !!a.contractAccepted;

  const [texto, setTexto] = useState('');
  const [versao, setVersao] = useState('');
  const [check, setCheck] = useState(false);
  const [bottomOk, setBottomOk] = useState(aceito); // se já aceito, libera
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ version: string; text: string }>('/contracts').then((d) => {
      setTexto(d.text);
      setVersao(d.version);
    });
  }, []);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    // considera fim ao chegar próximo do fim (24px de folga)
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setBottomOk(true);
  }

  async function aceitar() {
    setSaving(true);
    try {
      await api('/contracts/accept', { method: 'POST' });
      toast('Contrato aceito. Bem-vindo(a)!', 'success');
      await refresh();
    } catch (e: any) {
      toast('Erro: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const Content = (
    <>
      {!gate && (
        <PageHeader
          title="Contrato de Prestação de Serviços"
          subtitle="Termos do curso EJA — leitura obrigatória"
        />
      )}

      {aceito && (
        <div className="mb-5 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
          <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-600 text-white grid place-items-center font-bold">
            ✓
          </div>
          <div>
            <div className="font-semibold text-emerald-800">Contrato aceito</div>
            <div className="text-emerald-700">
              Aceito em <strong>{br(a.contractAcceptedAt)}</strong>
              {a.contractVersion && (
                <>
                  {' '} · Versão <strong>{a.contractVersion}</strong>
                </>
              )}
              . Você pode consultar novamente o contrato a qualquer momento.
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="font-semibold text-sm">Contrato EJA</h3>
            {versao && <div className="text-xs text-slate-500 mt-0.5">Versão {versao}</div>}
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            Aluno: <strong className="text-slate-900">{a.name}</strong> · Matrícula:{' '}
            <code className="bg-neutral-100 px-1.5 py-0.5 rounded">{a.enrollment}</code>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-[420px] overflow-y-auto p-6 text-sm leading-relaxed whitespace-pre-line text-slate-700 border-b border-slate-200"
        >
          {texto || 'Carregando contrato...'}
        </div>

        {!aceito && (
          <div className="p-5 bg-neutral-50">
            {!bottomOk && (
              <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Role até o final do contrato para habilitar o aceite.
              </div>
            )}
            <label className="flex items-start gap-3 cursor-pointer mb-4 select-none">
              <input
                type="checkbox"
                checked={check}
                onChange={(e) => setCheck(e.target.checked)}
                disabled={!bottomOk}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-slate-900"
              />
              <span className="text-sm text-slate-700">
                Li e concordo integralmente com os termos do <strong>Contrato de Prestação de Serviços
                Educacionais — EJA</strong> (versão {versao || '—'}). Estou ciente de que o aceite eletrônico
                tem validade jurídica e será registrado com data, hora e endereço IP.
              </span>
            </label>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                className="btn-primary"
                disabled={!check || !bottomOk || saving}
                onClick={aceitar}
              >
                {saving ? 'Registrando…' : 'Aceitar contrato e continuar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (gate) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <SchoolLogo className="h-10 w-auto" />
          <div className="text-sm text-slate-500 flex items-center gap-3">
            <span className="hidden sm:inline">
              Olá, <strong className="text-slate-900">{a.name.split(' ')[0]}</strong>
            </span>
            <LogoutBtn />
          </div>
        </header>
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 lg:p-10">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-800 mb-3">
              <span>⚠</span> Ação necessária
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Antes de continuar, aceite o contrato</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Para acessar a plataforma, é necessário ler e aceitar o contrato de prestação de serviços educacionais.
            </p>
          </div>
          {Content}
        </div>
      </div>
    );
  }

  return Content;
}

function LogoutBtn() {
  const { logout } = useAuth();
  return (
    <button className="btn-ghost btn-sm" onClick={logout}>
      Sair
    </button>
  );
}
