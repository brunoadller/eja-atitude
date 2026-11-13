import { ReactNode, useEffect, useState } from 'react';
import { api, br, downloadPdf, money } from '../../../lib/api';
import { useToast } from '../../../lib/toast';
import { useConfirm } from '../../../lib/confirm';
import type { DocStatus } from '../../../types';

const STATUS: Record<string, { label: string; cls: string }> = {
  awaiting_payment: { label: 'Aguardando pagamento da taxa', cls: 'pill-warning' },
  ready: { label: 'Liberada', cls: 'pill-success' },
  issued: { label: 'Emitida', cls: 'pill-accent' },
};

/** Fluxo compartilhado: solicitar via -> (taxa paga na secretaria) -> baixar. */
export default function DocumentRequestCard({ type, icon, intro, footer }: { type: 'attestation' | 'certificate'; icon: ReactNode; intro: string; footer?: ReactNode }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [st, setSt] = useState<DocStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => api<Record<string, DocStatus>>('certificates/status').then((r) => setSt(r[type])).catch((e) => toast(e.message, 'error'));
  useEffect(() => { load(); }, [type]);

  async function request() {
    // Via com taxa: pergunta antes, porque a solicitação já gera a cobrança
    if (st && st.fee > 0) {
      const ok = await confirm({
        title: `Solicitar ${st.nextVia}ª via`,
        message: `A ${st.nextVia}ª via tem taxa de ${money(st.fee)}, paga na secretaria. Deseja solicitar?`,
        confirmLabel: 'Solicitar',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      await api('certificates/requests', { method: 'POST', body: { type } });
      toast(st && st.fee > 0 ? 'Solicitação criada. Pague a taxa na secretaria para liberar o download.' : 'Documento liberado!', 'success');
      await load();
    } catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  }
  async function download(id: string, via: number) {
    try { await downloadPdf(`certificates/requests/${id}/download`, `${type}_${via}via.pdf`); await load(); } catch (e: any) { toast(e.message, 'error'); }
  }

  if (!st) return <div className="text-slate-400 text-sm">Carregando…</div>;

  return (
    <div className="max-w-2xl grid gap-4">
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 grid place-items-center text-2xl text-indigo-600 shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">{st.label}</div>
            <div className="text-sm text-slate-500">{intro}</div>
            <div className="text-sm mt-3">
              Próxima via: <strong>{st.nextVia}ª via</strong> ·{' '}
              {st.fee > 0 ? <>taxa de <strong>{money(st.fee)}</strong> (paga na secretaria)</> : <strong className="text-emerald-700">gratuita</strong>}
            </div>
            {!st.eligible && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 text-amber-900 text-sm">
                <div className="font-medium mb-1">Ainda não liberado:</div>
                <ul className="list-disc pl-5">{st.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            )}
          </div>
          <button className="btn-primary shrink-0" disabled={!st.canRequest || busy} onClick={request}>
            {busy ? 'Aguarde…' : st.fee > 0 ? 'Solicitar 2ª via' : 'Solicitar'}
          </button>
        </div>
      </div>

      {st.requests.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-sm">Minhas solicitações</h3></div>
          {st.requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-6 py-3 border-t border-slate-100 text-sm">
              <div className="font-medium w-16">{r.via}ª via</div>
              <span className={STATUS[r.status].cls}>{STATUS[r.status].label}</span>
              <div className="text-slate-500 flex-1">
                {r.feeAmount > 0 ? `Taxa ${money(r.feeAmount)}${r.invoice ? ` · venc. ${br(r.invoice.dueDate)}` : ''}` : 'Sem taxa'}
              </div>
              {r.status !== 'awaiting_payment' && <button className="btn-secondary btn-sm" onClick={() => download(r.id, r.via)}>Baixar PDF</button>}
            </div>
          ))}
        </div>
      )}
      {footer}
    </div>
  );
}
