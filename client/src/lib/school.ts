import { useEffect, useState } from 'react';
import { api } from './api';

/** Dados da escola para exibir nas telas. Vêm do servidor (server/src/config/school.ts); nunca escreva o nome aqui. */
export interface SchoolInfo {
  name: string;
  legalName: string;
}

/** Arquivos em client/public (o Vite publica na raiz do site). */
export const SCHOOL_LOGO = '/logo-escola.png';
export const SCHOOL_ICON = '/icon-192.png';

// Uma busca só por carregamento da página, compartilhada por todos os componentes.
let cache: Promise<SchoolInfo | null> | null = null;
function loadSchool() {
  cache ??= api<SchoolInfo>('school').catch(() => null);
  return cache;
}

export function useSchool(): SchoolInfo | null {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  useEffect(() => {
    let alive = true;
    loadSchool().then((s) => {
      if (!alive || !s) return;
      setSchool(s);
      document.title = `${s.name} · Portal`; // título da aba
    });
    return () => {
      alive = false;
    };
  }, []);
  return school;
}
