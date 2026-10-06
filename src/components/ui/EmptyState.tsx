import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
      {action}
    </div>
  );
}
