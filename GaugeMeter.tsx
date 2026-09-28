import React, { useMemo } from 'react';
import { TestPhase } from '../types/speedtest';

interface GaugeMeterProps {
  currentSpeed: number; // in current unit (e.g. Mbps)
  phase: TestPhase;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  lang: 'vi' | 'en';
  unit: 'Mbps' | 'MB/s';
  isEnterpriseMode?: boolean;
}

export const GaugeMeter: React.FC<GaugeMeterProps> = ({
  currentSpeed,
  phase,
  isRunning,
  onStart,
  onStop,
  lang,
  unit,
  isEnterpriseMode = true,
}) => {
  // Determine adaptive max speed for the dial based on current reading
  const maxDial = useMemo(() => {
    if (unit === 'MB/s') {
      if (currentSpeed > 250) return 1000;
      if (currentSpeed > 60) return 300;
      if (currentSpeed > 25) return 100;
      return 50;
    }
    // Mbps
    if (currentSpeed > 2500) return 10000;
    if (currentSpeed > 1000) return 2500;
    if (currentSpeed > 500) return 1000;
    if (currentSpeed > 100) return 500;
    return 100;
  }, [currentSpeed, unit]);

  // Arc math: 240 degrees total sweep, from 150 deg to 390 deg (-210 to 30)
  const startAngle = 145;
  const endAngle = 395;
  const totalSweep = endAngle - startAngle;

  const fraction = Math.min(Math.max(currentSpeed / maxDial, 0), 1);
  const currentAngle = startAngle + fraction * totalSweep;

  const radius = 136;
  const center = 160;

  // Compute ticks
  const ticks = useMemo(() => {
    const tickSteps = 10;
    return Array.from({ length: tickSteps + 1 }).map((_, i) => {
      const stepFraction = i / tickSteps;
      const angleDeg = startAngle + stepFraction * totalSweep;
      const angleRad = (angleDeg * Math.PI) / 180;
      const val = Math.round(stepFraction * maxDial);

      const x1 = center + (radius - 4) * Math.cos(angleRad);
      const y1 = center + (radius - 4) * Math.sin(angleRad);
      const isMajor = i % 2 === 0;
      const x2 = center + (radius - (isMajor ? 14 : 9)) * Math.cos(angleRad);
      const y2 = center + (radius - (isMajor ? 14 : 9)) * Math.sin(angleRad);

      const textR = radius - 26;
      const textX = center + textR * Math.cos(angleRad);
      const textY = center + textR * Math.sin(angleRad);

      return {
        key: i,
        x1,
        y1,
        x2,
        y2,
        textX,
        textY,
        val,
        isMajor,
        isActive: stepFraction <= fraction,
      };
    });
  }, [maxDial, totalSweep, startAngle, fraction, radius, center]);

  // Arc path helpers
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(cx, cy, r, startA);
    const end = polarToCartesian(cx, cy, r, endA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const backgroundArc = describeArc(center, center, radius, startAngle, endAngle);
  const activeArc = describeArc(
    center,
    center,
    radius,
    startAngle,
    Math.max(currentAngle, startAngle + 0.1)
  );

  // Pointer tip coordinates
  const needleRad = (currentAngle * Math.PI) / 180;
  const needleLength = radius - 30;
  const needleX = center + needleLength * Math.cos(needleRad);
  const needleY = center + needleLength * Math.sin(needleRad);

  const getPhaseColor = () => {
    if (phase === 'download') return 'cyan';
    if (phase === 'upload') return 'emerald';
    if (phase === 'ping') return 'amber';
    return 'cyan';
  };

  const phaseColor = getPhaseColor();

  const getPhaseText = () => {
    switch (phase) {
      case 'detecting':
        return lang === 'vi' ? 'Đang kết nối trạm đo...' : 'Connecting to test node...';
      case 'ping':
        return lang === 'vi' ? 'Đo Ping & Jitter...' : 'Testing Ping & Jitter...';
      case 'download':
        return lang === 'vi' ? 'Đang đo Tải xuống (Download)...' : 'Measuring Download Speed...';
      case 'upload':
        return lang === 'vi' ? 'Đang đo Tải lên (Upload)...' : 'Measuring Upload Speed...';
      case 'complete':
        return lang === 'vi' ? 'Kiểm tra hoàn tất' : 'Test Completed';
      default:
        return lang === 'vi' ? 'Sẵn sàng kiểm tra' : 'Ready to Start';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-1 w-full overflow-hidden">
      {/* Dynamic Glow Background */}
      <div
        className={`absolute w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-all duration-700 ${
          phase === 'upload'
            ? 'bg-emerald-500'
            : phase === 'ping'
            ? 'bg-amber-500'
            : 'bg-cyan-500'
        }`}
      />

      {/* SVG Tachometer Dial - optimized viewBox and sizing for mobile & desktop */}
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-[350px] lg:max-w-[370px] aspect-[320/275] flex items-center justify-center">
        <svg
          viewBox="0 0 320 280"
          className="w-full h-full drop-shadow-[0_0_24px_rgba(6,182,212,0.15)]"
        >
          <defs>
            <linearGradient id="cyanArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="emeraldArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="amberArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Outer Ring Track */}
          <path
            d={backgroundArc}
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Active Colored Arc Track */}
          <path
            d={activeArc}
            fill="none"
            stroke={
              phase === 'upload'
                ? 'url(#emeraldArcGrad)'
                : phase === 'ping'
                ? 'url(#amberArcGrad)'
                : 'url(#cyanArcGrad)'
            }
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#glow)"
            className="transition-all duration-150 ease-out"
          />

          {/* Dial Ticks & Numbers */}
          {ticks.map((t) => (
            <g key={t.key}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.isActive ? (phaseColor === 'emerald' ? '#34d399' : '#38bdf8') : '#475569'}
                strokeWidth={t.isMajor ? 2.5 : 1.5}
                strokeLinecap="round"
                className="transition-colors duration-150"
              />
              {t.isMajor && (
                <text
                  x={t.textX}
                  y={t.textY}
                  fill={t.isActive ? '#f8fafc' : '#64748b'}
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="transition-colors duration-150"
                >
                  {t.val}
                </text>
              )}
            </g>
          ))}

          {/* Needle / Indicator Ray */}
          {isRunning && (
            <g className="transition-all duration-150 ease-out">
              <line
                x1={center}
                y1={center}
                x2={needleX}
                y2={needleY}
                stroke={phaseColor === 'emerald' ? '#34d399' : '#38bdf8'}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              <circle
                cx={needleX}
                cy={needleY}
                r="3.5"
                fill="#ffffff"
                filter="url(#glow)"
              />
            </g>
          )}

          {/* Center Hub Outer Ring */}
          <circle
            cx={center}
            cy={center}
            r="16"
            fill="#0f172a"
            stroke={phaseColor === 'emerald' ? '#059669' : '#0891b2'}
            strokeWidth="2"
          />
          <circle
            cx={center}
            cy={center}
            r="6"
            fill={phaseColor === 'emerald' ? '#34d399' : '#22d3ee'}
          />
        </svg>

        {/* Center Overlay: Big Digital Speed Readout or GO button */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 sm:pt-10 pointer-events-none">
          {isRunning || phase === 'complete' ? (
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-baseline gap-1">
                <span className="font-mono tabular-nums font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tighter drop-shadow-md">
                  {currentSpeed.toFixed(1)}
                </span>
                <span className="font-mono text-sm sm:text-base font-semibold text-cyan-400">
                  {unit}
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1 max-w-[200px] text-center truncate">
                {getPhaseText()}
              </span>
            </div>
          ) : (
            <div className="pointer-events-auto">
              <button
                type="button"
                onClick={onStart}
                className="group relative flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900 border-2 border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.35)] hover:border-cyan-400 hover:shadow-[0_0_45px_rgba(6,182,212,0.6)] active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <div className="absolute inset-1 rounded-full border border-cyan-500/20 group-hover:border-cyan-400/50 transition-colors" />
                <span className="text-xl sm:text-2xl font-extrabold tracking-wider text-cyan-300 group-hover:text-white transition-colors">
                  {lang === 'vi' ? (isEnterpriseMode ? 'ĐO MẠNG' : 'BẮT ĐẦU') : (isEnterpriseMode ? 'AUDIT' : 'START')}
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-mono text-slate-400 mt-0.5">
                  {isEnterpriseMode ? (lang === 'vi' ? 'VĂN PHÒNG' : 'ENTERPRISE') : 'SPEEDTEST'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar Beneath Gauge */}
      <div className="mt-2 flex items-center gap-3">
        {isRunning ? (
          <button
            type="button"
            onClick={onStop}
            className="px-5 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {lang === 'vi' ? 'Hủy kiểm tra' : 'Cancel Test'}
          </button>
        ) : phase === 'complete' ? (
          <button
            type="button"
            onClick={onStart}
            className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer whitespace-nowrap"
          >
            {lang === 'vi' ? 'Đo lại lần nữa' : 'Test Again'}
          </button>
        ) : null}
      </div>
    </div>
  );
};
