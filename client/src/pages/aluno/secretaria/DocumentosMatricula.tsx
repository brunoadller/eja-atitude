import { ChangeEvent, useEffect, useState } from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoCloudUploadOutline, IoTimeOutline } from 'react-icons/io5';
import { api } from '../../../lib/api';
import { useToast } from '../../../lib/toast';
import { DocumentTypeInfo, StudentDocument } from '../../../types';

const FORMATOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png'];
const TAMANHO_MAX_BYTES = 5 * 1024 * 1024; // 5MB (mesmo limite do servidor)

/** Data no fuso de quem está vendo (ex.: 12/11/2026). */
const dia = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '');

export default function DocumentosMatricula() {
  const toast = useToast();
  const [tipos, setTipos] = useState<DocumentTypeInfo[]>([]);
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [carregado, setCarregado] = useState(false); // evita mostrar "faltam todos" antes da lista chegar

  const load = () =>
    api<StudentDocument[]>('/documents')
      .then((d) => { setDocs(d); setCarregado(true); })
      .catch(() => {});
  useEffect(() => {
    // a lista de tipos vem do servidor (fonte única)
    api<DocumentTypeInfo[]>('/documents/types').then(setTipos).catch(() => {});
    load();
  }, []);

  async function handleFile(tipo: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    e.target.value = ''; // permite escolher o mesmo arquivo de novo depois de um erro
    if (!file) return;

    if (!FORMATOS_ACEITOS.includes(file.type)) return toast('Formato não permitido. Envie PDF, JPG ou PNG.', 'error');
    if (file.size > TAMANHO_MAX_BYTES) return toast('Arquivo maior que 5MB.', 'error');

    const formData = new FormData();
    formData.append('type', tipo);
    formData.append('file', file);

    setEnviando(tipo);
    try {
      await api('/documents', { method: 'POST', body: formData }); // espera o servidor responder
      toast('Documento enviado. Aguarde a análise da secretaria.', 'success');
      await load();
    } catch (err: any) {
      toast('Erro ao enviar: ' + err.message, 'error');
    } finally {
      setEnviando(null);
    }
  }

  // Resumo só dos obrigatórios (a Reservista é "se possuir" e não conta)
  const obrigatorios = tipos.filter((t) => t.required);
  const statusDe = (type: string) => docs.find((d) => d.type === type)?.status;
  const aprovados = obrigatorios.filter((t) => statusDe(t.type) === 'approved').length;
  const emAnalise = obrigatorios.filter((t) => statusDe(t.type) === 'pending').length;
  const recusados = obrigatorios.filter((t) => statusDe(t.type) === 'rejected').length;
  const naoEnviados = obrigatorios.filter((t) => !statusDe(t.type)).length;
  const faltam = obrigatorios.length - aprovados;

  return (
    <div className="space-y-3 max-w-2xl">
      {carregado && obrigatorios.length > 0 && (
        <div className={`card p-4 text-sm ${faltam ? '' : 'bg-emerald-50'}`}>
          {faltam === 0 ? (
            <div className="font-medium text-emerald-700">Documentação completa: todos os {obrigatorios.length} documentos obrigatórios foram aprovados.</div>
          ) : (
            <>
              <div className="font-medium">
                {aprovados} de {obrigatorios.length} documentos obrigatórios aprovados · faltam {faltam}
              </div>
              <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                {naoEnviados > 0 && <span>{naoEnviados} para enviar</span>}
                {recusados > 0 && <span className="text-red-600">{recusados} recusado(s): reenvie</span>}
                {emAnalise > 0 && <span className="text-amber-600">{emAnalise} em análise pela secretaria</span>}
              </div>
            </>
          )}
        </div>
      )}

      <div className="card p-4 text-sm text-slate-500">
        Envie os documentos abaixo em <strong className="text-slate-900">PDF, JPG ou PNG</strong>, até{' '}
        <strong className="text-slate-900">5MB</strong> cada. A secretaria analisa e aprova, ou informa o motivo e
        pede o reenvio.
      </div>

      {tipos.map(({ type, label }) => {
        const doc = docs.find((d) => d.type === type);
        const carregando = enviando === type;
        const aprovado = doc?.status === 'approved';
        return (
          <div key={type} className="card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{label}</div>
                <DocStatus doc={doc} />
              </div>

              {aprovado ? (
                <span className="text-xs text-slate-400 shrink-0">Para trocar, procure a secretaria</span>
              ) : (
                <label className={`btn-ghost btn-sm shrink-0 cursor-pointer ${carregando ? 'opacity-50 pointer-events-none' : ''}`}>
                  <IoCloudUploadOutline className="mr-1.5" />
                  {carregando ? 'Enviando…' : doc ? 'Reenviar' : 'Enviar'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFile(type, e)}
                  />
                </label>
              )}
            </div>

            {doc?.status === 'rejected' && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 text-sm text-red-700">
                <strong>Motivo da recusa:</strong> {doc.note || 'não informado'}
                <div className="text-xs mt-1 text-red-600">Corrija e clique em “Reenviar”.</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DocStatus({ doc }: { doc?: StudentDocument }) {
  if (!doc) return <div className="text-xs text-slate-400 mt-0.5">Não enviado</div>;

  const origem =
    doc.uploadedBy === 'admin' ? `Anexado pela secretaria em ${dia(doc.uploadedAt)}` : `Enviado em ${dia(doc.uploadedAt)}`;

  return (
    <div className="mt-0.5 space-y-0.5">
      {doc.status === 'approved' && (
        <div className="text-xs text-emerald-600 flex items-center gap-1">
          <IoCheckmarkCircle /> Aprovado{doc.reviewedAt ? ` em ${dia(doc.reviewedAt)}` : ''}
        </div>
      )}
      {doc.status === 'rejected' && (
        <div className="text-xs text-red-600 flex items-center gap-1">
          <IoCloseCircle /> Recusado
        </div>
      )}
      {doc.status === 'pending' && (
        <div className="text-xs text-amber-600 flex items-center gap-1">
          <IoTimeOutline /> Em análise
        </div>
      )}
      <div className="text-xs text-slate-400">{origem}</div>
    </div>
  );
}
