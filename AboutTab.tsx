import React, { useState } from 'react';
import {
  PhoneCall,
  Headphones,
  Globe,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  Zap,
  Gauge,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Server,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface AboutTabProps {
  lang: 'vi' | 'en';
  theme: 'dark' | 'light';
  onSwitchToTest: () => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({
  lang,
  theme,
  onSwitchToTest,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [copiedHotline, setCopiedHotline] = useState(false);
  const [copiedSupport, setCopiedSupport] = useState(false);

  const isDark = theme === 'dark';

  const copyToClipboard = (text: string, type: 'hotline' | 'support') => {
    try {
      navigator.clipboard.writeText(text);
      if (type === 'hotline') {
        setCopiedHotline(true);
        setTimeout(() => setCopiedHotline(false), 2000);
      } else {
        setCopiedSupport(true);
        setTimeout(() => setCopiedSupport(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const faqs = [
    {
      qVi: 'Chỉ số đo trên Speedtest của Hachihi có phải là số liệu thật 100% không?',
      qEn: 'Are the metrics on Hachihi Speedtest 100% genuine and real-time?',
      aVi: 'Hoàn toàn thật 100%! Khác với các công cụ chèn số liệu giả lập hoặc calibrate ảo, hệ thống Speedtest của Hachihi trực tiếp stream các byte dữ liệu nhị phân ngẫu nhiên qua giao thức HTTP/TCP, đo thời gian thực từng gói tin (RTT) và kiểm tra độ trễ Bufferbloat trong lúc ép tải đường truyền. Không có bất kỳ thuật toán giả lập hay số liệu khống nào.',
      aEn: '100% genuine! Unlike tools that use artificial calibration or simulated numbers, Hachihi Speedtest directly streams high-entropy binary chunks over HTTP/TCP, computes true round-trip ping, and benchmarks real Bufferbloat under saturation without synthetic inflation.'
    },
    {
      qVi: 'Bufferbloat là gì và tại sao đo Bufferbloat lại quan trọng?',
      qEn: 'What is Bufferbloat and why is it essential to measure?',
      aVi: 'Bufferbloat là hiện tượng router lưu trữ quá nhiều gói tin trong hàng đợi khi đường truyền bị chiếm dụng. Lúc bình thường ping có thể chỉ 6ms - 15ms, nhưng khi người khác trong nhà xem video 4K hay tải dữ liệu nặng, ping có thể tăng vọt lên 200ms - 800ms gây giật lag hoặc méo tiếng trong cuộc gọi. Hệ thống đo loaded latency này giúp bạn đánh giá router có cần cấu hình SQM (Smart Queue Management) hay không.',
      aEn: 'Bufferbloat happens when router packet buffers fill up during high bandwidth usage. Idle ping might be low, but active load pushes latency to hundreds of milliseconds. Measuring loaded ping reveals whether router SQM queue management is needed.'
    },
    {
      qVi: 'Khi nào nên dùng chế độ Đa Luồng (Multi) và Đơn Luồng (Single)?',
      qEn: 'When to choose Multi-Stream vs Single-Stream mode?',
      aVi: '• Đa luồng (Multi-stream): Mở nhiều kết nối song song để vắt kiệt băng thông vật lý của gói cước (giống IDM hoặc download đa kênh). Thích hợp kiểm tra nhà mạng có cấp đủ băng thông theo hợp đồng không.\n• Đơn luồng (Single-stream): Đo sức tải của một kết nối đơn lẻ, rất quan trọng với chơi game online, duyệt web nhanh và truyền tệp đơn.',
      aEn: '• Multi-stream saturates your entire subscribed pipe capacity via parallel TCP streams.\n• Single-stream benchmarks single-thread performance, critical for online gaming and interactive web tasks.'
    },
    {
      qVi: 'Làm thế nào để được Hachihi hỗ trợ kỹ thuật về hệ thống mạng?',
      qEn: 'How can I get technical support from Hachihi?',
      aVi: 'Bạn có thể truy cập website chính thức tại hachihi.vn, gọi trực tiếp hotline 0933842126 hoặc liên hệ tổng đài hỗ trợ kỹ thuật 24/7 theo số 09-1800-1944 để được đội ngũ kỹ sư giải đáp và tối ưu hóa hệ thống mạng.',
      aEn: 'Visit our official website at hachihi.vn, call hotline 0933842126 or contact 24/7 support at 09-1800-1944 for expert network consultation and optimization.'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero: Giới thiệu Hachihi & Speedtest */}
      <div
        className={`rounded-2xl p-6 md:p-8 border relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-800/40'
            : 'bg-gradient-to-br from-emerald-50 via-white to-slate-100 border-emerald-200 shadow-sm'
        }`}
      >
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'vi' ? 'Giới Thiệu Đơn Vị Phát Triển & Vận Hành' : 'About Hachihi & Speedtest'}</span>
          </div>

          <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {lang === 'vi'
              ? 'Hachihi Network Solutions & Speedtest'
              : 'Hachihi Network Solutions & Speedtest'}
          </h2>

          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {lang === 'vi'
              ? 'Hệ thống đo lường kiểm tra tốc độ mạng Speedtest được phát triển bởi Hachihi (hachihi.vn). Chúng tôi cam kết 100% dữ liệu đo đạc thực tế: kiểm tra chính xác Download, Upload, Ping, Jitter và độ nghẽn hàng đợi Bufferbloat, loại bỏ hoàn toàn các chỉ số ảo hay thuật toán giả lập để mang lại cái nhìn trung thực nhất về đường truyền Internet của bạn.'
              : 'Speedtest system developed by Hachihi (hachihi.vn). We are committed to 100% genuine network telemetry: accurately benchmarking Download, Upload, Ping, Jitter, and Bufferbloat without any synthetic manipulation or inflated stats.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onSwitchToTest}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
            >
              <span>{lang === 'vi' ? 'Đến Bàn Đo Tốc Độ Ngay' : 'Launch Speed Test'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://hachihi.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>hachihi.vn</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* 3 Prominent Contact & Info Cards: Website, Hotline, Support */}
      <div>
        <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'vi' ? 'Thông Tin Liên Hệ & Hỗ Trợ Kỹ Thuật' : 'Contact & Technical Support'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Website hachihi.vn */}
          <div
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'
                : 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/40'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-[11px] font-mono text-emerald-500 font-semibold uppercase">
                {lang === 'vi' ? 'Website Chính Thức' : 'Official Portal'}
              </div>
              <h4 className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                hachihi.vn
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lang === 'vi'
                  ? 'Cổng thông tin giải pháp công nghệ, viễn thông và thiết bị mạng hàng đầu.'
                  : 'Official portal for telecommunication, networking devices, and technical services.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <a
                href="https://hachihi.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 transition-colors"
              >
                <span>Truy cập hachihi.vn</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Hotline 0933842126 */}
          <div
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40'
                : 'bg-white border-slate-200 shadow-sm hover:border-cyan-500/40'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="text-[11px] font-mono text-cyan-500 font-semibold uppercase">
                {lang === 'vi' ? 'Hotline Tư Vấn' : 'Direct Hotline'}
              </div>
              <h4 className={`text-base font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                0933842126
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lang === 'vi'
                  ? 'Liên hệ trực tiếp để được tư vấn thiết bị, giải pháp mạng và kiểm định băng thông.'
                  : 'Direct line for business inquiries, enterprise connectivity, and technical advice.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
              <a
                href="tel:0933842126"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Gọi 0933842126</span>
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard('0933842126', 'hotline')}
                title="Sao chép số"
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                {copiedHotline ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Card 3: Support 09-1800-1944 */}
          <div
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40'
                : 'bg-white border-slate-200 shadow-sm hover:border-amber-500/40'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="text-[11px] font-mono text-amber-500 font-semibold uppercase">
                {lang === 'vi' ? 'Hỗ Trợ Kỹ Thuật (Support 24/7)' : 'Technical Support'}
              </div>
              <h4 className={`text-base font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                09-1800-1944
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lang === 'vi'
                  ? 'Tổng đài hỗ trợ kỹ thuật chuyên sâu về sự cố mạng, cấu hình thiết bị và độ trễ.'
                  : 'Dedicated support hotline for network troubleshooting, latency issues, and assistance.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
              <a
                href="tel:0918001944"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Gọi 09-1800-1944</span>
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard('09-1800-1944', 'support')}
                title="Sao chép số"
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                {copiedSupport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cam kết dữ liệu thật 100% */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            {lang === 'vi' ? 'Cam Kết Minh Bạch: 100% Chỉ Số Đo Đạc Thực Tế' : '100% Real-World Telemetry Guarantee'}
          </h3>
        </div>

        <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {lang === 'vi'
            ? 'Tại Speedtest của Hachihi, mọi chỉ số hiển thị đều được thu thập trực tiếp từ kết nối của thiết bị tới máy chủ kiểm tra mà không thông qua bất kỳ bộ lọc làm đẹp số liệu nào:'
            : 'At Hachihi Speedtest, all metrics displayed are measured directly from your connection without artificial smoothing or simulated metrics:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/50">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              {lang === 'vi' ? 'Download & Upload Thật' : 'Real Download & Upload'}
            </div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              {lang === 'vi'
                ? 'Đo đạc qua luồng truyền nhận byte nhị phân ngẫu nhiên (entropy cao), không bị nén ảo.'
                : 'Measured via true random binary streams preventing compression inflation.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/50">
            <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              {lang === 'vi' ? 'Ping & Jitter Chuẩn Xác' : 'True Ping & Jitter'}
            </div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              {lang === 'vi'
                ? 'Tính toán trực tiếp thời gian phản hồi vòng lặp (RTT) theo chuẩn RFC của từng gói tin.'
                : 'Calculated directly from round-trip time (RTT) without artificial simulation.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/50">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'vi' ? 'Bufferbloat Dưới Tải' : 'Real Bufferbloat'}
            </div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              {lang === 'vi'
                ? 'Đo độ trễ thực sự khi đường truyền đang tải nặng, giúp phát hiện router bị nghẽn.'
                : 'Measures active packet latency spikes under peak load to diagnose router queue delays.'}
            </p>
          </div>
        </div>
      </div>

      {/* Guide: How to read the metrics */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <h3 className={`text-base font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
          <Gauge className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'vi' ? 'Cách Đọc & Đánh Giá Các Chỉ Số' : 'Metric Interpretation Guide'}</span>
        </h3>

        <div className="space-y-3 text-xs leading-relaxed">
          <div className="p-3 rounded-lg border border-slate-700/40 bg-slate-950/40 dark:bg-slate-950/60">
            <span className="font-bold text-cyan-400">Download (Tải xuống): </span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              {lang === 'vi'
                ? 'Tốc độ kéo dữ liệu về máy. Xem phim 4K cần từ 25 - 50 Mbps, tải game 50GB cần từ 100 - 300 Mbps để nhanh chóng.'
                : 'Inbound speed (4K video requires 25-50 Mbps, large game downloads benefit from 100-300 Mbps).'}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-700/40 bg-slate-950/40 dark:bg-slate-950/60">
            <span className="font-bold text-emerald-400">Upload (Tải lên): </span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              {lang === 'vi'
                ? 'Tốc độ gửi dữ liệu đi (gọi Zoom, livestream TikTok/YouTube, gửi file Google Drive/OneDrive). Cần tối thiểu 15 - 30 Mbps ổn định.'
                : 'Outbound speed (Zoom, livestreaming, cloud sync). Needs at least 15-30 Mbps stable.'}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-700/40 bg-slate-950/40 dark:bg-slate-950/60">
            <span className="font-bold text-amber-400">Ping & Jitter (Độ trễ & Biến thiên): </span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              {lang === 'vi'
                ? 'Ping là thời gian phản hồi (càng thấp càng tốt, dưới 30ms là xuất sắc). Jitter là độ rung lắc giữa các gói (dưới 3ms là cực kỳ ổn định).'
                : 'Ping is round-trip delay (<30ms is optimal). Jitter measures consistency (<3ms is rock-solid).'}
            </span>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (Accordion) */}
      <div>
        <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'vi' ? 'Câu Hỏi Thường Gặp (FAQ)' : 'Frequently Asked Questions'}</span>
        </h3>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-colors overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {lang === 'vi' ? faq.qVi : faq.qEn}
                  </span>
                  <span className="text-emerald-400 font-mono text-sm">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div
                    className={`px-4 pb-4 pt-1 text-xs leading-relaxed border-t ${
                      isDark
                        ? 'text-slate-300 border-slate-800/80 bg-slate-950/30'
                        : 'text-slate-600 border-slate-100 bg-slate-50/50'
                    } whitespace-pre-line`}
                  >
                    {lang === 'vi' ? faq.aVi : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
