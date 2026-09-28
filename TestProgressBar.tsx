import React from 'react';
import { TestPhase } from '../types/speedtest';
import { Activity, ArrowDownCircle, ArrowUpCircle, Zap, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

interface TestProgressBarProps {
  phase: TestPhase;
  progressPercent: number;
  statusText: string;
  lang: 'vi' | 'en';
}

export const TestProgressBar: React.FC<TestProgressBarProps> = ({
  phase,
  progressPercent,
  statusText,
  lang,
}) => {
  if (phase === 'idle') return null;

  const steps = [
    { key: 'ping', labelVi: '1. Ping Idle', labelEn: '1. Ping', icon: Activity },
    { key: 'download', labelVi: '2. Download', labelEn: '2. Download', icon: ArrowDownCircle },
    { key: 'upload', labelVi: '3. Upload', labelEn: '3. Upload', icon: ArrowUpCircle },
    { key: 'jitter_loss', labelVi: '4. Jitter & Loss', labelEn: '4. Jitter/Loss', icon: Zap },
    { key: 'bufferbloat', labelVi: '5. Bufferbloat', labelEn: '5. Bufferbloat', icon: ShieldCheck },
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['detecting', 'ping', 'download', 'upload', 'jitter_loss', 'bufferbloat', 'complete'];
    const currentIdx = order.indexOf(phase);
    const stepIdx = order.indexOf(stepKey);

    if (phase === 'complete') return 'completed';
    if (currentIdx === stepIdx) return 'active';
    if (currentIdx > stepIdx) return 'completed';
    return 'pending';
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
      {/* Top line: Status text & Progress % */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {phase !== 'complete' ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="font-semibold text-slate-200 truncate">
            {statusText}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono shrink-0">
          <span className="text-slate-400">{lang === 'vi' ? 'Tiến trình:' : 'Progress:'}</span>
          <span className="text-emerald-400 font-extrabold text-sm tabular-nums">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-300 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          style={{ width: `${Math.min(Math.max(progressPercent, 2), 100)}%` }}
        />
      </div>

      {/* Step Badges Row */}
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {steps.map((st) => {
          const status = getStepStatus(st.key);
          const Icon = st.icon;

          let badgeStyle = 'bg-slate-950/40 text-slate-500 border-slate-800/60';
          if (status === 'active') {
            badgeStyle = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 font-bold animate-pulse';
          } else if (status === 'completed') {
            badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold';
          }

          return (
            <div
              key={st.key}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] sm:text-[11px] truncate transition-colors ${badgeStyle}`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span className="truncate">{lang === 'vi' ? st.labelVi : st.labelEn}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
