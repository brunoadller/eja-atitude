import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Toast = { id: number; msg: string; type: 'success' | 'error' | 'info' };

const Ctx = createContext<(msg: string, type?: Toast['type']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setItems((it) => [...it, { id, msg, type }]);
    setTimeout(() => setItems((it) => it.filter((x) => x.id !== id)), 3200);
  }, []);

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-slate-900',
  };

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
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
