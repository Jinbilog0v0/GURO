import React from 'react';
import { ActivityHeatmap } from './ActivityHeatmap';
import { BadgeCase } from './BadgeCase';
import { Flame, Award } from 'lucide-react';
import type { SyncedEvent } from './ParentOverview';

export interface ParentActivityBadgesProps {
  logs: SyncedEvent[];
}

export const ParentActivityBadges: React.FC<ParentActivityBadgesProps> = ({ logs }) => {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Flame size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] m-0">
              Practice Habit &amp; Milestones
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Track consistency, daily practice frequency, and badges unlocked by your child.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)]">
            <Award size={15} className="text-amber-500" />
            <span>Achievements Unlocked</span>
          </div>
        </div>
      </div>

      {/* 2-column or stacked grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Activity Heatmap Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
          <ActivityHeatmap logs={logs} />
        </div>

        {/* Badge Case Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
          <BadgeCase logs={logs} />
        </div>
      </div>
    </div>
  );
};
