import { useEffect, useState } from 'react';

/** Devolve o valor só depois que ele parar de mudar por `delay` ms (evita uma busca a cada tecla). */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
