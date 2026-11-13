import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  IoAttachOutline, IoCheckmarkCircle, IoCloseCircle, IoDownloadOutline, IoTimeOutline,
} from 'react-icons/io5';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import type { DocumentTypeInfo, Student, StudentDocument } from '../../types';
import PageHeader, { Empty } from '../../components/PageHeader';
import Modal from '../../components/Modal';

const FORMATOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png'];
const TAMANHO_MAX_BYTES = 5 * 1024 * 1024; // 5MB (mesmo limite do servidor)

/** Data e hora no fuso de quem está vendo (ex.: 12/11/2026 14:30). */
const quando = (d?: string | null) =>
  d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';

/** Situação dos documentos de um aluno, para a coluna da lista. */
type Resumo = { pendentes: number; recusados: number; faltam: number };

/** "faltam" conta só os obrigatórios que nem foram enviados; pendentes e recusados contam todos os documentos. */
function resumir(docs: StudentDocument[], obrigatorios: string[]): Resumo {
  return {
    pendentes: docs.filter((d) => d.status === 'pending').length,
    recusados: docs.filter((d) => d.status === 'rejected').length,
    faltam: obrigatorios.filter((t) => !docs.some((d) => d.type === t)).length,
  };
}

function SituacaoDocumentos({ resumo }: { resumo?: Resumo }) {
  if (!resumo) return <span className="text-slate-400">…</span>;
  const { pendentes, recusados, faltam } = resumo;
  if (!pendentes && !recusados && !faltam) return <span className="pill-success">Completos</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {pendentes > 0 && <span className="pill-warning">{pendentes} em análise</span>}
      {recusados > 0 && <span className="pill-danger">{recusados} recusado(s)</span>}
      {faltam > 0 && <span className="pill-muted">{faltam} não enviado(s)</span>}
    </div>
  );
}

