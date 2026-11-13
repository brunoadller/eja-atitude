import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';

/** De quanto em quanto tempo o contador do sino é atualizado (só com a aba visível). */
const REFRESH_MS = 60_000;

type NotificationsContext = {
  /** Quantas notificações não lidas o usuário logado tem. */
  unread: number;
  /** Busca o número de novo no servidor. */
  refresh: () => Promise<void>;
  /** Atualiza o número na hora (ex.: depois de "marcar como lida", com o valor que o servidor devolveu). */
  setUnread: (n: number) => void;
};

const Ctx = createContext<NotificationsContext>({ unread: 0, refresh: async () => {}, setUnread: () => {} });

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ unread: number }>('notifications/unread-count');
      setUnread(r.unread);
    } catch {
      // Sem conexão: mantém o último número. Sessão expirada já leva ao login (interceptor do api.ts).
    }
  }, []);

  useEffect(() => {
    refresh(); // ao carregar a página
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh(); // aba escondida: não consulta
    }, REFRESH_MS);
    // ao voltar para a aba, atualiza na hora em vez de esperar até 60 s
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return <Ctx.Provider value={{ unread, refresh, setUnread }}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  return useContext(Ctx);
}
