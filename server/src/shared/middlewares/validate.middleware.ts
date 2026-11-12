import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome', cpf: 'CPF', rg: 'RG', birthDate: 'Data de nascimento', gender: 'Gênero', email: 'E-mail',
  phone: 'Telefone', address: 'Endereço', city: 'Cidade', state: 'Estado (UF)', zipCode: 'CEP',
  motherName: 'Nome da mãe', fatherName: 'Nome do pai', birthplace: 'Naturalidade', nationality: 'Nacionalidade',
  educationLevel: 'Nível escolar', moduleNumber: 'Módulo', monthlyFee: 'Valor da parcela',
  installments: 'Número de parcelas', firstDueDate: 'Primeiro vencimento', password: 'Senha',
  passwordConfirm: 'Confirmação da senha', code: 'Código', score: 'Nota', date: 'Data', items: 'Disciplinas',
  subject: 'Disciplina', componentModule: 'Módulo da disciplina', examNumber: 'Prova',
  username: 'Usuário', currentPassword: 'Senha atual', newPassword: 'Nova senha', newPasswordConfirm: 'Confirmação da nova senha',
};

function describe(err: ZodError): string {
  return err.issues
    .map((i) => {
      const field = String(i.path[i.path.length - 1] ?? '');
      const label = FIELD_LABELS[field];
      return label ? `${label}: ${i.message}` : i.message;
    })
    .join(' · ');
}

/**
 * Valida body/query/params e SUBSTITUI req.body pelo resultado já limpo
 * (campos desconhecidos são rejeitados pelos schemas estritos).
 */
export const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params }) as {
        body?: unknown;
      };
      if (parsed && typeof parsed === 'object' && 'body' in parsed && parsed.body !== undefined) {
        req.body = parsed.body;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: describe(err), issues: err.issues });
      }
      next(err);
    }
  };
