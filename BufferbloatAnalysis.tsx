import React from 'react';
import { BufferbloatReport } from '../types/speedtest';
import { ShieldAlert, ShieldCheck, Zap, Activity, Info } from 'lucide-react';

interface BufferbloatAnalysisProps {
  report: BufferbloatReport | null;
  lang: 'vi' | 'en';
}

export const BufferbloatAnalysis: React.FC<BufferbloatAnalysisProps> = ({ report, lang }) => {
  const gradesList: Array<{
    grade: BufferbloatReport['grade'];
    range: string;
    descVi: string;
    descEn: string;
  }> = [
    { grade: 'A+', range: 'Δ ≤ 5ms', descVi: 'Hoàn hảo (Không trễ)', descEn: 'Flawless (Zero lag)' },
    { grade: 'A', range: 'Δ ≤ 18ms', descVi: 'Rất tốt (Ổn định cao)', descEn: 'Great (Minimal lag)' },
    { grade: 'B', range: 'Δ ≤ 45ms', descVi: 'Khá tốt (Trễ nhẹ khi tải nặng)', descEn: 'Good (Acceptable)' },
    { grade: 'C', range: 'Δ ≤ 95ms', descVi: 'Trung bình (Nghẽn hàng đợi)', descEn: 'Fair (Noticeable lag)' },
    { grade: 'D', range: 'Δ ≤ 180ms', descVi: 'Kém (Router quá tải nặng)', descEn: 'Poor (Queue overflow)' },
    { grade: 'F', range: 'Δ > 180ms', descVi: 'Rất kém (Cần bật SQM)', descEn: 'Critical (Lacks SQM)' },
  ];

  if (!report) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">
            {lang === 'vi' ? 'Kiểm Định Độ Trễ Dưới Tải (Bufferbloat SQM)' : 'Bufferbloat Latency Under Load Test'}
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {lang === 'vi'
            ? 'Đo lường độ ổn định của ping khi đường truyền bị ép tải cực đại trong lúc tải xuống và tải lên. Kết quả và xếp hạng A+/A/B/C/D/F sẽ hiển thị ngay khi hoàn tất bài đo.'
            : 'Measures round-trip latency degradation during maximum line saturation. Populates with A+/A/B/C/D/F grades upon test completion.'}
        </p>

        {/* Grade Reference Scale Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-4 pt-3 border-t border-slate-800/80">
          {gradesList.map((g) => (
            <div key={g.grade} className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-center">
              <span className="font-mono font-bold text-xs text-slate-400">Hạng {g.grade}</span>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">{g.range}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        };
      case 'B':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          icon: <Zap className="w-5 h-5 text-cyan-400" />,
        };
      case 'C':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: <Activity className="w-5 h-5 text-amber-400" />,
        };
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
        };
    }
  };

  const badge = getGradeBadge(report.grade);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Header & Grade */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {lang === 'vi' ? 'Kiểm Định Bufferbloat & Độ Trễ Khi Nghẽn Mạng' : 'Bufferbloat & Saturation Latency Analysis'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'vi' ? report.verdictVi : report.verdictEn}
          </p>
        </div>

        {/* Grade Stamp */}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${badge.bg}`}>
          {badge.icon}
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              {lang === 'vi' ? 'Xếp Hạng' : 'Grade'}
            </div>
            <div className="text-2xl font-extrabold font-mono leading-none">
              {report.grade}
            </div>
          </div>
        </div>
      </div>

      {/* Latency Trio: Idle vs Download Active vs Upload Active */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Idle */}
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-[11px] text-slate-400 mb-1">
            {lang === 'vi' ? 'Ping Khi Nhàn Rỗi (Idle)' : 'Idle Ping'}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {report.idlePing}
            </span>
            <span className="text-xs font-mono text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {lang === 'vi' ? 'Độ trễ cơ sở không có tải' : 'Baseline network latency'}
          </div>
        </div>

        {/* Download Loaded */}
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-[11px] text-slate-400 mb-1">
            {lang === 'vi' ? 'Ping Khi Tải Xuống (Download)' : 'Download Loaded Ping'}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-cyan-300 tabular-nums">
              {report.downloadLoadedPing}
            </span>
            <span className="text-xs font-mono text-slate-400">ms</span>
            <span className="text-xs font-mono font-semibold text-amber-400">
              (+{report.downloadDelta}ms)
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {report.downloadDelta <= 18
              ? (lang === 'vi' ? 'Độ trễ tăng không đáng kể' : 'Virtually uncompromised')
              : (lang === 'vi' ? 'Hàng đợi download bị nghẽn' : 'Download queue delay')}
          </div>
        </div>

        {/* Upload Loaded */}
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-[11px] text-slate-400 mb-1">
            {lang === 'vi' ? 'Ping Khi Tải Lên (Upload)' : 'Upload Loaded Ping'}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">
              {report.uploadLoadedPing}
            </span>
            <span className="text-xs font-mono text-slate-400">ms</span>
            <span className="text-xs font-mono font-semibold text-amber-400">
              (+{report.uploadDelta}ms)
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {report.uploadDelta <= 20
              ? (lang === 'vi' ? 'Buffer hàng đợi mượt mà' : 'Clean upstream buffer')
              : (lang === 'vi' ? 'Hàng đợi upload bị dồn' : 'Upstream bottleneck')}
          </div>
        </div>
      </div>

      {/* Practical Impact & Solution */}
      <div className="p-3.5 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
        <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cyan-200">
            {lang === 'vi' ? 'Đánh giá thực tế: ' : 'Real-world takeaway: '}
          </strong>
          {lang === 'vi' ? report.impactVi : report.impactEn}
        </div>
      </div>

      {/* Complete A+/A/B/C/D/F Explanation Table */}
      <div className="pt-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>{lang === 'vi' ? 'Thang Đánh Giá Bufferbloat Toàn Diện (A+ Đến F)' : 'Bufferbloat Rating Scale (A+ to F)'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {gradesList.map((item) => {
            const isCurrent = item.grade === report.grade;
            return (
              <div
                key={item.grade}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-xs font-bold ring-1 ring-cyan-400'
                    : 'bg-slate-950/40 border-slate-800/70 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className={`font-mono text-xs font-extrabold ${isCurrent ? 'text-cyan-300' : 'text-slate-300'}`}>
                    Hạng {item.grade}
                  </span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </div>
                <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{item.range}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {lang === 'vi' ? item.descVi : item.descEn}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
