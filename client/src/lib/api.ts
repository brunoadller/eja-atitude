import axios, { AxiosError } from 'axios';

/**
 * Cliente HTTP único do front (axios).
 * A sessão é um JWT em cookie httpOnly: o navegador envia sozinho (withCredentials), o JS nunca vê o token.
 */
export const http = axios.create({ baseURL: '/api', withCredentials: true });

type ErrorBody = { error?: string };

/** Lê a mensagem de erro do backend ({ error }) — também quando a resposta veio como blob (PDF). */
async function messageFrom(err: unknown): Promise<string> {
  const e = err as AxiosError<ErrorBody | Blob>;
  const data = e.response?.data;
  if (data instanceof Blob) {
    try { return (JSON.parse(await data.text()) as ErrorBody).error || 'erro'; } catch { return 'erro ao gerar o arquivo'; }
  }
  return (data as ErrorBody | undefined)?.error || (e.response ? 'erro' : 'sem conexão com o servidor');
}

// Sessão expirada em qualquer chamada (exceto login/me) -> avisa o AuthProvider para voltar ao login
http.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/')) window.dispatchEvent(new Event('auth:expired'));
    return Promise.reject(err);
  },
);

const clean = (path: string) => path.replace(/^\/+/, '').replace(/^api\//, '');

/** Mesma assinatura de antes (api(path, {method, body})), agora usando axios. */
export async function api<T = any>(path: string, opts: { method?: string; body?: any; params?: Record<string, any> } = {}): Promise<T> {
  try {
    const res = await http.request<T>({ url: clean(path), method: opts.method || 'GET', data: opts.body, params: opts.params });
    return res.data;
  } catch (err) {
    throw new Error(await messageFrom(err));
  }
}

async function fetchPdf(path: string): Promise<Blob> {
  try {
    const res = await http.get(clean(path), { responseType: 'blob' });
    return res.data as Blob;
  } catch (err) {
    throw new Error(await messageFrom(err));
  }
}

/** Abre um PDF protegido em nova aba (o popup é aberto antes para não ser bloqueado). */
export async function openPdf(path: string): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const url = URL.createObjectURL(await fetchPdf(path));
    if (win) win.location.href = url; else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    win?.close();
    throw e;
  }
}

export async function downloadPdf(path: string, filename: string): Promise<void> {
  const url = URL.createObjectURL(await fetchPdf(path));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const money = (v: number | string | undefined) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

// datas "só dia" (aaaa-mm-dd) vêm em UTC: formatar em UTC evita mostrar o dia anterior
export const br = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—');

export const initials = (n?: string) => (n || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
