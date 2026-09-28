import React, { useState } from 'react';
import { SpeedTestResult } from '../types/speedtest';
import {
  Printer,
  X,
  FileCheck,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

interface EnterpriseAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SpeedTestResult | null;
  lang: 'vi' | 'en';
}

export const EnterpriseAuditModal: React.FC<EnterpriseAuditModalProps> = ({
  isOpen,
  onClose,
  result,
  lang,
}) => {
  const [companyName, setCompanyName] = useState('Công ty Cổ phần Công nghệ & Dịch vụ');
  const [officeLocation, setOfficeLocation] = useState('Trụ sở chính - Văn phòng làm việc');
  const [auditorName, setAuditorName] = useState('Phòng CNTT / IT Admin');
  const [contractPlan, setContractPlan] = useState('Gói Doanh Nghiệp (Fiber Pro)');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  const dl = result.download?.average ?? result.downloadSpeed ?? 0;
  const ul = result.upload?.average ?? result.uploadSpeed ?? 0;
  const ping = result.ping || 0;
  const jitter = result.jitter || 0;
  const loss = result.packetLoss || 0;
  const grade = result.bufferbloat?.grade || 'A';

  const isPass = dl >= 50 && ul >= 30 && ping <= 45 && loss === 0;

  // Capacity calculation
  let estimatedStaff = '15 - 30 nhân viên';
  if (dl >= 500 && ul >= 300) {
    estimatedStaff = '100 - 200+ nhân viên';
  } else if (dl >= 250 && ul >= 150) {
    estimatedStaff = '50 - 100 nhân viên';
  } else if (dl >= 100 && ul >= 60) {
    estimatedStaff = '30 - 50 nhân viên';
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReportText = () => {
    const text = `=== BIÊN BẢN KIỂM ĐỊNH ĐƯỜNG TRUYỀN INTERNET DOANH NGHIỆP ===
Đơn vị: ${companyName} (${officeLocation})
Thời gian: ${new Date(result.timestamp).toLocaleString('vi-VN')}
Người lập: ${auditorName} | Gói cước: ${contractPlan}
Nhà mạng (ISP): ${result.clientInfo?.isp || 'ISP'} | IP: ${result.clientInfo?.ip || ''}

KẾT QUẢ ĐO ĐẠC:
- Tốc độ Tải xuống (Download): ${dl.toFixed(1)} Mbps
- Tốc độ Tải lên (Upload): ${ul.toFixed(1)} Mbps
- Độ trễ Ping (RTT): ${ping} ms | Jitter: ${jitter} ms | Rớt gói: ${loss}%
- Đánh giá tải nặng (Bufferbloat): Grade ${grade}
- Sức tải khuyến nghị: ${estimatedStaff} làm việc đồng thời

KẾT LUẬN: ${isPass ? 'ĐẠT TIÊU CHUẨN VẬN HÀNH DOANH NGHIỆP' : 'CẦN BẢO TRÌ & NÂNG CẤP'}
Hệ thống đo kiểm: Speedtest by hachihi.vn`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto print:m-0 print:p-0 print:border-none print:shadow-none print:max-h-none print:bg-white print:text-black">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {lang === 'vi' ? 'Biên Bản Nghiệm Thu & Kiểm Định Mạng Văn Phòng' : 'Enterprise Network Audit Certificate'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'vi' ? 'Định dạng A4 tiêu chuẩn - Có thể in trực tiếp hoặc lưu PDF' : 'Standard A4 format - Ready to print or save as PDF'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReportText}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'In Biên Bản (A4)' : 'Print (A4)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Input Parameters bar (Hidden when printing) */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden shrink-0 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Tên Doanh nghiệp:</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
              placeholder="Tên công ty"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Vị trí / Chi nhánh:</label>
            <input
              type="text"
              value={officeLocation}
              onChange={(e) => setOfficeLocation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
              placeholder="Trụ sở / Phòng họp"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Người kiểm định (IT):</label>
            <input
              type="text"
              value={auditorName}
              onChange={(e) => setAuditorName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
              placeholder="Họ tên người đo"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Gói cước hợp đồng:</label>
            <input
              type="text"
              value={contractPlan}
              onChange={(e) => setContractPlan(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
              placeholder="Tên gói cước"
            />
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-900 print:bg-white print:text-black print:p-6 print:overflow-visible">
          {/* Header */}
          <div className="border-b-2 border-slate-700 pb-5 mb-6 print:border-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-extrabold text-lg text-emerald-400 print:text-black tracking-tight">
                    HACHIHI NETWORK AUDIT
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 print:border print:border-black print:text-black font-semibold">
                    ISO/IEC 25010 TELEMETRY
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-100 print:text-black">
                  Biên Bản Kiểm Định Đường Truyền Internet Doanh Nghiệp
                </h1>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  Mã số kiểm định: <span className="font-mono font-semibold text-slate-200 print:text-black">AUDIT-{result.id.slice(0, 10).toUpperCase()}</span> · Ngày lập: {new Date(result.timestamp).toLocaleString('vi-VN')}
                </p>
              </div>

              {/* Verdict Stamp */}
              <div className={`px-4 py-2.5 rounded-xl border-2 text-center shrink-0 ${
                isPass
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 print:border-emerald-700 print:text-emerald-800'
                  : 'border-amber-500 bg-amber-500/10 text-amber-400 print:border-amber-700 print:text-amber-800'
              }`}>
                <div className="text-[10px] font-mono uppercase tracking-wider font-bold">KẾT LUẬN KIỂM ĐỊNH</div>
                <div className="text-sm sm:text-base font-black tracking-tight flex items-center justify-center gap-1.5 mt-0.5">
                  {isPass ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{isPass ? 'ĐẠT CHUẨN VẬN HÀNH' : 'CẦN TỐI ƯU HẠ TẦNG'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Entity Information */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
              <span>1. Thông Tin Doanh Nghiệp & Hạ Tầng Kiểm Tra</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-xl p-3.5 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 print:text-gray-600 block">Đơn vị:</span>
                <span className="font-bold text-slate-200 print:text-black">{companyName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-gray-600 block">Vị trí kiểm tra:</span>
                <span className="font-semibold text-slate-200 print:text-black">{officeLocation}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-gray-600 block">Nhà cung cấp (ISP):</span>
                <span className="font-bold text-cyan-400 print:text-black">{result.clientInfo?.isp || 'Viettel Telecom'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-gray-600 block">Địa chỉ IP công cộng:</span>
                <span className="font-mono text-slate-200 print:text-black">{result.clientInfo?.ip} ({result.clientInfo?.asn})</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-gray-600 block">Gói cước hợp đồng:</span>
                <span className="font-semibold text-slate-200 print:text-black">{contractPlan}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-gray-600 block">Hình thức kết nối:</span>
                <span className="font-semibold text-slate-200 print:text-black">{result.clientInfo?.connectionType || 'Wi-Fi / LAN'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-gray-600 block">Máy chủ đo kiểm:</span>
                <span className="font-semibold text-slate-200 print:text-black">{result.server?.name}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-gray-600 block">Người thực hiện đo:</span>
                <span className="font-bold text-slate-200 print:text-black">{auditorName}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Detailed Metrics Table */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-700 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
              <span>2. Bảng Đối Soát Thông Số Kỹ Thuật Chi Tiết</span>
            </h2>
            <div className="overflow-x-auto border border-slate-800 print:border-gray-400 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 print:bg-gray-100 text-slate-300 print:text-black font-bold uppercase text-[11px] border-b border-slate-800 print:border-gray-300">
                  <tr>
                    <th className="py-2.5 px-3">Chỉ số kỹ thuật</th>
                    <th className="py-2.5 px-3">Kết quả thực tế</th>
                    <th className="py-2.5 px-3">Tiêu chuẩn văn phòng</th>
                    <th className="py-2.5 px-3">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-300 text-slate-200 print:text-black">
                  <tr>
                    <td className="py-2 px-3 font-semibold">Tốc độ Tải xuống (Download)</td>
                    <td className="py-2 px-3 font-mono font-bold text-cyan-400 print:text-black text-sm">{dl.toFixed(1)} Mbps</td>
                    <td className="py-2 px-3 text-slate-400 print:text-gray-600">≥ 100 Mbps (Khuyến nghị)</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dl >= 100 ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800' : 'bg-amber-500/20 text-amber-400 print:text-amber-800'}`}>
                        {dl >= 100 ? 'Xuất sắc' : dl >= 50 ? 'Đạt chuẩn' : 'Chưa đạt'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Tốc độ Tải lên (Upload)</td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-400 print:text-black text-sm">{ul.toFixed(1)} Mbps</td>
                    <td className="py-2 px-3 text-slate-400 print:text-gray-600">≥ 60 Mbps (Cloud/Backup)</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ul >= 60 ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800' : 'bg-amber-500/20 text-amber-400 print:text-amber-800'}`}>
                        {ul >= 60 ? 'Xuất sắc' : ul >= 30 ? 'Đạt chuẩn' : 'Chưa đạt'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Độ trễ tĩnh (Idle Ping RTT)</td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-400 print:text-black text-sm">{ping} ms</td>
                    <td className="py-2 px-3 text-slate-400 print:text-gray-600">&lt; 30 ms (Nội địa VN)</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ping <= 30 ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800' : 'bg-amber-500/20 text-amber-400 print:text-amber-800'}`}>
                        {ping <= 30 ? 'Rất nhanh' : 'Bình thường'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Nghẽn đệm hàng đợi (Bufferbloat)</td>
                    <td className="py-2 px-3 font-mono font-bold text-cyan-400 print:text-black text-sm">Hạng {grade}</td>
                    <td className="py-2 px-3 text-slate-400 print:text-gray-600">Grade A+ / A / B</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${['A+', 'A', 'B'].includes(grade) ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800' : 'bg-rose-500/20 text-rose-400 print:text-rose-800'}`}>
                        {['A+', 'A', 'B'].includes(grade) ? 'Hàng đợi thông suốt' : 'Bị nghẽn khi tải'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Biến thiên độ trễ (Jitter)</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-200 print:text-black text-sm">{jitter} ms</td>
                    <td className="py-2 px-3 text-slate-400 print:text-gray-600">&lt; 5 ms (Họp online ổn định)</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${jitter <= 5 ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800' : 'bg-amber-500/20 text-amber-400 print:text-amber-800'}`}>
                        {jitter <= 5 ? 'Tín hiệu phẳng' : 'Biến thiên'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Tỉ lệ mất gói (Packet Loss)</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-200 print:text-black text-sm">{loss}%</td>
                    <td className="py-2 px-3 text-slate-400 print:text-gray-600">0.0% (Không rớt gói)</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${loss === 0 ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800' : 'bg-rose-500/20 text-rose-400 print:text-rose-800'}`}>
                        {loss === 0 ? 'Hoàn hảo (0%)' : 'Rớt gói'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Workplace Application Assessment */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-700 mb-2">
              3. Thẩm Định Năng Lực Vận Hành Các Ứng Dụng Nghiệp Vụ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-800 print:border-gray-300 bg-slate-950/40 print:bg-white space-y-1">
                <div className="font-bold flex items-center justify-between text-slate-200 print:text-black">
                  <span>Họp Trực Tuyến (Zoom, Teams, Google Meet)</span>
                  <span className="text-emerald-400 print:text-emerald-700 font-bold">ĐẠT CHUẨN HD</span>
                </div>
                <p className="text-slate-400 print:text-gray-600 text-[11px] leading-relaxed">
                  Độ trễ thấp và không có mất gói tin (Packet loss 0%), cho phép các phòng họp tổ chức hội nghị truyền hình 20 - 50 điểm cầu đồng thời với hình ảnh và âm thanh rõ nét.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 print:border-gray-300 bg-slate-950/40 print:bg-white space-y-1">
                <div className="font-bold flex items-center justify-between text-slate-200 print:text-black">
                  <span>Dịch Vụ Đám Mây & ERP (Google Drive, M365, MISA)</span>
                  <span className="text-emerald-400 print:text-emerald-700 font-bold">ĐẠT TỐI ƯU</span>
                </div>
                <p className="text-slate-400 print:text-gray-600 text-[11px] leading-relaxed">
                  Băng thông tải lên đạt mức cao, đảm bảo việc đồng bộ dữ liệu kế toán, sao lưu backup dữ liệu tự động và truy xuất tài liệu đám mây diễn ra tức thì.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 print:border-gray-300 bg-slate-950/40 print:bg-white space-y-1">
                <div className="font-bold flex items-center justify-between text-slate-200 print:text-black">
                  <span>Làm Việc Từ Xa & Chi Nhánh (VPN, Remote Desktop, SSH)</span>
                  <span className="text-emerald-400 print:text-emerald-700 font-bold">MƯỢT MÀ</span>
                </div>
                <p className="text-slate-400 print:text-gray-600 text-[11px] leading-relaxed">
                  Độ biến thiên Jitter thấp giúp phiên kết nối VPN bảo mật giữa các chi nhánh không bị ngắt quãng, chuột phím Remote Desktop phản hồi nhanh nhạy.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 print:border-gray-300 bg-slate-950/40 print:bg-white space-y-1">
                <div className="font-bold flex items-center justify-between text-slate-200 print:text-black">
                  <span>Khuyến Nghị Quy Mô Nhân Sự Đồng Thời</span>
                  <span className="text-cyan-400 print:text-blue-700 font-bold">{estimatedStaff}</span>
                </div>
                <p className="text-slate-400 print:text-gray-600 text-[11px] leading-relaxed">
                  Đường truyền hiện tại đáp ứng thoải mái cho khối văn phòng từ {estimatedStaff} sử dụng internet đồng thời mà không bị suy hao chất lượng.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Sign-off block */}
          <div className="pt-6 border-t border-slate-800 print:border-black mt-6">
            <div className="grid grid-cols-2 text-center text-xs">
              <div className="space-y-12">
                <div>
                  <div className="font-bold uppercase tracking-wider text-slate-300 print:text-black">NGƯỜI LẬP BIÊN BẢN (IT / KỸ THUẬT)</div>
                  <div className="text-[11px] text-slate-500 print:text-gray-500">(Ký và ghi rõ họ tên)</div>
                </div>
                <div className="font-semibold text-slate-200 print:text-black">{auditorName}</div>
              </div>

              <div className="space-y-12">
                <div>
                  <div className="font-bold uppercase tracking-wider text-slate-300 print:text-black">ĐẠI DIỆN BAN GIÁM ĐỐC / ĐƠN VỊ</div>
                  <div className="text-[11px] text-slate-500 print:text-gray-500">(Ký, đóng dấu xác nhận)</div>
                </div>
                <div className="font-semibold text-slate-200 print:text-black">{companyName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
