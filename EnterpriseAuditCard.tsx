import React, { useState, useEffect } from 'react';
import { SpeedTestResult } from '../types/speedtest';
import {
  Building2,
  Video,
  Cloud,
  MonitorDot,
  Users,
  Printer,
  Copy,
  Check,
  Sparkles,
  Send,
  Globe2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface EnterpriseAuditCardProps {
  result: SpeedTestResult;
  lang: 'vi' | 'en';
  theme: 'dark' | 'light';
  onOpenAuditModal: () => void;
}

interface AiReportState {
  loading: boolean;
  executiveSummary: string;
  capacityVerdict: string;
  ispTicket: string;
  itAdvice: string[];
  workplacePillars: {
    videoConference: string;
    cloudErp: string;
    remoteVpn: string;
  };
  source: 'ai' | 'deterministic';
}

export const EnterpriseAuditCard: React.FC<EnterpriseAuditCardProps> = ({
  result,
  lang,
  theme,
  onOpenAuditModal,
}) => {
  const isDark = theme === 'dark';
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const dl = result.download?.average ?? result.downloadSpeed ?? 0;
  const ul = result.upload?.average ?? result.uploadSpeed ?? 0;
  const ping = result.ping || 0;
  const jitter = result.jitter || 0;
  const loss = result.packetLoss || 0;
  const grade = result.bufferbloat?.grade || 'A';

  // Capacity estimate
  let staffRange = '15 - 30 nhân sự';
  let officeTier = 'Văn phòng quy mô Vừa & Nhỏ (SME)';
  if (dl >= 500 && ul >= 300) {
    staffRange = '100 - 200+ nhân sự';
    officeTier = 'Trụ sở Doanh nghiệp lớn / Tòa nhà';
  } else if (dl >= 250 && ul >= 150) {
    staffRange = '50 - 100 nhân sự';
    officeTier = 'Văn phòng Tiêu chuẩn Doanh nghiệp';
  } else if (dl >= 100 && ul >= 60) {
    staffRange = '30 - 50 nhân sự';
    officeTier = 'Văn phòng Làm việc Đa chức năng';
  }

  // Pass / Fair / Poor check
  const isOptimal = dl >= 80 && ul >= 50 && ping <= 35 && loss === 0;
  const isFair = dl >= 30 && ul >= 20 && ping <= 60 && loss <= 1;

  const [aiReport, setAiReport] = useState<AiReportState>({
    loading: true,
    executiveSummary: isOptimal
      ? `Đường truyền ${result.clientInfo?.isp || 'mạng'} tại văn phòng hoạt động xuất sắc (${dl.toFixed(0)} Mbps Download / ${ul.toFixed(0)} Mbps Upload, Ping ${ping}ms), đảm bảo toàn bộ hệ thống vận hành trơn tru.`
      : isFair
      ? `Đường truyền ${result.clientInfo?.isp || 'mạng'} đáp ứng mức cơ bản, khuyến nghị IT theo dõi các khung giờ họp cao điểm.`
      : `Cảnh báo: Đường truyền ${result.clientInfo?.isp || 'mạng'} có suy hao, cần báo kỹ thuật nhà mạng rà soát.`,
    capacityVerdict: `Băng thông hiện tại đáp ứng tối ưu cho quy mô ${staffRange} làm việc đồng thời.`,
    ispTicket: `Kính gửi Nhà mạng ${result.clientInfo?.isp || 'ISP'},\nĐơn vị chúng tôi ghi nhận thông số đường truyền: Download ${dl.toFixed(1)} Mbps, Upload ${ul.toFixed(1)} Mbps, Ping ${ping}ms, Loss ${loss}%. Đề nghị rà soát chất lượng dịch vụ theo hợp đồng.`,
    itAdvice: [
      'Kích hoạt Smart Queue Management (SQM) để phòng ngừa nghẽn hàng đợi lúc họp trực tuyến đông người.',
      'Ưu tiên kết nối mạng dây LAN Cat6 cho các máy chủ kế toán và thiết bị phòng họp chính.'
    ],
    workplacePillars: {
      videoConference: isOptimal ? 'Rất tốt: 15-30 cuộc họp trực tuyến HD đồng thời không delay' : 'Khá: Họp trực tuyến mượt, hạn chế bật camera 4K',
      cloudErp: isOptimal ? 'Tối ưu: Đồng bộ file Google Drive, M365 và ERP tức thì' : 'Bình thường: Thao tác file lớn có thể mất vài phút',
      remoteVpn: isOptimal ? 'Mượt mà: Phiên VPN bảo mật và Remote Desktop không có độ trễ phím' : 'Đạt chuẩn: Phiên kết nối chi nhánh ổn định'
    },
    source: 'deterministic'
  });

  // Fetch AI Report from backend
  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      try {
        const res = await fetch('/api/speedtest/ai-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            downloadSpeed: dl,
            uploadSpeed: ul,
            ping,
            jitter,
            packetLoss: loss,
            loadedDownloadPing: result.pingDownloadLoaded || ping,
            loadedUploadPing: result.pingUploadLoaded || ping,
            bufferbloatGrade: grade,
            isp: result.clientInfo?.isp || 'Nhà mạng nội địa',
            city: result.clientInfo?.city || 'Việt Nam',
            companyName: 'Văn phòng Doanh nghiệp',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setAiReport({
              loading: false,
              executiveSummary: data.executiveSummary || '',
              capacityVerdict: data.capacityVerdict || '',
              ispTicket: data.ispTicket || '',
              itAdvice: data.itAdvice || [],
              workplacePillars: data.workplacePillars || {
                videoConference: 'Họp trực tuyến sắc nét không trễ tiếng',
                cloudErp: 'Đồng bộ đám mây và phần mềm mượt mà',
                remoteVpn: 'Kết nối làm việc từ xa phản hồi nhanh'
              },
              source: data.source || 'ai'
            });
          }
        }
      } catch {
        if (isMounted) {
          setAiReport((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [result]);

  const handleCopyZaloMessage = () => {
    const text = `📊 [BÁO CÁO NHANH MẠNG VĂN PHÒNG]
🏢 Đơn vị: Văn phòng Công ty
🕒 Thời điểm: ${new Date(result.timestamp).toLocaleTimeString('vi-VN')} ngày ${new Date(result.timestamp).toLocaleDateString('vi-VN')}
🌐 Nhà mạng (ISP): ${result.clientInfo?.isp || 'ISP'} (${result.clientInfo?.ip || ''})

⚡ THÔNG SỐ VẬN HÀNH:
- Tốc độ Tải xuống: ${dl.toFixed(1)} Mbps
- Tốc độ Tải lên: ${ul.toFixed(1)} Mbps
- Độ trễ Ping: ${ping} ms (Jitter: ${jitter} ms, Loss: ${loss}%)
- Sức tải tối ưu: ${staffRange} làm việc đồng thời

🎯 KẾT LUẬN LÃNH ĐẠO:
${aiReport.executiveSummary}

(Được kiểm định bởi hệ thống Speedtest Doanh Nghiệp - hachihi.vn)`;

    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2000);
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(aiReport.ispTicket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  return (
    <div
      className={`border rounded-2xl p-5 md:p-6 space-y-6 transition-colors shadow-sm ${
        isDark
          ? 'bg-slate-900/60 border-slate-800'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Top Banner: Corporate Status & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {lang === 'vi' ? 'Đánh Giá Năng Lực Vận Hành Doanh Nghiệp' : 'Enterprise Operational Assessment'}
              </h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isOptimal
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isFair
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {isOptimal ? 'Đạt Chuẩn Vận Hành' : isFair ? 'Đạt Mức Cơ Bản' : 'Cần Nâng Cấp Tuyến'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {officeTier} · {result.clientInfo?.isp} ({result.clientInfo?.city})
            </p>
          </div>
        </div>

        {/* Action Buttons: Print Report & Copy Zalo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyZaloMessage}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              copiedZalo
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            {copiedZalo ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copiedZalo ? 'Đã Chép Gửi Sếp' : 'Chép Tin Nhắn Zalo/Teams'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAuditModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'vi' ? 'In Biên Bản Nghiệm Thu (A4)' : 'Print Audit Protocol (A4)'}</span>
          </button>
        </div>
      </div>

      {/* Executive Brief Box (Dành cho Lãnh Đạo & Trưởng Phòng) */}
      <div className={`p-4 rounded-xl border relative overflow-hidden ${
        isDark
          ? 'bg-slate-950/70 border-emerald-500/20'
          : 'bg-emerald-50/50 border-emerald-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                {lang === 'vi' ? 'Tóm Tắt Nhanh Cho Ban Giám Đốc (Executive Summary)' : 'Executive Brief for Management'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {aiReport.source === 'ai' ? 'Powered by Gemini AI' : 'Hachihi Telemetry Engine'}
              </span>
            </div>
            <p className={`text-xs md:text-sm leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {aiReport.executiveSummary}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Core Workplace Application Pillars */}
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {lang === 'vi' ? 'Đánh Giá 4 Trụ Cột Ứng Dụng Nghiệp Vụ' : 'Workplace Application Assessment'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pillar 1: Video Meetings */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold flex items-center gap-1.5 text-cyan-400">
                  <Video className="w-4 h-4" />
                  <span>Họp Trực Tuyến</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Zoom / Teams
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mb-1">
                {ping <= 30 && loss === 0 ? 'Chuẩn HD Mượt Mà' : 'Chất lượng Cơ bản'}
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {aiReport.workplacePillars.videoConference}
              </p>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Không trễ tiếng, không giật hình</span>
            </div>
          </div>

          {/* Pillar 2: Cloud Storage & ERP */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <Cloud className="w-4 h-4" />
                  <span>Đám Mây & ERP</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  M365 / Drive
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mb-1">
                {ul >= 60 ? 'Tốc Độ Đồng Bộ Cao' : 'Đồng Bộ Bình Thường'}
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {aiReport.workplacePillars.cloudErp}
              </p>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Tải file hợp đồng, hóa đơn tức thì</span>
            </div>
          </div>

          {/* Pillar 3: Remote Desktop & VPN */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold flex items-center gap-1.5 text-amber-400">
                  <MonitorDot className="w-4 h-4" />
                  <span>VPN & Remote</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  UltraViewer / VPN
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mb-1">
                {jitter <= 4 ? 'Phản Hồi Chuột Phím 1:1' : 'Độ Trễ Chấp Nhận Được'}
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {aiReport.workplacePillars.remoteVpn}
              </p>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Phiên kết nối chi nhánh thông suốt</span>
            </div>
          </div>

          {/* Pillar 4: Capacity Recommendation */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold flex items-center gap-1.5 text-teal-400">
                  <Users className="w-4 h-4" />
                  <span>Sức Tải Văn Phòng</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Quy mô
                </span>
              </div>
              <div className="text-sm font-extrabold text-teal-400 mb-1">
                {staffRange}
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {aiReport.capacityVerdict}
              </p>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] font-mono text-teal-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Chống nghẽn giờ hành chính</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section: ISP Complaint Ticket Generator & IT Advice */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
        isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2 text-slate-200">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Mẫu Khiếu Nại Kỹ Thuật Nhà Mạng (ISP Support Ticket)</span>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Đầy đủ số liệu đo kiểm chuẩn kỹ thuật giúp tổng đài và kỹ thuật viên tuyến quang giải quyết sự cố ngay.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyTicket}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-colors cursor-pointer ${
              copiedTicket
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedTicket ? 'Đã Chép Mẫu Khiếu Nại' : 'Sao Chép Mẫu Ticket'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
