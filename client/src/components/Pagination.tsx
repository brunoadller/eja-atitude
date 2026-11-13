const PAGE_SIZES = [10, 20, 50, 100];

/** Rodapé de paginação: "21–40 de 134", Anterior/Próxima e itens por página. */
export default function Pagination({
  page, pageSize, total, onPage, onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize?: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-sm text-slate-600">
      <div>{from}–{to} de {total}</div>
      <div className="flex items-center gap-2">
        {onPageSize && (
          <select className="input w-auto py-1" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} aria-label="Itens por página">
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} por página</option>)}
          </select>
        )}
        <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
        <span className="tabular-nums">Página {page} de {pages}</span>
        <button className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Próxima</button>
      </div>
    </div>
  );
}
