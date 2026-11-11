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

/** Devolve a lista de problemas (vazia = ok). Mesmas regras do backend. */
export function validateEnrollment(f: EnrollmentForm, isEdit: boolean): string[] {
  const errs: string[] = [];
  for (const [k, label] of REQUIRED) {
    if (!String(f[k] ?? '').trim()) errs.push(`${label} é obrigatório`);
  }
  if (f.name && f.name.trim().split(/\s+/).length < 2) errs.push('Informe nome e sobrenome');
  if (f.cpf && !isValidCpf(f.cpf)) errs.push('CPF inválido');
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) errs.push('E-mail inválido');
  if (f.phone && ![10, 11].includes(onlyDigits(f.phone).length)) errs.push('Telefone inválido (DDD + número)');
  if (f.zipCode && onlyDigits(f.zipCode).length !== 8) errs.push('CEP inválido (8 dígitos)');
  if (f.state && f.state.trim().length !== 2) errs.push('UF deve ter 2 letras');
  if (!isEdit) {
    if (!f.moduleNumber) errs.push('Escolha o módulo');
    if (!(Number(f.monthlyFee) > 0)) errs.push('Informe o valor da parcela');
    if (!(Number(f.installments) >= 1)) errs.push('Informe o número de parcelas');
    if (!f.firstDueDate) errs.push('Informe o primeiro vencimento');
    if (f.password && (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))) {
      errs.push('Senha inicial: mínimo 8 caracteres com letras e números (ou deixe em branco para gerar uma)');
    }
  }
  return errs;
}
