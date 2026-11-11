export interface Session {
  userId: string;
  type: 'admin' | 'student';
  /** Só para alunos: situação carregada do banco a cada requisição. */
  status?: string;
  contractAccepted?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      session?: Session;
    }
  }
}

export {};
