import { ReactNode, useEffect } from 'react';

export default function Modal({title,onClose,children,size = 'md',}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'lg';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 grid place-items-center p-4 z-[100] animate-[fadeIn_.2s]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white rounded-xl shadow-lg2 w-full ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-2xl'
        } max-h-[90vh] overflow-y-auto animate-[slideUp_.25s]`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
