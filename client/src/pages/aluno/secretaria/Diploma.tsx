import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoCheckmarkCircle, IoSchoolOutline, IoTimeOutline } from 'react-icons/io5';
import { api, money } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { useToast } from '../../../lib/toast';
import { useConfirm } from '../../../lib/confirm';
import type { CompletionCheck, DocStatus, Student } from '../../../types';

/** Situação de cada via do certificado, do ponto de vista do aluno (ele não baixa o PDF). */
const STATUS: Record<string, { label: string; cls: string }> = {
  awaiting_payment: { label: 'Aguardando pagamento da taxa', cls: 'pill-warning' },
  ready: { label: 'Solicitado — em preparação pela secretaria', cls: 'pill-accent' },
  issued: { label: 'Emitido — retire na secretaria', cls: 'pill-success' },
};

const dia = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '');

/**
 * Certificado de Conclusão (= diploma). O aluno acompanha as três etapas (notas, parcelas, documentos)
 * e só vê o botão de solicitar quando as três estão cumpridas. Quem emite é a secretaria.
 */
export default function Diploma() {
  const toast = useToast();
  const confirm = useConfirm();
  const { me, refresh } = useAuth();
  const aluno = me!.user as Student;
  const [st, setSt] = useState<DocStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api<Record<string, DocStatus>>('certificates/status')
      .then((r) => setSt(r.certificate))
      .catch((e) => toast(e.message, 'error'));

  useEffect(() => {
    // o status do certificado também pode ter mudado o aluno para "Concluído": atualiza os dois
    load().then(() => refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function solicitar() {
    // Via com taxa: pergunta antes, porque a solicitação já gera a cobrança
    if (st && st.fee > 0) {
      const ok = await confirm({
        title: `Solicitar ${st.nextVia}ª via do certificado`,
        message: `A ${st.nextVia}ª via tem taxa de ${money(st.fee)}, paga na secretaria. Deseja solicitar?`,
        confirmLabel: 'Solicitar',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      await api('certificates/requests', { method: 'POST', body: { type: 'certificate' } });
      toast(
        st && st.fee > 0
          ? 'Solicitação registrada. Pague a taxa na secretaria para seguir com a emissão.'
          : 'Solicitação registrada. A secretaria vai preparar o seu certificado.',
        'success',
      );
      await load();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!st) return <div className="text-slate-400 text-sm">Carregando…</div>;

  const checks = st.checks;
  const emAndamento = st.requests.find((r) => r.status === 'awaiting_payment' || r.status === 'ready');
  const faltaSoParcelas = aluno.status === 'completed' && checks && !checks.installments.ok;

  return (
    <div className="max-w-2xl grid gap-4">
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 grid place-items-center text-2xl text-indigo-600 shrink-0">
            <IoSchoolOutline />
          </div>
          <div className="min-w-0">
            <div className="font-semibold">Certificado de Conclusão (diploma)</div>
            <div className="text-sm text-slate-500">
              Documento que comprova a conclusão da EJA. É emitido pela secretaria, impresso, assinado e carimbado;
              você retira na secretaria.
            </div>
          </div>
        </div>
      </div>

      {/* As três etapas */}
      {checks && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-sm">Etapas para solicitar</h3>
          </div>
          <Etapa titulo="Notas" detalheOk="Todas as provas com nota 5,0 ou mais" check={checks.grades} link="/notas" linkTexto="Ver notas" />
          <Etapa titulo="Parcelas" detalheOk="Todas as parcelas quitadas" check={checks.installments} link="/boletos" linkTexto="Ver boletos" />
          <Etapa
            titulo={`Documentação (${checks.documents.approved} de ${checks.documents.total} aprovados)`}
            detalheOk="Todos os documentos obrigatórios aprovados pela secretaria"
            check={checks.documents}
            link="/secretaria/documentos"
            linkTexto="Ver documentos"
          />
        </div>
      )}

      {/* Aviso: concluído, mas com parcelas em aberto */}
      {faltaSoParcelas && (
        <div className="p-4 rounded-xl bg-amber-50 text-amber-900 text-sm">
          Você concluiu as provas e a documentação. Falta quitar as parcelas para solicitar o certificado.
        </div>
      )}

      {/* Solicitação */}
      {emAndamento ? (
        <div className="card p-5 text-sm">
          <div className="font-medium mb-1">Sua solicitação ({emAndamento.via}ª via)</div>
          <span className={STATUS[emAndamento.status].cls}>{STATUS[emAndamento.status].label}</span>
          {emAndamento.status === 'awaiting_payment' && (
            <p className="text-slate-500 mt-2">Taxa de {money(emAndamento.feeAmount)}, paga na secretaria.</p>
          )}
        </div>
      ) : st.canRequest ? (
        <div className="card p-5 border-emerald-200 bg-emerald-50/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <IoCheckmarkCircle /> Disponível para solicitar
              </div>
              <div className="text-emerald-900/80 mt-0.5">
                {st.nextVia}ª via ·{' '}
                {st.fee > 0 ? <>taxa de <strong>{money(st.fee)}</strong> (paga na secretaria)</> : <strong>gratuita</strong>}
              </div>
            </div>
            <button className="btn-primary" disabled={busy} onClick={solicitar}>
              {busy ? 'Aguarde…' : st.nextVia > 1 ? `Solicitar ${st.nextVia}ª via` : 'Solicitar certificado'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Histórico (sem download: o certificado é retirado impresso) */}
      {st.requests.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-sm">Minhas solicitações</h3>
          </div>
          {st.requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-6 py-3 border-t border-slate-100 text-sm">
              <div className="font-medium w-16">{r.via}ª via</div>
              <span className={STATUS[r.status].cls}>{STATUS[r.status].label}</span>
              <div className="text-slate-500 flex-1">
                Solicitado em {dia(r.requestedAt)}
                {r.issuedAt ? ` · emitido em ${dia(r.issuedAt)}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-5 text-sm text-slate-500">
        <strong className="text-slate-900">Como funciona:</strong> quando as três etapas estiverem cumpridas, aparece o botão
        para solicitar. A 1ª via é gratuita; da 2ª em diante há taxa, paga na secretaria. A emissão pode levar até 30 dias
        úteis após o término dos módulos.
      </div>
    </div>
  );
}

function Etapa({
  titulo,
  detalheOk,
  check,
  link,
  linkTexto,
}: {
  titulo: string;
  detalheOk: string;
  check: CompletionCheck;
  link: string;
  linkTexto: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-4 border-t border-slate-100">
      <div className={`text-xl mt-0.5 shrink-0 ${check.ok ? 'text-emerald-600' : 'text-amber-500'}`}>
        {check.ok ? <IoCheckmarkCircle /> : <IoTimeOutline />}
      </div>
      <div className="flex-1 min-w-0 text-sm">
        <div className="font-medium">{titulo}</div>
        {check.ok ? (
          <div className="text-emerald-700">{detalheOk}</div>
        ) : (
          <ul className="list-disc pl-5 text-slate-600 mt-1 space-y-0.5">
            {check.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </div>
      {!check.ok && (
        <Link to={link} className="btn-ghost btn-sm shrink-0">
          {linkTexto}
        </Link>
      )}
    </div>
  );
}