export default function AdminDocumentos() {
  const [alunos, setAlunos] = useState<Student[]>([]);
  const [resumos, setResumos] = useState<Record<string, Resumo>>({});
  const [obrigatorios, setObrigatorios] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<Student | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Vindo de uma notificação (/documentos?aluno=<id>): abre a revisão daquele aluno e limpa o endereço,
  // para não reabrir ao fechar o modal ou recarregar a página.
  useEffect(() => {
    const id = searchParams.get('aluno');
    if (!id || alunos.length === 0) return;
    const aluno = alunos.find((a) => a.id === id);
    if (aluno) setAlunoSelecionado(aluno);
    setSearchParams({}, { replace: true });
  }, [searchParams, alunos, setSearchParams]);

  useEffect(() => {
    Promise.all([api<Student[]>('/students'), api<DocumentTypeInfo[]>('/documents/types')]).then(async ([lista, tipos]) => {
      const obrig = tipos.filter((t) => t.required).map((t) => t.type);
      setAlunos(lista);
      setObrigatorios(obrig);
      // Busca os documentos de cada aluno, em paralelo, e monta a situação de cada um.
      // Se a busca de um aluno falhar, ele fica sem situação ("…") em vez de aparecer como completo.
      const entradas = await Promise.all(
        lista.map(async (a) => {
          try {
            return [a.id, resumir(await api<StudentDocument[]>(`/documents/${a.id}`), obrig)] as const;
          } catch {
            return null;
          }
        })
      );
      setResumos(Object.fromEntries(entradas.filter((e) => e !== null)));
    });
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return alunos;
    return alunos.filter(
      (a) => String(a.name)?.toLowerCase().includes(termo) || String(a.enrollment)?.toLowerCase().includes(termo)
    );
  }, [alunos, busca]);

  return (
    <>
      <PageHeader title="Documentos de Matrícula" subtitle="Revisão dos documentos enviados pelos alunos" />

      <div className="card">
        <div className="card-header">
          <input
            type="text"
            placeholder="Buscar por nome ou matrícula..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input max-w-xs"
          />
        </div>

        {!filtrados.length ? (
          <Empty icon="📄" title="Nenhum aluno encontrado" desc="Ajuste o termo de busca." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  {['Matrícula', 'Aluno', 'Situação dos documentos', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{a.enrollment}</code>
                    </td>
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3">
                      <SituacaoDocumentos resumo={resumos[a.id]} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-ghost btn-sm" onClick={() => setAlunoSelecionado(a)}>
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {alunoSelecionado && (
        <RevisaoModal
          aluno={alunoSelecionado}
          onClose={() => setAlunoSelecionado(null)}
          onAtualizado={(docs) =>
            setResumos((r) => ({ ...r, [alunoSelecionado.id]: resumir(docs, obrigatorios) }))
          }
        />
      )}
    </>
  );
}

function RevisaoModal({
  aluno,
  onClose,
  onAtualizado,
}: {
  aluno: Student;
  onClose: () => void;
  onAtualizado: (docs: StudentDocument[]) => void;
}) {
  const [tipos, setTipos] = useState<DocumentTypeInfo[]>([]);
  const [docs, setDocs] = useState<StudentDocument[]>([]);

  const load = () =>
    api<StudentDocument[]>(`/documents/${aluno.id}`).then((d) => {
      setDocs(d);
      onAtualizado(d);
    });

  useEffect(() => {
    // a lista de tipos vem do servidor (fonte única)
    api<DocumentTypeInfo[]>('/documents/types').then(setTipos).catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal title={`Documentos de ${aluno.name}`} onClose={onClose} size="lg">
      <div>
        {tipos.map(({ type, label }) => (
          <DocumentoLinha
            key={type}
            alunoId={aluno.id}
            tipo={type}
            label={label}
            doc={docs.find((d) => d.type === type)}
            onMudou={load}
          />
        ))}
      </div>
    </Modal>
  );
}

/** Uma linha por tipo: status, quem fez o quê, e as ações Baixar / Aprovar / Recusar / Anexar. */
function DocumentoLinha({
  alunoId,
  tipo,
  label,
  doc,
  onMudou,
}: {
  alunoId: string;
  tipo: string;
  label: string;
  doc?: StudentDocument;
  onMudou: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [modo, setModo] = useState<'nenhum' | 'recusar' | 'anexar'>('nenhum');
  const [motivo, setMotivo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [jaAprovar, setJaAprovar] = useState(true);
  const [busy, setBusy] = useState(false);

  function fechar() {
    setModo('nenhum');
    setMotivo('');
    setArquivo(null);
    setJaAprovar(true);
  }

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setBusy(true);
    try {
      await acao();
      toast(sucesso, 'success');
      fechar();
      onMudou();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const aprovar = () =>
    executar(
      () => api(`/documents/${doc!.id}/review`, { method: 'PUT', body: { status: 'approved' } }),
      'Documento aprovado.',
    );

  /**
   * Documento JÁ APROVADO: recusar ou substituir pode tirar do aluno o acesso ao certificado.
   * Pergunta antes de abrir o formulário, para um clique sem querer não derrubar quem está em dia.
   */
  async function abrirComAviso(novoModo: 'recusar' | 'anexar') {
    if (doc?.status === 'approved') {
      const ok = await confirm({
        title: novoModo === 'recusar' ? 'Recusar documento aprovado?' : 'Substituir documento aprovado?',
        message:
          `"${label}" já está aprovado.\n\n` +
          (novoModo === 'recusar'
            ? 'Se recusar, o aluno deixa de cumprir a condição de documentação e não poderá solicitar o certificado até reenviar e você aprovar de novo.'
            : 'Ao substituir, o documento atual é apagado. Se o novo ficar pendente, o aluno não poderá solicitar o certificado até você aprová-lo.') +
          '\n\nTem certeza de que é o aluno e o documento certos?',
        confirmLabel: novoModo === 'recusar' ? 'Sim, recusar' : 'Sim, substituir',
        danger: true,
      });
      if (!ok) return;
    }
    setModo(novoModo);
  }

  function recusar(e: FormEvent) {
    e.preventDefault();
    if (motivo.trim().length < 3) return toast('Informe o motivo da recusa.', 'error');
    executar(
      () => api(`/documents/${doc!.id}/review`, { method: 'PUT', body: { status: 'rejected', note: motivo.trim() } }),
      'Documento recusado. O aluno verá o motivo.',
    );
  }

  function anexar(e: FormEvent) {
    e.preventDefault();
    if (!arquivo) return toast('Selecione um arquivo.', 'error');
    if (!FORMATOS_ACEITOS.includes(arquivo.type)) return toast('Formato não permitido. Envie PDF, JPG ou PNG.', 'error');
    if (arquivo.size > TAMANHO_MAX_BYTES) return toast('Arquivo maior que 5MB.', 'error');

    const form = new FormData();
    form.append('type', tipo);
    form.append('approve', String(jaAprovar));
    form.append('file', arquivo);
    executar(
      () => api(`/documents/${alunoId}`, { method: 'POST', body: form }),
      jaAprovar ? 'Documento anexado e aprovado.' : 'Documento anexado. Ficou pendente de análise.',
    );
  }

  return (
    <div className="py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          {doc ? <Detalhes doc={doc} /> : <div className="text-xs text-slate-400 mt-0.5">Não enviado</div>}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {doc && (
            <a
              href={`/api/documents/${alunoId}/${doc.id}/download`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost btn-sm"
              title="Baixar/visualizar"
            >
              <IoDownloadOutline />
            </a>
          )}
          {doc && doc.status !== 'approved' && (
            <button className="btn-ghost btn-sm text-emerald-600" onClick={aprovar} disabled={busy}>
              <IoCheckmarkCircle className="mr-1" /> Aprovar
            </button>
          )}
          {doc && doc.status !== 'rejected' && (
            <button className="btn-ghost btn-sm text-red-600" onClick={() => abrirComAviso('recusar')} disabled={busy}>
              <IoCloseCircle className="mr-1" /> Recusar
            </button>
          )}
          <button className="btn-ghost btn-sm" onClick={() => abrirComAviso('anexar')} disabled={busy}>
            <IoAttachOutline className="mr-1" /> {doc ? 'Substituir' : 'Anexar'}
          </button>
        </div>
      </div>

      {modo === 'recusar' && (
        <form onSubmit={recusar} className="mt-3 p-3 bg-red-50/60 rounded-lg">
          <label className="label">Motivo da recusa (o aluno verá esta mensagem)</label>
          <input
            className="input mb-2"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: foto ilegível, documento vencido"
            maxLength={500}
            autoFocus
            required
          />
          <div className="flex gap-2">
            <button className="btn-danger btn-sm" disabled={busy}>{busy ? 'Salvando…' : 'Confirmar recusa'}</button>
            <button type="button" className="btn-ghost btn-sm" onClick={fechar}>Cancelar</button>
          </div>
        </form>
      )}

      {modo === 'anexar' && (
        <form onSubmit={anexar} className="mt-3 p-3 bg-neutral-50 rounded-lg">
          <label className="label">Arquivo (PDF, JPG ou PNG, até 5MB)</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="block text-sm mb-3"
            onChange={(e) => setArquivo(e.target.files?.[0] || null)}
            required
          />
          <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={jaAprovar} onChange={(e) => setJaAprovar(e.target.checked)} />
            Documento recebido na secretaria — já aprovar
          </label>
          {doc && <p className="text-xs text-slate-500 mb-3">O arquivo atual será substituído.</p>}
          <div className="flex gap-2">
            <button className="btn-primary btn-sm" disabled={busy}>{busy ? 'Enviando…' : 'Enviar'}</button>
            <button type="button" className="btn-ghost btn-sm" onClick={fechar}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Status + quem enviou + quem analisou. */
function Detalhes({ doc }: { doc: StudentDocument }) {
  const envio =
    doc.uploadedBy === 'admin'
      ? `Anexado pela secretaria${doc.uploadedByAdminName ? ` (${doc.uploadedByAdminName})` : ''} em ${quando(doc.uploadedAt)}`
      : `Enviado pelo aluno em ${quando(doc.uploadedAt)}`;
  const analise =
    doc.status !== 'pending' && doc.reviewedAt
      ? `${doc.status === 'approved' ? 'Aprovado' : 'Recusado'} por ${doc.reviewedByAdminName || 'secretaria'} em ${quando(doc.reviewedAt)}`
      : null;

  return (
    <div className="mt-0.5 space-y-0.5">
      <StatusLine doc={doc} />
      <div className="text-xs text-slate-500">{envio}</div>
      {analise && <div className="text-xs text-slate-500">{analise}</div>}
    </div>
  );
}

function StatusLine({ doc }: { doc: StudentDocument }) {
  if (doc.status === 'approved')
    return (
      <div className="text-xs text-emerald-600 flex items-center gap-1">
        <IoCheckmarkCircle /> Aprovado
      </div>
    );
  if (doc.status === 'rejected')
    return (
      <div className="text-xs text-red-600 flex items-center gap-1">
        <IoCloseCircle /> Recusado{doc.note ? ` — ${doc.note}` : ''}
      </div>
    );
  return (
    <div className="text-xs text-amber-600 flex items-center gap-1">
      <IoTimeOutline /> Pendente de análise
    </div>
  );
}
