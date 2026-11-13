import { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import Modal from '../components/Modal';

type ConfirmFn = (message: string) => Promise<boolean>;

const Ctx = createContext<ConfirmFn>(async () => false);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((msg) => {
    setMessage(msg);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const answer = useCallback((ok: boolean) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setMessage(null);
  }, []);

  const cancel = useCallback(() => answer(false), [answer]);

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {message !== null && (
        <Modal title="Confirmar" onClose={cancel}>
          <p className="text-sm text-slate-700">{message}</p>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={cancel}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={() => answer(true)} autoFocus>
              Confirmar
            </button>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  );
}

export function useConfirm() {
  return useContext(Ctx);
}
