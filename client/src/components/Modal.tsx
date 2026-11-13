import { ReactNode, useEffect, useId, useRef } from 'react';

// Elementos que recebem foco com Tab
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Pilha de modais abertos: só o de cima responde ao Esc e ao Tab (ex.: confirmação aberta por cima de outro modal)
const openModals: symbol[] = [];

export default function Modal({title,onClose,children,size = 'md',}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'lg';
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Guarda o onClose mais recente sem reiniciar o efeito a cada renderização
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Quem tinha o foco antes de abrir (lido na 1ª renderização, antes de qualquer autoFocus)
  const previousFocus = useRef<Element | null>(document.activeElement);

  useEffect(() => {
    const me = Symbol('modal');
    openModals.push(me);
    const box = boxRef.current!;

    // Foco inicial: respeita um autoFocus de dentro; senão, o primeiro campo/botão do conteúdo
    if (!box.contains(document.activeElement)) {
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)];
      (items.find((el) => !el.dataset.modalClose) ?? items[0] ?? box).focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (openModals[openModals.length - 1] !== me) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      // Mantém o Tab circulando dentro do modal
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !box.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !box.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      openModals.splice(openModals.indexOf(me), 1);
      // Devolve o foco para quem abriu o modal (ex.: o botão "Excluir")
      const prev = previousFocus.current;
      if (prev instanceof HTMLElement && document.contains(prev)) prev.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 grid place-items-center p-4 z-[100] animate-[fadeIn_.2s]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-white rounded-xl shadow-lg2 w-full ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-2xl'
        } max-h-[90vh] overflow-y-auto animate-[slideUp_.25s] outline-none`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 id={titleId} className="font-semibold">{title}</h3>
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Fechar" data-modal-close="true">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
