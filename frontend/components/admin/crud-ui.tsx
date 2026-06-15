'use client';

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useState } from 'react';

type PaginationControlsProps = Readonly<{
  entityName: string;
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  activePageClassName: string;
  onPageChange: (page: number) => void;
}>;

export function useCrudPageState<TItem, TForm>(initialForm: TForm) {
  const [items, setItems] = useState<TItem[]>([]);
  const [form, setForm] = useState<TForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  return {
    items,
    setItems,
    form,
    setForm,
    editingId,
    setEditingId,
    loading,
    setLoading,
    saving,
    setSaving,
    error,
    setError,
    success,
    setSuccess,
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    setTotalPages,
  };
}

export function SectionTitle({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
      {children}
    </p>
  );
}

export function Field({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export function Label({
  children,
  htmlFor,
}: Readonly<{
  children: ReactNode;
  htmlFor: string;
}>) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
    >
      {children}
    </label>
  );
}

export function Input(props: Readonly<InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-500 ${
        props.className ?? 'focus:border-sky-400'
      }`}
    />
  );
}

export function Select(props: Readonly<SelectHTMLAttributes<HTMLSelectElement>>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition ${
        props.className ?? 'focus:border-sky-400'
      }`}
    />
  );
}

export function Info({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200/80">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function StatCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function PaginationControls({
  entityName,
  loading,
  page,
  limit,
  total,
  totalPages,
  activePageClassName,
  onPageChange,
}: PaginationControlsProps) {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-700">
          Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total}{' '}
          {entityName}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={page === 1 || loading}
            onClick={() => onPageChange(page - 1)}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNum = index + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  disabled={loading}
                  onClick={() => onPageChange(pageNum)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    pageNum === page
                      ? activePageClassName
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={page === totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
