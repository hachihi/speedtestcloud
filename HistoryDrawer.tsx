import React, { useState } from 'react';
import { SpeedTestResult } from '../types/speedtest';
import { X, Trash2, Download, History, Calendar, Server, GitCompare, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SpeedTestResult[];
  onClearHistory: () => void;
  onSelectResult: (res: SpeedTestResult) => void;
  lang: 'vi' | 'en';
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onSelectResult,
  lang,
}) => {
  const [showComparison, setShowComparison] = useState(false);

  if (!isOpen) return null;

  const exportCSV = () => {
    if (history.length === 0) return;
    const headers = [
      'ID',
      'Date',
      'Score',
      'ISP',
      'IP',
      'Server',
      'Download_Avg_Mbps',
      'Download_Peak_Mbps',
      'Upload_Avg_Mbps',
      'Upload_Peak_Mbps',
      'Ping_Idle_ms',
      'Ping_Download_Loaded_ms',
      'Ping_Upload_Loaded_ms',
      'Jitter_ms',
      'Loss_Pct',
      'Bufferbloat_Grade',
    ];

    const rows = history.map((h) => [
      h.id,
      new Date(h.timestamp).toISOString(),
      h.diagnostics?.score || 'N/A',
      `"${h.clientInfo.isp}"`,
      h.clientInfo.maskedIp || h.clientInfo.ip,
      `"${h.server.name}"`,
      h.download?.average ?? h.downloadSpeed,
      h.download?.peak ?? h.downloadSpeed,
      h.upload?.average ?? h.uploadSpeed,
      h.upload?.peak ?? h.uploadSpeed,
      h.ping,
      h.pingDownloadLoaded ?? h.ping,
      h.pingUploadLoaded ?? h.ping,
      h.jitter,
      h.packetLoss,
      h.bufferbloat.grade,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `speedtest-history-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compare 2 most recent tests
  const latest = history[0];
  const previous = history[1];

  const getDelta = (curr: number, prev: number, lowerIsBetter = false) => {
    const diff = curr - prev;
    if (Math.abs(diff) < 0.1) {
      return { text: '0', isBetter: null, icon: <Minus className="w-3 h-3 text-slate-400" /> };
    }
    const isPositive = diff > 0;
    const isBetter = lowerIsBetter ? !isPositive : isPositive;
    const pct = prev > 0 ? Math.round((Math.abs(diff) / prev) * 100) : 0;
    const sign = isPositive ? '+' : '-';
    const text = `${sign}${Math.abs(diff).toFixed(1)} (${sign}${pct}%)`;

    return {
      text,
      isBetter,
      icon: isPositive ? (
        <ArrowUp className={`w-3 h-3 ${isBetter ? 'text-emerald-400' : 'text-rose-400'}`} />
      ) : (
        <ArrowDown className={`w-3 h-3 ${isBetter ? 'text-emerald-400' : 'text-rose-400'}`} />
      ),
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {lang === 'vi' ? 'Lịch Sử Đo & So Sánh' : 'Speedtest History & Compare'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">
            {lang === 'vi' ? `${history.length} lần đo đã lưu` : `${history.length} records`}
          </span>

          <div className="flex items-center gap-2">
            {history.length >= 2 && (
              <button
                type="button"
                onClick={() => setShowComparison(!showComparison)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  showComparison
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>{showComparison ? 'Đóng so sánh' : 'So sánh 2 lần gần nhất'}</span>
              </button>
            )}

            {history.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={exportCSV}
                  title="Xuất file CSV"
                  className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={onClearHistory}
                  title="Xóa tất cả"
                  className="flex items-center gap-1 px-2.5 py-1 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Comparison Box */}
        {showComparison && latest && previous && (
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <GitCompare className="w-4 h-4" />
                <span>So sánh lần đo gần nhất vs trước đó</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Score: {latest.diagnostics?.score ?? '--'} vs {previous.diagnostics?.score ?? '--'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {/* Download Diff */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Download</div>
                <div className="text-sm font-bold text-cyan-400">
                  {(latest.download?.average ?? latest.downloadSpeed).toFixed(1)}
                </div>
                <div className="flex items-center gap-1 text-[10px] mt-0.5">
                  {(() => {
                    const d = getDelta(
                      latest.download?.average ?? latest.downloadSpeed,
                      previous.download?.average ?? previous.downloadSpeed
                    );
                    return (
                      <>
                        {d.icon}
                        <span className={d.isBetter ? 'text-emerald-400' : d.isBetter === false ? 'text-rose-400' : 'text-slate-400'}>
                          {d.text}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Upload Diff */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Upload</div>
                <div className="text-sm font-bold text-emerald-400">
                  {(latest.upload?.average ?? latest.uploadSpeed).toFixed(1)}
                </div>
                <div className="flex items-center gap-1 text-[10px] mt-0.5">
                  {(() => {
                    const d = getDelta(
                      latest.upload?.average ?? latest.uploadSpeed,
                      previous.upload?.average ?? previous.uploadSpeed
                    );
                    return (
                      <>
                        {d.icon}
                        <span className={d.isBetter ? 'text-emerald-400' : d.isBetter === false ? 'text-rose-400' : 'text-slate-400'}>
                          {d.text}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Ping Diff */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Ping Idle</div>
                <div className="text-sm font-bold text-amber-400">
                  {latest.ping}ms
                </div>
                <div className="flex items-center gap-1 text-[10px] mt-0.5">
                  {(() => {
                    const d = getDelta(latest.ping, previous.ping, true);
                    return (
                      <>
                        {d.icon}
                        <span className={d.isBetter ? 'text-emerald-400' : d.isBetter === false ? 'text-rose-400' : 'text-slate-400'}>
                          {d.text}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List of history items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectResult(item);
                onClose();
              }}
              className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-950 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {new Date(item.timestamp).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
                <div className="flex items-center gap-1.5">
                  {item.diagnostics?.score && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                      {item.diagnostics.score} pts
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                    Buffer: {item.bufferbloat.grade}
                  </span>
                </div>
              </div>

              {/* Speed readout */}
              <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-slate-800/60">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">
                    {lang === 'vi' ? 'Tải xuống (Avg / Peak)' : 'Download'}
                  </div>
                  <div className="font-mono text-xl font-bold text-cyan-300 tabular-nums">
                    {(item.download?.average ?? item.downloadSpeed).toFixed(1)}{' '}
                    <span className="text-xs text-slate-400">Mbps</span>
                  </div>
                  {item.download?.peak && (
                    <div className="text-[10px] font-mono text-slate-500">
                      Peak: {item.download.peak} Mbps
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">
                    {lang === 'vi' ? 'Tải lên (Avg / Peak)' : 'Upload'}
                  </div>
                  <div className="font-mono text-xl font-bold text-emerald-300 tabular-nums">
                    {(item.upload?.average ?? item.uploadSpeed).toFixed(1)}{' '}
                    <span className="text-xs text-slate-400">Mbps</span>
                  </div>
                  {item.upload?.peak && (
                    <div className="text-[10px] font-mono text-slate-500">
                      Peak: {item.upload.peak} Mbps
                    </div>
                  )}
                </div>
              </div>

              {/* Ping / Jitter / Server */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>Ping: <strong className="text-slate-200">{item.ping}ms</strong> (Jitter: {item.jitter}ms · Loss: {item.packetLoss}%)</span>
                <span className="flex items-center gap-1 truncate max-w-[130px]">
                  <Server className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{item.server.city}</span>
                </span>
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs font-mono">
              <History className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
              <span>{lang === 'vi' ? 'Chưa có lịch sử bài đo nào' : 'No speed test history yet'}</span>
              <span className="text-[11px] text-slate-600 mt-1">
                {lang === 'vi' ? 'Kết quả các lần đo sẽ tự động lưu trữ tại đây' : 'Your test records will appear here'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
