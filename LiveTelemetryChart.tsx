import React, { useMemo } from 'react';
import { MetricSample, TestPhase } from '../types/speedtest';

interface LiveTelemetryChartProps {
  samples: MetricSample[];
  currentPhase: TestPhase;
  currentSpeed?: number;
  averageSpeed?: number;
  peakSpeed?: number;
  lang: 'vi' | 'en';
}

export const LiveTelemetryChart: React.FC<LiveTelemetryChartProps> = ({
  samples,
  currentPhase,
  currentSpeed = 0,
  averageSpeed = 0,
  peakSpeed = 0,
  lang,
}) => {
  const chartHeight = 150;
  const chartWidth = 600;

  // Compute max speed for vertical scale (minimum 50 Mbps)
  const maxSpeed = useMemo(() => {
    if (samples.length === 0) return 60;
    const maxVal = Math.max(...samples.map((s) => s.speed), peakSpeed, 20);
    // Snap to nice round step (50, 100, 200, 300, 500, 1000)
    if (maxVal <= 50) return 60;
    if (maxVal <= 100) return 120;
    if (maxVal <= 250) return 300;
    if (maxVal <= 500) return 600;
    return Math.ceil(maxVal * 1.2);
  }, [samples, peakSpeed]);

  // Compute max time for horizontal scale (between 10s and 16s)
  const maxTime = useMemo(() => {
    if (samples.length === 0) return 12;
    const lastTime = samples[samples.length - 1].time;
    return Math.max(lastTime, 12);
  }, [samples]);

  // Map samples to coordinates
  const points = useMemo(() => {
    return samples.map((s) => {
      const x = Math.min((s.time / maxTime) * chartWidth, chartWidth);
      const y = chartHeight - Math.min((s.speed / maxSpeed) * (chartHeight - 20), chartHeight - 10);
      return { x, y, speed: s.speed, phase: s.phase, time: s.time };
    });
  }, [samples, maxTime, maxSpeed, chartWidth, chartHeight]);

  // Generate SVG path for line and area fill
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };

    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      const cy = (prev.y + curr.y) / 2;
      line += ` Q ${prev.x} ${prev.y}, ${cx} ${cy}`;
    }
    const lastPoint = points[points.length - 1];
    line += ` L ${lastPoint.x} ${lastPoint.y}`;

    const area = `${line} L ${lastPoint.x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

    return { linePath: line, areaPath: area };
  }, [points, chartHeight]);

  const isUpload = currentPhase === 'upload';
  const strokeColor = isUpload ? '#10b981' : '#06b6d4';
  const gradientId = isUpload ? 'uploadAreaGrad' : 'downloadAreaGrad';

  // Compute average reference line Y coordinate
  const avgY = averageSpeed > 0
    ? chartHeight - Math.min((averageSpeed / maxSpeed) * (chartHeight - 20), chartHeight - 10)
    : null;

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col">
      {/* Header with live statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              currentPhase === 'idle' || currentPhase === 'complete'
                ? 'bg-slate-500'
                : isUpload
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-cyan-400 animate-pulse'
            }`}
          />
          <h4 className="text-xs font-bold text-slate-200">
            {lang === 'vi' ? 'Đồ Thị Băng Thông Thời Gian Thực (10 - 15 Giây)' : 'Real-time Bandwidth Telemetry (10 - 15s)'}
          </h4>
        </div>

        {/* Live metric indicators: Current / Average / Peak */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Current:</span>
            <strong className={`tabular-nums ${isUpload ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {currentSpeed.toFixed(1)} Mbps
            </strong>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Avg:</span>
            <strong className="text-slate-200 tabular-nums">
              {averageSpeed.toFixed(1)} Mbps
            </strong>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Peak:</span>
            <strong className="text-white tabular-nums">
              {Math.max(peakSpeed, ...samples.map(s => s.speed), 0).toFixed(1)} Mbps
            </strong>
          </div>
        </div>
      </div>

      {/* SVG Chart with Y-axis markers */}
      <div className="relative w-full h-[150px] overflow-hidden flex">
        {/* Left Y-axis labels */}
        <div className="w-12 h-full flex flex-col justify-between text-[10px] font-mono text-slate-500 pr-1 py-1 text-right select-none shrink-0">
          <span>{maxSpeed}M</span>
          <span>{Math.round(maxSpeed * 0.75)}M</span>
          <span>{Math.round(maxSpeed * 0.5)}M</span>
          <span>{Math.round(maxSpeed * 0.25)}M</span>
          <span>0M</span>
        </div>

        {/* Chart Canvas Area */}
        <div className="relative flex-1 h-full overflow-hidden border-l border-b border-slate-800">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="downloadAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="uploadAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#1e293b" strokeDasharray="3 3" />

            {/* Average Reference Line */}
            {avgY !== null && (
              <line
                x1="0"
                y1={avgY}
                x2={chartWidth}
                y2={avgY}
                stroke="#64748b"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
            )}

            {/* Fill and Line */}
            {areaPath && (
              <path d={areaPath} fill={`url(#${gradientId})`} />
            )}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Current sample pulsating dot */}
            {points.length > 0 && (
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="4.5"
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth="2.5"
              />
            )}
          </svg>

          {samples.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-mono">
              {lang === 'vi' ? 'Đồ thị sẽ vẽ theo thời gian thực khi bắt đầu đo' : 'Graph will stream in real-time when test starts'}
            </div>
          )}
        </div>
      </div>

      {/* X-axis Time Markers */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1.5 pl-12">
        <span>0s</span>
        <span>{(maxTime * 0.25).toFixed(1)}s</span>
        <span>{(maxTime * 0.5).toFixed(1)}s</span>
        <span>{(maxTime * 0.75).toFixed(1)}s</span>
        <span>{maxTime.toFixed(1)}s (Elapsed)</span>
      </div>
    </div>
  );
};
