type Col<T> = {
  key: keyof T;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  width?: number | string;
};

export function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  rowClassName,
}: {
  columns: Col<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string | number;
  rowClassName?: (row: T, index: number) => string | undefined;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-gray-300">
          <tr>
            {columns.map((c) => {
              const align = c.align ?? "left";
              const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
              const style = c.width !== undefined ? { width: c.width } : undefined;
              return (
                <th
                  key={String(c.key)}
                  className={`px-3 py-2 font-medium ${alignCls} ${c.className ?? ""}`}
                  style={style}
                >
                  {c.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row, i) : i}
              className={`border-t border-white/10 hover:bg-white/5 transition-colors ${rowClassName ? rowClassName(row, i) ?? "" : ""}`}
            >
              {columns.map((c) => {
                const align = c.align ?? "left";
                const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
                return (
                  <td key={String(c.key)} className={`px-3 py-2 align-middle ${alignCls} ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : String(row[c.key])}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
