import React, { useRef, useState, useEffect } from 'react';
import { SpeedTestResult } from '../types/speedtest';
import { X, Download, Copy, Check, Share2, FileText, Printer, Eye, EyeOff, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface ShareCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SpeedTestResult | null;
  lang: 'vi' | 'en';
}

export const ShareCertificateModal: React.FC<ShareCertificateModalProps> = ({
  isOpen,
  onClose,
  result,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [maskIp, setMaskIp] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate QR code data URL
  useEffect(() => {
    if (!result) return;
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}?testId=${result.id}&dl=${result.downloadSpeed}&ul=${result.uploadSpeed}&p=${result.ping}`
      : 'https://hachihi.vn';

    QRCode.toDataURL(shareUrl, {
      width: 130,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [result]);

  // Render High-Resolution Certificate Canvas
  useEffect(() => {
    if (!isOpen || !result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions: 1200 x 630 (Standard Social Share / OpenGraph & Print Card)
    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGradient.addColorStop(0, '#090d16');
    bgGradient.addColorStop(0.5, '#0c1529');
    bgGradient.addColorStop(1, '#080d1a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle grid texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 630);
      ctx.stroke();
    }
    for (let y = 0; y < 630; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    // Border Frame
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(30, 30, 1140, 570);

    // Header: Brand & Title
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SPEEDTEST', 60, 85);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(lang === 'vi' ? 'HỆ THỐNG ĐO LƯỜNG CHUẨN XÁC BỞI HACHIHI.VN' : 'OFFICIAL TELEMETRY CERTIFICATE · HACHIHI.VN', 60, 115);

    // Date & Time
    const dateStr = new Date(result.timestamp).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
    ctx.fillStyle = '#64748b';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(`MÃ ĐO: ${result.id}  ·  ${dateStr}`, 60, 145);

    // Score Badge in Header Right
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.roundRect(960, 50, 180, 85, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 32px "JetBrains Mono", monospace';
    ctx.fillText(`${result.diagnostics.score}/100`, 985, 95);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('SPEEDTEST SCORE', 985, 118);

    // Primary Metrics: Download Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.roundRect(60, 170, 520, 185, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(lang === 'vi' ? 'TỐC ĐỘ TẢI XUỐNG (DOWNLOAD)' : 'DOWNLOAD SPEED', 85, 205);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px "JetBrains Mono", monospace';
    ctx.fillText(result.download.average.toFixed(1), 85, 280);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('Mbps', 85 + ctx.measureText(result.download.average.toFixed(1)).width + 12, 272);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillText(
      `Peak: ${result.download.peak} Mbps · Ping tải: ${result.pingDownloadLoaded}ms (+${result.bufferbloat.downloadDelta}ms)`,
      85,
      325
    );

    // Upload Box
    ctx.roundRect(620, 170, 520, 185, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(lang === 'vi' ? 'TỐC ĐỘ TẢI LÊN (UPLOAD)' : 'UPLOAD SPEED', 645, 205);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px "JetBrains Mono", monospace';
    ctx.fillText(result.upload.average.toFixed(1), 645, 280);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('Mbps', 645 + ctx.measureText(result.upload.average.toFixed(1)).width + 12, 272);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillText(
      `Peak: ${result.upload.peak} Mbps · Ping tải: ${result.pingUploadLoaded}ms (+${result.bufferbloat.uploadDelta}ms)`,
      645,
      325
    );

    // Secondary Telemetry Row: Ping, Jitter, Packet Loss, Bufferbloat
    const metricsY = 375;
    const colWidth = 250;
    const cols = [
      { label: lang === 'vi' ? 'ĐỘ TRỄ PING (IDLE)' : 'IDLE PING', val: `${result.ping} ms`, sub: 'Round-Trip' },
      { label: lang === 'vi' ? 'BIẾN THIÊN (JITTER)' : 'JITTER', val: `${result.jitter} ms`, sub: 'Consistency' },
      { label: lang === 'vi' ? 'MẤT GÓI (LOSS)' : 'PACKET LOSS', val: `${result.packetLoss}%`, sub: 'Dropped' },
      { label: lang === 'vi' ? 'BUFFERBLOAT' : 'BUFFERBLOAT', val: `Hạng ${result.bufferbloat.grade}`, sub: `Δ +${Math.max(result.bufferbloat.downloadDelta, result.bufferbloat.uploadDelta)}ms` },
    ];

    cols.forEach((col, idx) => {
      const x = 60 + idx * (colWidth + 20);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.roundRect(x, metricsY, colWidth, 85, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(col.label, x + 16, metricsY + 26);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(col.val, x + 16, metricsY + 56);

      ctx.fillStyle = '#06b6d4';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(col.sub, x + 16, metricsY + 74);
    });

    // Network & ISP Footer Details
    const displayedIp = maskIp ? result.clientInfo.maskedIp : result.clientInfo.ip;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Nhà mạng (ISP): ${result.clientInfo.isp}  ·  IP: ${displayedIp}`, 60, 505);
    ctx.fillText(`Máy chủ kiểm tra: ${result.server.name} (${result.server.city})`, 60, 532);
    ctx.fillText(`Hỗ trợ Hachihi: Hotline 0933842126  ·  Support 09-1800-1944  ·  hachihi.vn`, 60, 558);

    // Draw QR Code Image on Canvas if available
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.roundRect(1030, 480, 110, 110, 8);
        ctx.fill();
        ctx.drawImage(qrImg, 1035, 485, 100, 100);
      };
      qrImg.src = qrDataUrl;
    }
  }, [isOpen, result, lang, maskIp, qrDataUrl]);

  if (!isOpen || !result) return null;

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `speedtest-certificate-${result.id}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const getReportMarkdown = () => {
    const dateStr = new Date(result.timestamp).toLocaleString('vi-VN');
    const dispIp = maskIp ? result.clientInfo.maskedIp : result.clientInfo.ip;
    return `### ⚡ BÁO CÁO TỐC ĐỘ INTERNET (SPEEDTEST · HACHIHI.VN)
