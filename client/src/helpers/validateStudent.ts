import { Student } from '../types';

export const onlyDigits = (v: string) => v.replace(/\D/g, '');

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export const maskCpf = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};
export const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
};
export const maskCep = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

export type EnrollmentForm = Partial<Student> & {
  password?: string;
  installments?: number;
  firstDueDate?: string;
};

const REQUIRED: [keyof EnrollmentForm, string][] = [
  ['name', 'Nome completo'], ['cpf', 'CPF'], ['rg', 'RG'], ['birthDate', 'Data de nascimento'],
  ['birthplace', 'Naturalidade'], ['gender', 'Gênero'], ['email', 'E-mail'], ['phone', 'Telefone'],
  ['address', 'Endereço'], ['city', 'Cidade'], ['state', 'Estado (UF)'], ['zipCode', 'CEP'],
  ['motherName', 'Nome da mãe'], ['fatherName', 'Nome do pai'], ['educationLevel', 'Nível escolar'],
];

/** Erros por campo: { nomeDoCampo: mensagem }. Objeto vazio = tudo certo. */
export type FieldErrors = Partial<Record<keyof EnrollmentForm, string>>;

/** Valida o formulário com as mesmas regras do backend e diz qual campo está errado. */
export function validateEnrollment(f: EnrollmentForm, isEdit: boolean): FieldErrors {
  const errs: FieldErrors = {};
  for (const [k] of REQUIRED) {
    if (!String(f[k] ?? '').trim()) errs[k] = 'Campo obrigatório';
  }
  if (!errs.name && f.name!.trim().split(/\s+/).length < 2) errs.name = 'Informe nome e sobrenome';
  if (!errs.cpf && !isValidCpf(f.cpf!)) errs.cpf = 'CPF inválido';
  if (!errs.email && !/^\S+@\S+\.\S+$/.test(f.email!)) errs.email = 'E-mail inválido';
  if (!errs.phone && ![10, 11].includes(onlyDigits(f.phone!).length)) errs.phone = 'Telefone inválido (DDD + número)';
  if (!errs.zipCode && onlyDigits(f.zipCode!).length !== 8) errs.zipCode = 'CEP inválido (8 dígitos)';
  if (!errs.state && f.state!.trim().length !== 2) errs.state = 'UF com 2 letras';
  if (!isEdit) {
    if (!f.moduleNumber) errs.moduleNumber = 'Escolha o módulo';
    if (!(Number(f.monthlyFee) > 0)) errs.monthlyFee = 'Informe o valor da parcela';
    if (!(Number(f.installments) >= 1)) errs.installments = 'Informe o número de parcelas';
    if (!f.firstDueDate) errs.firstDueDate = 'Informe o primeiro vencimento';
    if (f.password && (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))) {
      errs.password = 'Mínimo 8 caracteres, com letras e números (ou deixe em branco para gerar)';
    }
  }
  return errs;
}
