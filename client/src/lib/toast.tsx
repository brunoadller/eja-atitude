import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; msg: string; type: ToastType };

/**
 * Aviso rápido, que não trava a tela. Dois jeitos de usar:
 *   toast.success('Salvo')  ·  toast.error(e.message)  ·  toast.info('...')
 *   toast('Salvo', 'success')   (jeito antigo, continua valendo)
 */
export type ToastFn = ((msg: string, type?: ToastType) => void) & Record<ToastType, (msg: string) => void>;

const withMethods = (push: (msg: string, type?: ToastType) => void): ToastFn =>
  Object.assign((msg: string, type?: ToastType) => push(msg, type), {
    success: (msg: string) => push(msg, 'success'),
    error: (msg: string) => push(msg, 'error'),
    info: (msg: string) => push(msg, 'info'),
  });

const Ctx = createContext<ToastFn>(withMethods(() => {}));

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setItems((it) => [...it, { id, msg, type }]);
    setTimeout(() => setItems((it) => it.filter((x) => x.id !== id)), 3200);
  }, []);

  const toast = useMemo(() => withMethods(push), [push]);

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-slate-900',
  };

  return (
    <Ctx.Provider value={toast}>
      {children}
      {/* aria-live: leitores de tela anunciam o aviso sem tirar o foco do usuário */}
      <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`${colors[t.type]} text-white px-4 py-3 rounded-lg shadow-lg2 text-sm min-w-[240px] animate-[slideIn_.2s]`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
