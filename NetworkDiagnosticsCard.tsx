import React, { useState } from 'react';
import {
  NetworkDiagnostics,
  SpeedTestResult,
} from '../types/speedtest';
import {
  Activity,
  Wifi,
  Gamepad2,
  Video,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface NetworkDiagnosticsCardProps {
  result: SpeedTestResult;
  mode: 'basic' | 'technician';
  onToggleMode: (mode: 'basic' | 'technician') => void;
  lang: 'vi' | 'en';
}

export const NetworkDiagnosticsCard: React.FC<NetworkDiagnosticsCardProps> = ({
  result,
  mode,
  onToggleMode,
  lang,
}) => {
  const [showTechLogs, setShowTechLogs] = useState(false);
  const diag = result.diagnostics;

  const getScoreColor = (score: number) => {
    if (score >= 88) return 'text-emerald-400 border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
    if (score >= 75) return 'text-cyan-400 border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.3)]';
    if (score >= 60) return 'text-amber-400 border-amber-400/40 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]';
    return 'text-rose-400 border-rose-400/40 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.3)]';
  };

  const getStatusBadge = (status: 'good' | 'fair' | 'poor') => {
    if (status === 'good') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          {lang === 'vi' ? 'Tốt' : 'Good'}
        </span>
      );
    }
    if (status === 'fair') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
          <Info className="w-3 h-3 text-amber-400" />
          {lang === 'vi' ? 'Khá' : 'Fair'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
        <AlertTriangle className="w-3 h-3 text-rose-400" />
        {lang === 'vi' ? 'Lưu ý' : 'Poor'}
      </span>
    );
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {lang === 'vi' ? 'Đánh Giá & Chẩn Đoán Đường Truyền' : 'Network Diagnostics & Benchmark'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'vi'
              ? 'Tổng hợp đa chiều từ tốc độ, độ trễ RTT, Jitter và hàng đợi Bufferbloat'
              : 'Holistic performance rating based on bandwidth, latency, jitter & bufferbloat'}
          </p>
        </div>

        {/* Basic vs Technician Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleMode('basic')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'basic'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'vi' ? 'Cơ Bản' : 'Basic'}
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('technician')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'technician'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Kỹ Thuật Viên' : 'Technician'}</span>
          </button>
        </div>
      </div>

      {/* Main Score & Quick Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Speedtest SCORE Box */}
        <div className="md:col-span-4 bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            speedtest SCORE
          </div>

          <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center my-1 ${getScoreColor(diag.score)}`}>
            <span className="text-4xl font-extrabold font-mono tracking-tight leading-none">
              {diag.score}
            </span>
            <span className="text-[11px] font-mono text-slate-400 mt-1">/ 100</span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              {lang === 'vi' ? 'Xếp hạng:' : 'Grade:'}
            </span>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-800 text-white border border-slate-700">
              Hạng {diag.grade}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {diag.internet.rating}
          </div>
        </div>

        {/* 6 Metrics Summary Table */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Download */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-mono text-slate-400">
              {lang === 'vi' ? 'Tải Xuống (Avg)' : 'Download'}
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                {result.download.average.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Mbps</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Peak: <strong className="text-slate-300">{result.download.peak.toFixed(1)}</strong>
            </div>
          </div>

          {/* Upload */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-mono text-slate-400">
              {lang === 'vi' ? 'Tải Lên (Avg)' : 'Upload'}
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {result.upload.average.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Mbps</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Peak: <strong className="text-slate-300">{result.upload.peak.toFixed(1)}</strong>
            </div>
          </div>

          {/* Ping Idle */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-mono text-slate-400">
              {lang === 'vi' ? 'Độ Trễ (Idle)' : 'Ping Idle'}
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums">
                {result.ping}
              </span>
              <span className="text-[10px] font-mono text-slate-400">ms</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Loaded: <strong className="text-slate-300">+{result.bufferbloat.downloadDelta}ms</strong>
            </div>
          </div>

          {/* Jitter */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-mono text-slate-400">
              {lang === 'vi' ? 'Biến Thiên (Jitter)' : 'Jitter'}
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                {result.jitter}
              </span>
              <span className="text-[10px] font-mono text-slate-400">ms</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {result.jitter <= 3 ? 'Rất ổn định' : 'Biến thiên nhẹ'}
            </div>
          </div>

          {/* Packet Loss */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-mono text-slate-400">
              {lang === 'vi' ? 'Mất Gói (Loss)' : 'Packet Loss'}
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${result.packetLoss === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.packetLoss}%
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {result.packetLoss === 0 ? '0 gói rớt' : 'Có suy hao'}
            </div>
          </div>

          {/* Bufferbloat Grade */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-mono text-slate-400">
              Bufferbloat
            </div>
            <div className="flex items-baseline gap-1.5 my-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-300">
                {result.bufferbloat.grade}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                (Δ +{Math.max(result.bufferbloat.downloadDelta, result.bufferbloat.uploadDelta)}ms)
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate" title={result.bufferbloat.verdictVi}>
              {result.bufferbloat.grade === 'A+' || result.bufferbloat.grade === 'A' ? 'Không nghẽn' : result.bufferbloat.grade === 'B' ? 'Trễ nhẹ' : 'Cần SQM'}
            </div>
          </div>
        </div>
      </div>

      {/* Automatic Network Diagnostics Strip */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'vi' ? 'Chẩn Đoán Trực Tiếp Theo Tác Vụ' : 'Activity Diagnostics'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Internet */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Internet</span>
              {getStatusBadge(diag.internet.status)}
            </div>
            <div className="text-xs font-bold text-slate-200 truncate">{diag.internet.rating}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{diag.internet.note}</div>
          </div>

          {/* Wi-Fi */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Wi-Fi / LAN</span>
              {getStatusBadge(diag.wifi.status)}
            </div>
            <div className="text-xs font-bold text-slate-200 truncate">{diag.wifi.rating}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{diag.wifi.note}</div>
          </div>

          {/* Gaming */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Gaming</span>
              {getStatusBadge(diag.gaming.status)}
            </div>
            <div className="text-xs font-bold text-slate-200 truncate">{diag.gaming.rating}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{diag.gaming.note}</div>
          </div>

          {/* Video Call */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Video Call</span>
              {getStatusBadge(diag.videoCall.status)}
            </div>
            <div className="text-xs font-bold text-slate-200 truncate">{diag.videoCall.rating}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{diag.videoCall.note}</div>
          </div>

          {/* Streaming */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Streaming</span>
              {getStatusBadge(diag.streaming.status)}
            </div>
            <div className="text-xs font-bold text-slate-200 truncate">{diag.streaming.rating}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{diag.streaming.note}</div>
          </div>
        </div>
      </div>

      {/* Probable Cause / Advice */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
        <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'vi' ? 'Nhận xét kỹ thuật & Nguyên nhân có khả năng cao:' : 'Probable Causes & Engineering Takeaway:'}</span>
        </div>
        <ul className="space-y-1 text-slate-400 list-disc list-inside mt-1 leading-relaxed">
          {diag.probableCauses.map((cause, idx) => (
            <li key={idx} className="text-[11px]">{cause}</li>
          ))}
        </ul>
      </div>

      {/* Technician Mode Section (Detailed Inspection) */}
      {mode === 'technician' && (
        <div className="space-y-3 pt-3 border-t border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 font-mono">
                {lang === 'vi' ? 'DỮ LIỆU ĐO SÂU CHO KỸ THUẬT VIÊN (FULL TELEMETRY)' : 'TECHNICIAN TELEMETRY DATA'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTechLogs(!showTechLogs)}
              className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showTechLogs ? (lang === 'vi' ? 'Thu gọn logs' : 'Hide logs') : (lang === 'vi' ? 'Xem telemetry logs' : 'View logs')}</span>
              {showTechLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-slate-500">Download Loaded RTT</div>
              <div className="text-slate-200 font-bold mt-0.5">{result.pingDownloadLoaded} ms (+{result.bufferbloat.downloadDelta}ms)</div>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-slate-500">Upload Loaded RTT</div>
              <div className="text-slate-200 font-bold mt-0.5">{result.pingUploadLoaded} ms (+{result.bufferbloat.uploadDelta}ms)</div>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-slate-500">Peak vs Avg (DL)</div>
              <div className="text-slate-200 font-bold mt-0.5">{result.download.peak} / {result.download.average} Mbps</div>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-slate-500">Protocol & Streams</div>
              <div className="text-slate-200 font-bold mt-0.5">{result.connectionType === 'multi' ? 'Multi-Stream (x3)' : 'Single-Stream (x1)'}</div>
            </div>
          </div>

          {showTechLogs && (
            <div className="p-3 bg-black/60 border border-slate-800 rounded-lg font-mono text-[10px] text-slate-400 max-h-48 overflow-y-auto space-y-1">
              <div className="text-cyan-400 font-bold pb-1 border-b border-slate-800/80">--- LOG THỰC THI PHIÊN ĐO LƯỜNG ---</div>
              {diag.technicianLogs.map((log, idx) => (
                <div key={idx} className="hover:text-slate-200">{log}</div>
              ))}
              <div className="text-slate-500 pt-1">Session ID: {result.id} · Node: {result.server.id}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
