import { ReactNode } from "react";

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
  <section className="bg-white/5 border border-white/10 rounded-lg p-4 transition-all hover:bg-white/[0.07] hover:border-white/20 hover:shadow-lg/10">
      {title ? <h3 className="text-sm font-medium mb-2 text-gray-300">{title}</h3> : null}
      {children}
    </section>
  );
}