- **Mã kết quả**: \`${result.id}\`
- **Thời gian đo**: ${dateStr}
- **Điểm Speedtest**: **${result.diagnostics.score}/100** (Hạng ${result.diagnostics.grade})
- **Nhà mạng (ISP)**: ${result.clientInfo.isp} (IP: ${dispIp})
- **Máy chủ đo**: ${result.server.name} (${result.server.city})
- **Tải xuống (Download)**: **${result.download.average} Mbps** (Peak: ${result.download.peak} Mbps)
- **Tải lên (Upload)**: **${result.upload.average} Mbps** (Peak: ${result.upload.peak} Mbps)
- **Ping chuẩn (Idle)**: **${result.ping} ms**
- **Độ biến thiên (Jitter)**: **${result.jitter} ms**
- **Mất gói (Packet Loss)**: **${result.packetLoss}%**
- **Độ trễ Bufferbloat**: Hạng **${result.bufferbloat.grade}**
  - Download Loaded: ${result.pingDownloadLoaded}ms (+${result.bufferbloat.downloadDelta}ms)
  - Upload Loaded: ${result.pingUploadLoaded}ms (+${result.bufferbloat.uploadDelta}ms)
- **Chẩn đoán mạng**:
  - Internet: ${result.diagnostics.internet.rating}
  - Wi-Fi / LAN: ${result.diagnostics.wifi.rating}
  - Gaming eSports: ${result.diagnostics.gaming.rating}
  - Video Call / Họp: ${result.diagnostics.videoCall.rating}
  - Xem phim Streaming: ${result.diagnostics.streaming.rating}
- **Đơn vị vận hành**: Hachihi Network Solutions (hachihi.vn)
- **Hotline**: 0933842126 | **Support 24/7**: 09-1800-1944`;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getReportMarkdown());
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {lang === 'vi' ? 'Chứng Nhận & Xuất Báo Cáo Đo Tốc Độ' : 'Speed Certificate & Export'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* IP Masking Toggle */}
            <button
              type="button"
              onClick={() => setMaskIp(!maskIp)}
              title={maskIp ? 'Hiển thị IP đầy đủ' : 'Che bớt IP khi chia sẻ'}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {maskIp ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{maskIp ? 'IP Đã Che' : 'IP Hiện Rõ'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="w-full rounded-xl overflow-hidden border border-slate-700/60 shadow-lg bg-slate-950">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:hidden">
            <button
              type="button"
              onClick={handleDownloadPNG}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{lang === 'vi' ? 'Tải Ảnh PNG' : 'Download PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'vi' ? 'In / Xuất PDF' : 'Print / PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedText ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <FileText className="w-4 h-4 text-cyan-400" />
              )}
              <span>{copiedText ? (lang === 'vi' ? 'Đã Sao Chép!' : 'Copied!') : (lang === 'vi' ? 'Chép Báo Cáo' : 'Copy Ticket')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
              <span>{copiedLink ? (lang === 'vi' ? 'Đã Chép Link!' : 'Copied!') : (lang === 'vi' ? 'Sao Chép Link' : 'Copy Link')}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>
              {lang === 'vi'
                ? 'Đã nhúng mã QR và mã kiểm tra kỹ thuật trực tiếp trên ảnh chứng nhận để dễ dàng đối soát.'
                : 'QR code & verification ID embedded for official ISP tickets.'}
            </span>
            <span className="text-emerald-400 font-bold shrink-0">Hachihi Speedtest</span>
          </div>
        </div>
      </div>
    </div>
  );
};
