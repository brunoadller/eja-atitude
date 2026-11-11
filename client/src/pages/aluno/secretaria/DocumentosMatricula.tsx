import { useEffect, useState } from 'react';
import { IoCloudUploadOutline, IoCheckmarkCircle, IoCloseCircle, IoTimeOutline } from 'react-icons/io5';
import { api } from '../../../lib/api';
import { useToast } from '../../../lib/toast';
import { DOCUMENT_TYPES, StudentDocument } from '../../../types';

const FORMATOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png'];
const TAMANHO_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export default function DocumentosMatricula() {
  const toast = useToast();
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [enviando, setEnviando] = useState<string | null>(null);

  const load = () => api<StudentDocument[]>('/documents').then(setDocs).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const porTipo = (tipo: string) => docs.find((d) => d.type === tipo);

  async function handleFile(tipo: string, file: File | null) {
    if (!file) return;

    if (!FORMATOS_ACEITOS.includes(file.type)) {
      toast('Formato não permitido. Envie PDF, JPG ou PNG.', 'error');
      return;
    }
    if (file.size > TAMANHO_MAX_BYTES) {
      toast('Arquivo maior que 5MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', tipo);;
  

    setEnviando(tipo);
    try {
      api('/documents', { method: 'POST', body: formData })
      toast('Documento enviado. Aguarde a análise da secretaria.', 'success');
      load();
    } catch (e: any) {
      toast('Erro ao enviar: ' + e.message, 'error');
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="card p-4 text-sm text-slate-500">
        Envie os documentos abaixo em <strong className="text-slate-900">PDF, JPG ou PNG</strong>, até{' '}
        <strong className="text-slate-900">5MB</strong> cada. A secretaria analisa e aprova, ou pede reenvio se
        necessário.
      </div>

      {DOCUMENT_TYPES.map(({ type, label }) => {
        const doc = porTipo(type);
        const carregando = enviando === type;
        return (
          <div key={type} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{label}</div>
              <DocStatus doc={doc} />
            </div>
            <label className={`btn-ghost btn-sm shrink-0 cursor-pointer ${carregando ? 'opacity-50 pointer-events-none' : ''}`}>
              <IoCloudUploadOutline className="mr-1.5" />
              {carregando ? 'Enviando…' : doc ? 'Reenviar' : 'Enviar'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleFile(type, e.target.files?.[0] || null)}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}

function DocStatus({ doc }: { doc?: StudentDocument }) {
  if (!doc) return <div className="text-xs text-slate-400 mt-0.5">Não enviado</div>;

  if (doc.status === 'approved')
    return (
      <div className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
        <IoCheckmarkCircle /> Aprovado
      </div>
    );

  if (doc.status === 'rejected')
    return (
      <div className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
        <IoCloseCircle /> Rejeitado{doc.note ? ` — ${doc.note}` : ''}
      </div>
    );

  return (
    <div className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
      <IoTimeOutline /> Em análise
    </div>
  );
}
