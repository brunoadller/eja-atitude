import { useEffect, useMemo, useState } from 'react';
import { IoCheckmarkDoneOutline, IoPrintOutline } from 'react-icons/io5';
import PageHeader, { Empty } from '../../components/PageHeader';
import { api, money, openPdf } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';

type RequestStatus = 'awaiting_payment' | 'ready' | 'issued';

interface CertificateRequest {
  id: string;
  via: number;
  status: RequestStatus;
  feeAmount: number;
  requestedAt: string;
  issuedAt: string | null;
  issuedByAdminName: string | null;
  student: { id: string; name: string; enrollment: string };
}

const STATUS: Record<RequestStatus, { label: string; cls: string }> = {
  ready: { label: 'Aguardando emissão', cls: 'pill-accent' },
  awaiting_payment: { label: 'Aguardando pagamento', cls: 'pill-warning' },
  issued: { label: 'Emitido', cls: 'pill-success' },
};

const FILTROS: { key: RequestStatus | 'all'; label: string }[] = [
  { key: 'ready', label: 'Aguardando emissão' },
  { key: 'awaiting_payment', label: 'Aguardando pagamento' },
  { key: 'issued', label: 'Emitidos' },
  { key: 'all', label: 'Todos' },
];

const quando = (d?: string | null) =>
  d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';

/**
 * Secretaria: solicitações de certificado (= diploma).
 * Fluxo: baixar o PDF → imprimir, assinar e carimbar → marcar como emitido (o aluno vê "Emitido — retire na secretaria").
 */
export default function AdminCertificados() {
  const toast = useToast();
  const confirm = useConfirm();
  const [lista, setLista] = useState<CertificateRequest[]>([]);
  const [filtro, setFiltro] = useState<RequestStatus | 'all'>('ready');
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    api<CertificateRequest[]>('certificates/requests', { params: { type: 'certificate' } })
      .then(setLista)
      .catch((e) => toast(e.message, 'error'));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visiveis = useMemo(() => (filtro === 'all' ? lista : lista.filter((r) => r.status === filtro)), [lista, filtro]);
  const contagem = (k: RequestStatus | 'all') => (k === 'all' ? lista.length : lista.filter((r) => r.status === k).length);

  async function baixar(r: CertificateRequest) {
    setBusy(r.id);
    try {
      await openPdf(`certificates/requests/${r.id}/pdf`); // abre em nova aba para imprimir
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  }

  async function emitir(r: CertificateRequest) {
    const ok = await confirm({
      title: 'Marcar certificado como emitido',
      message: `Confirmar que o certificado (${r.via}ª via) de ${r.student.name} foi impresso, assinado e carimbado?`,
      confirmLabel: 'Marcar como emitido',
    });
    if (!ok) return;
    setBusy(r.id);
    try {
      await api(`certificates/requests/${r.id}/issue`, { method: 'PUT' });
      toast('Certificado marcado como emitido. O aluno já vê "Emitido — retire na secretaria".', 'success');
      await load();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Certificados" subtitle="Solicitações de certificado de conclusão (diploma)" />

      <div className="flex flex-wrap gap-1 mb-4">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filtro === f.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-neutral-50 hover:text-slate-900'
            }`}
          >
            {f.label} <span className="opacity-70">({contagem(f.key)})</span>
          </button>
        ))}
      </div>

      <div className="card">
        {!visiveis.length ? (
          <Empty icon="🎓" title="Nenhuma solicitação aqui" desc="As solicitações feitas pelos alunos aparecem nesta lista." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  {['Aluno', 'Via', 'Solicitado em', 'Situação', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.student.name}</div>
                      <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{r.student.enrollment}</code>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.via}ª via
                      <div className="text-xs text-slate-500">{r.feeAmount > 0 ? `taxa ${money(r.feeAmount)}` : 'gratuita'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{quando(r.requestedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={STATUS[r.status].cls}>{STATUS[r.status].label}</span>
                      {r.status === 'issued' && (
                        <div className="text-xs text-slate-500 mt-1">
                          em {quando(r.issuedAt)}
                          {r.issuedByAdminName ? ` por ${r.issuedByAdminName}` : ''}
                        </div>
                      )}
                      {r.status === 'awaiting_payment' && (
                        <div className="text-xs text-slate-500 mt-1">Confirme o pagamento da taxa em Boletos.</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.status !== 'awaiting_payment' && (
                        <div className="flex flex-wrap justify-end gap-1">
                          <button className="btn-ghost btn-sm" disabled={busy === r.id} onClick={() => baixar(r)}>
                            <IoPrintOutline className="mr-1" /> Baixar PDF
                          </button>
                          {r.status === 'ready' && (
                            <button className="btn-primary btn-sm" disabled={busy === r.id} onClick={() => emitir(r)}>
                              <IoCheckmarkDoneOutline className="mr-1" /> Marcar como emitido
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
