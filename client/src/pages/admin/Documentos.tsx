import { useEffect, useMemo, useState } from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoTimeOutline, IoDownloadOutline } from 'react-icons/io5';
import { api } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { Student, StudentDocument } from '../../types';
import { DOCUMENT_TYPES } from '../../types';
import PageHeader, { Empty } from '../../components/PageHeader';
import Modal from '../../components/Modal';

export default function AdminDocumentos() {
  const toast = useToast();
  const [alunos, setAlunos] = useState<Student[]>([]);
  const [contagens, setContagens] = useState<Record<string, number>>({});
  const [busca, setBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<Student | null>(null);

  useEffect(() => {
    api<Student[]>('/students').then(async (lista) => {
      setAlunos(lista);
      // Busca a contagem de documentos pendentes de cada aluno, em paralelo.
      const entradas = await Promise.all(
        lista.map(async (a) => {
          try {
            const docs = await api<StudentDocument[]>(`/documents/${a.id}`);
            return [a.id, docs.filter((d) => d.status === 'pending').length] as const;
          } catch {
            return [a.id, 0] as const;
          }
        })
      );
      setContagens(Object.fromEntries(entradas));
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
                  {['Matrícula', 'Aluno', 'Pendentes de análise', ''].map((h) => (
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
                      {contagens[a.id] > 0 ? (
                        <span className="pill-warning">{contagens[a.id]} pendente(s)</span>
                      ) : (
                        <span className="pill-muted">Em dia</span>
                      )}
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
          onAtualizado={(pendentes) =>
            setContagens((c) => ({ ...c, [alunoSelecionado.id]: pendentes }))
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
  onAtualizado: (pendentes: number) => void;
}) {
  const toast = useToast();
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

  const load = () =>
    api<StudentDocument[]>(`/documents/${aluno.id}`).then((d) => {
      setDocs(d);
      onAtualizado(d.filter((x) => x.status === 'pending').length);
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decidir(doc:StudentDocument, status: 'aprovado' | 'rejeitado') {
    try {
      await api(`/documents/${doc.id}/review`, { method: 'PUT', body: { status: status === 'aprovado' ? 'approved' : 'rejected', note: observacoes[doc.id] || undefined } });
      toast(status === 'aprovado' ? 'Documento aprovado' : 'Documento rejeitado', 'success');
      load();
    } catch (e: any) {
      toast('Erro: ' + e.message, 'error');
    }
  }

  const porTipo = (tipo: string) => docs.find((d) => d.type === tipo);

  return (
    <Modal title={`Documentos de ${aluno.name}`} onClose={onClose} size="lg">
      <div className="space-y-3">
        {DOCUMENT_TYPES.map(({ type, label }) => {
          const doc = porTipo(type);
          if (!doc) {
            return (
              <div key={type} className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="text-sm">{label}</div>
                <span className="text-xs text-slate-400">Não enviado</span>
              </div>
            );
          }
          return (
            <div key={type} className="py-2 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <StatusLine doc={doc} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/documents/${aluno.id}/${doc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost btn-sm"
                    title="Baixar/visualizar"
                  >
                    <IoDownloadOutline />
                  </a>
                  {doc.status !== 'approved' && (
                    <button className="btn-ghost btn-sm text-emerald-600" onClick={() => decidir(doc, 'aprovado')}>
                      <IoCheckmarkCircle className="mr-1" /> Aprovar
                    </button>
                  )}
                  {doc.status !== 'rejected' && (
                    <button className="btn-ghost btn-sm text-red-600" onClick={() => decidir(doc, 'rejeitado')}>
                      <IoCloseCircle className="mr-1" /> Rejeitar
                    </button>
                  )}
                </div>
              </div>
              {doc.status !== 'approved' && (
                <input
                  type="text"
                  placeholder="Observação (opcional, ex: foto ilegível)"
                  className="input mt-2 text-xs"
                  value={observacoes[doc.id] || ''}
                  onChange={(e) => setObservacoes((o) => ({ ...o, [doc.id]: e.target.value }))}
                />
              )}
            </div>
          );
        })}
      </div>
    </Modal>
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
        <IoCloseCircle /> Rejeitado{doc.note ? ` — ${doc.note}` : ''}
      </div>
    );
  return (
    <div className="text-xs text-amber-600 flex items-center gap-1">
      <IoTimeOutline /> Pendente de análise
    </div>
  );
}
