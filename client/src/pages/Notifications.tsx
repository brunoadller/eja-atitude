import { useEffect, useState } from 'react';
import { IoNotificationsOffOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import PageHeader, { Empty } from '../components/PageHeader';
import { api } from '../lib/api';
import { useNotifications } from '../lib/notifications';
import { useToast } from '../lib/toast';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const when = (d: string) =>
  new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Página "Notificações" — a mesma para aluno e secretaria (o servidor devolve só as do usuário logado). */
export default function Notifications() {
  const toast = useToast();
  const navigate = useNavigate();
  const { unread, setUnread } = useNotifications();
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api<{ items: NotificationItem[]; unread: number }>('notifications')
      .then((r) => {
        setItems(r.items);
        setUnread(r.unread); // o sino fica igual à lista
      })
      .catch((e) => toast.error(e.message));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markLocal = (ids: string[] | 'all') => {
    const now = new Date().toISOString();
    setItems((list) => list?.map((n) => (ids === 'all' || ids.includes(n.id) ? { ...n, readAt: n.readAt ?? now } : n)) ?? null);
  };

  /** Clique: marca como lida e leva à tela relacionada. */
  async function open(n: NotificationItem) {
    if (!n.readAt) {
      try {
        const r = await api<{ unread: number }>(`notifications/${n.id}/read`, { method: 'PUT' });
        markLocal([n.id]);
        setUnread(r.unread);
      } catch (e: any) {
        toast.error(e.message);
      }
    }
    if (n.link?.startsWith('/')) navigate(n.link); // só links internos do sistema
  }

  async function markAll() {
    setBusy(true);
    try {
      await api('notifications/read-all', { method: 'PUT' });
      markLocal('all');
      setUnread(0);
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Notificações"
        subtitle={unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia'}
        actions={
          <button className="btn-secondary" onClick={markAll} disabled={busy || unread === 0}>
            Marcar todas como lidas
          </button>
        }
      />

      {items === null ? (
        <div className="text-slate-400 text-sm">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="card">
          <Empty icon={<IoNotificationsOffOutline />} title="Nenhuma notificação" desc="Os avisos da secretaria e do sistema aparecem aqui." />
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100 max-w-3xl">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => open(n)}
                className={`w-full text-left flex gap-3 px-5 py-4 transition hover:bg-neutral-50 ${n.readAt ? '' : 'bg-indigo-50/40'}`}
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.readAt ? 'bg-transparent' : 'bg-indigo-600'}`}
                  aria-hidden="true"
                />
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className={`text-sm ${n.readAt ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                      {n.title}
                      {!n.readAt && <span className="sr-only"> (não lida)</span>}
                    </span>
                    <span className="text-xs text-slate-400">{when(n.createdAt)}</span>
                  </span>
                  <span className="block text-sm text-slate-600 mt-0.5">{n.message}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
