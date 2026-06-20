import React from 'react';

const shimmer = `
  relative overflow-hidden
  before:absolute before:inset-0
  before:-translate-x-full
  before:animate-[shimmer_1.5s_infinite]
  before:bg-gradient-to-r
  before:from-transparent before:via-white/[0.06] before:to-transparent
`;

export const SkeletonCard: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="glass-panel p-6 flex flex-col gap-4 w-full">
    <div className={`h-5 w-1/3 rounded-lg bg-white/[0.05] ${shimmer}`} />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <div className={`h-3 rounded-md bg-white/[0.04] ${shimmer}`} style={{ width: `${70 + (i % 3) * 10}%` }} />
        <div className={`h-3 rounded-md bg-white/[0.03] w-1/2 ${shimmer}`} />
      </div>
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 4, cols = 5 }) => (
  <div className="glass-panel overflow-hidden w-full">
    {/* Header */}
    <div className="flex gap-4 px-6 py-4 border-b border-[var(--border-color)]">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={`h-3 rounded-md bg-white/[0.06] flex-1 ${shimmer}`} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 px-6 py-4 border-b border-[var(--border-color)] last:border-0">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className={`h-3 rounded-md bg-white/[0.04] flex-1 ${shimmer}`} style={{ opacity: 1 - j * 0.1 }} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonStatCards: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[16px] p-[18px_20px_20px] overflow-hidden shadow-sm">
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-[0_4px_4px_0] bg-white/[0.06] ${shimmer}`} />
        <div className={`h-2.5 w-2/3 rounded-md bg-white/[0.05] mb-3 ${shimmer}`} />
        <div className={`h-8 w-1/2 rounded-md bg-white/[0.07] ${shimmer}`} />
      </div>
    ))}
  </div>
);

export const PageLoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading…' }) => (
  <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-main)]">
    <div className="glass-panel flex flex-col items-center gap-4 px-10 py-8">
      <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
      <p className="text-sm font-semibold text-[var(--text-muted)]">{message}</p>
    </div>
  </div>
);
