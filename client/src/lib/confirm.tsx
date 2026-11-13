import { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import Modal from '../components/Modal';

export type ConfirmOptions = {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Botão vermelho, para ações que apagam dados. */
  danger?: boolean;
};

/**
 * Pergunta sim/não sem travar a tela. Responde true (confirmou) ou false (cancelou, Esc ou clique fora).
 *   const ok = await confirm({ title: 'Excluir aluno', message: '...', confirmLabel: 'Excluir', danger: true });
 *   const ok = await confirm('Remover este lançamento?');   (só o texto também vale)
 */
type ConfirmFn = (options: string | ConfirmOptions) => Promise<boolean>;

// Fora do ConfirmProvider responde sempre "não", para nunca apagar nada por engano
const Ctx = createContext<ConfirmFn>(async () => false);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    // Se já havia uma pergunta aberta, ela conta como "não"
    resolveRef.current?.(false);
    setOptions(typeof opts === 'string' ? { message: opts } : opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const answer = useCallback((ok: boolean) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  const cancel = useCallback(() => answer(false), [answer]);

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {options && (
        <Modal title={options.title ?? 'Confirmar'} onClose={cancel}>
          <p className="text-sm text-slate-700 whitespace-pre-line">{options.message}</p>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={cancel}>
              {options.cancelLabel ?? 'Cancelar'}
            </button>
            <button
              className={`btn ${options.danger ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => answer(true)}
              autoFocus={!options.danger}
            >
              {options.confirmLabel ?? 'Confirmar'}
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
