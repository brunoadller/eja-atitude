/**
 * Catálogo de disciplinas por módulo (= apostilas de cada livro).
 *  - Módulo 1 (início do ano, 1º semestre) -> Livro 1
 *  - Módulo 2 (final do ano, 2º semestre)  -> Livro 2
 * Os nomes de `subject` são os mesmos usados nas apostilas, no cronograma, nas notas e no histórico.
 */
export type ModuleNumber = 1 | 2;

export interface CurriculumItem {
  subject: string;
  file: string; // arquivo dentro de server/uploads/apostilas
  description: string;
}

export const MODULE_NUMBERS: ModuleNumber[] = [1, 2];

export const MODULE_LABEL: Record<ModuleNumber, string> = { 1: 'EJA I', 2: 'EJA II' };
export const MODULE_ROMAN: Record<ModuleNumber, string> = { 1: 'I', 2: 'II' };

export const CURRICULUM: Record<ModuleNumber, CurriculumItem[]> = {
  1: [
    { subject: 'Artes', file: 'modulo1_artes.pdf', description: 'Livro 1 — Artes: da pré-história às primeiras civilizações e à arte clássica.' },
    { subject: 'Biologia', file: 'modulo1_biologia.pdf', description: 'Livro 1 — Biologia: citologia, organização dos seres vivos e fisiologia humana.' },
    { subject: 'Espanhol', file: 'modulo1_espanhol.pdf', description: 'Livro 1 — Espanhol: fundamentos do idioma e comunicação básica.' },
    { subject: 'Filosofia', file: 'modulo1_filosofia.pdf', description: 'Livro 1 — Filosofia: introdução ao pensamento filosófico.' },
    { subject: 'Física', file: 'modulo1_fisica.pdf', description: 'Livro 1 — Física: fundamentos de cinemática e dinâmica.' },
    { subject: 'Geografia', file: 'modulo1_geografia.pdf', description: 'Livro 1 — Geografia: espaço geográfico, população e meio ambiente.' },
    { subject: 'História', file: 'modulo1_historia.pdf', description: 'Livro 1 — História: da Antiguidade à Idade Contemporânea.' },
    { subject: 'Língua Portuguesa', file: 'modulo1_lingua_portuguesa.pdf', description: 'Livro 1 — Língua Portuguesa: leitura, gramática e análise sintática.' },
    { subject: 'Matemática', file: 'modulo1_matematica.pdf', description: 'Livro 1 — Matemática: conjuntos, funções, logaritmos, matrizes e trigonometria.' },
    { subject: 'Química', file: 'modulo1_quimica.pdf', description: 'Livro 1 — Química: matéria, estrutura atômica e tabela periódica.' },
    { subject: 'Sociologia', file: 'modulo1_sociologia.pdf', description: 'Livro 1 — Sociologia: sociedade, cultura e estratificação social.' },
  ],
  2: [
    { subject: 'Artes', file: 'artes.pdf', description: 'Linguagens artísticas, história da arte e expressão cultural como ferramenta de formação integral.' },
    { subject: 'Biologia', file: 'biologia.pdf', description: 'Citologia, ecologia, genética e corpo humano, com ênfase em saúde e meio ambiente.' },
    { subject: 'Espanhol', file: 'espanhol.pdf', description: 'Fundamentos do idioma espanhol, comunicação básica e compreensão de textos simples.' },
    { subject: 'Filosofia', file: 'filosofia.pdf', description: 'Pensamento crítico, ética e principais correntes filosóficas aplicadas à vida prática.' },
    { subject: 'Física', file: 'fisica.pdf', description: 'Mecânica, energia, eletricidade e fenômenos físicos do dia a dia, com abordagem prática.' },
    { subject: 'Geografia', file: 'geografia.pdf', description: 'Geografia física e humana, globalização, meio ambiente e questões territoriais contemporâneas.' },
    { subject: 'História', file: 'historia.pdf', description: 'Processos históricos do Brasil e do mundo, com foco em cidadania e formação crítica.' },
    { subject: 'LEM Inglês', file: 'lem_ingles.pdf', description: 'Inglês básico e intermediário voltado à comunicação prática e compreensão de textos.' },
    { subject: 'Língua Portuguesa', file: 'lingua_portuguesa.pdf', description: 'Interpretação de texto, gramática, produção textual e leitura crítica.' },
    { subject: 'Matemática Financeira', file: 'matematica_financeira.pdf', description: 'Juros, orçamento pessoal, planejamento financeiro e aplicação prática de cálculos financeiros.' },
    { subject: 'Matemática', file: 'matematica.pdf', description: 'Operações fundamentais, álgebra, geometria e resolução de problemas aplicados ao cotidiano.' },
    { subject: 'Projeto de Vida', file: 'projeto_de_vida.pdf', description: 'Planejamento pessoal e profissional, autoconhecimento e construção de metas de futuro.' },
    { subject: 'Química', file: 'quimica.pdf', description: 'Estrutura da matéria, reações químicas e química aplicada ao cotidiano e à indústria.' },
    { subject: 'Sociologia', file: 'sociologia.pdf', description: 'Sociedade, cultura e relações de poder, com foco em cidadania e senso crítico.' },
  ],
};

export const subjectsOfModule = (m: ModuleNumber): string[] => CURRICULUM[m].map((c) => c.subject);

/** Chave da turma/cronograma: "EJA Etapa II 2026/2" (Etapa II = Ensino Médio; /1 ou /2 = módulo). */
export const classGroupFor = (year: number, moduleNumber: ModuleNumber): string =>
  `EJA Etapa II ${year}/${moduleNumber}`;

/** Linhas fixas do histórico/certificado (modelo da escola), na ordem do modelo. */
export const TRANSCRIPT_ROWS = [
  'Língua Portuguesa', 'Matemática', 'Biologia', 'Física', 'Química', 'História', 'Geografia', 'Artes',
  'Sociologia', 'Filosofia', 'LEM Inglês', 'Ed. Física', 'Projeto de Vida', 'Matemática Financeira',
  'Espanhol', 'Ética nas relações de Trabalho',
] as const;
