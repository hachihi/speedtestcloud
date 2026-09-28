import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClientConnectionInfo,
  MetricSample,
  ServerNode,
  SpeedMetricData,
  SpeedTestResult,
  TestPhase,
} from './types/speedtest';
import { SERVER_NODES } from './data/servers';
import { speedEngine } from './services/speedEngine';
import { soundEffects } from './services/soundEffects';
import { Navbar } from './components/Navbar';
import { GaugeMeter } from './components/GaugeMeter';
import { LiveTelemetryChart } from './components/LiveTelemetryChart';
import { BufferbloatAnalysis } from './components/BufferbloatAnalysis';
import { NetworkDiagnosticsCard } from './components/NetworkDiagnosticsCard';
import { TestProgressBar } from './components/TestProgressBar';
import { ServerSelectorModal } from './components/ServerSelectorModal';
import { ShareCertificateModal } from './components/ShareCertificateModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AboutTab } from './components/AboutTab';
import { EnterpriseAuditCard } from './components/EnterpriseAuditCard';
import { EnterpriseAuditModal } from './components/EnterpriseAuditModal';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  Zap,
  Globe,
  Server,
  Share2,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  Wifi,
  Building2,
  Cpu,
  Printer,
  FileCheck,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Localization, Theme & Audio
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'test' | 'guide'>('test');
  const [unit, setUnit] = useState<'Mbps' | 'MB/s'>('Mbps');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [multiStream, setMultiStream] = useState<boolean>(true);
  const [userMode, setUserMode] = useState<'enterprise' | 'technical'>('enterprise');
  const [maskIp, setMaskIp] = useState<boolean>(true);

  // Network & Server
  const [clientInfo, setClientInfo] = useState<ClientConnectionInfo>({
    ip: 'Đang kiểm tra...',
    maskedIp: '***.***.***.***',
    city: 'Hồ Chí Minh',
    region: 'Hồ Chí Minh',
    country: 'Việt Nam',
    countryCode: 'VN',
    isp: 'Đang phát hiện ISP...',
    org: 'Hachihi Network Gateway',
    asn: 'AS-Default',
    connectionType: 'Wi-Fi',
    ipVersion: 'IPv4',
  });
  const [selectedServer, setSelectedServer] = useState<ServerNode>(SERVER_NODES[0]);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  // Engine & Test state
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Sẵn sàng kiểm tra');
  const [isRunning, setIsRunning] = useState(false);

  // Speeds (Current / Average / Peak)
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [downloadStats, setDownloadStats] = useState<SpeedMetricData>({
    current: 0,
    average: 0,
    peak: 0,
    isMeasuring: false,
    isDone: false,
  });
  const [uploadStats, setUploadStats] = useState<SpeedMetricData>({
    current: 0,
    average: 0,
    peak: 0,
    isMeasuring: false,
    isDone: false,
  });

  // Latency & Loss
  const [pingIdle, setPingIdle] = useState<number>(0);
  const [pingDownloadLoaded, setPingDownloadLoaded] = useState<number>(0);
  const [pingUploadLoaded, setPingUploadLoaded] = useState<number>(0);
  const [jitter, setJitter] = useState<number>(0);
  const [packetLoss, setPacketLoss] = useState<number>(0);

  const [samples, setSamples] = useState<MetricSample[]>([]);
  const [latestResult, setLatestResult] = useState<SpeedTestResult | null>(null);

  // Modals & Drawers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<SpeedTestResult[]>([]);

  const speedtestRef = useRef<HTMLDivElement>(null);
  const bufferbloatRef = useRef<HTMLDivElement>(null);
  const diagnosticsRef = useRef<HTMLDivElement>(null);

  // Initial load: Fetch IP & Auto-select closest server node
  useEffect(() => {
    speedEngine.fetchClientInfo().then((info) => {
      setClientInfo(info);
      // Auto-select lowest latency node by probing
      SERVER_NODES.forEach((srv) => {
        const start = performance.now();
        const sources = speedEngine.getPingSources(srv.id, 'probe');
        fetch(sources[0] || `/api/speedtest/ping?node=${encodeURIComponent(srv.id)}&probe=1`, { cache: 'no-store' })
          .then((res) => {
            if (res.ok) {
              const rtt = Math.max(Math.round(performance.now() - start), 1);
              srv.pingEstimate = rtt;
            }
          })
          .catch(() => {});
      });
    });

    try {
      const stored = localStorage.getItem('speedtest_history') || localStorage.getItem('netpulse_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
      const storedTheme = (localStorage.getItem('speedtest_theme') || localStorage.getItem('netpulse_theme')) as 'dark' | 'light';
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTheme(storedTheme);
      }
      const storedMode = localStorage.getItem('speedtest_mode');
      if (storedMode === 'enterprise' || storedMode === 'technical') {
        setUserMode(storedMode);
      } else {
        setUserMode('enterprise');
      }
    } catch {
      // ignore localStorage parse error
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('speedtest_theme', nextTheme);
    } catch {
      // ignore
    }
  };

  const handleToggleMode = (newMode: 'enterprise' | 'technical' | 'basic' | 'technician') => {
    const normalized: 'enterprise' | 'technical' = (newMode === 'basic' || newMode === 'enterprise') ? 'enterprise' : 'technical';
    setUserMode(normalized);
    try {
      localStorage.setItem('speedtest_mode', normalized);
    } catch {
      // ignore
    }
  };

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    soundEffects.setEnabled(next);
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'vi' ? 'en' : 'vi'));
  };

  const handleToggleMultiStream = () => {
    if (isRunning) return;
    setMultiStream((prev) => !prev);
  };

  const startTest = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);
    setPhase('detecting');
    setProgressPercent(2);
    setStatusText(lang === 'vi' ? 'Đang chuẩn bị kết nối trạm đo...' : 'Connecting to server node...');
    setCurrentSpeed(0);

    setDownloadStats({ current: 0, average: 0, peak: 0, isMeasuring: false, isDone: false });
    setUploadStats({ current: 0, average: 0, peak: 0, isMeasuring: false, isDone: false });
    setPingIdle(0);
    setPingDownloadLoaded(0);
    setPingUploadLoaded(0);
    setJitter(0);
    setPacketLoss(0);
    setSamples([]);

    speedEngine.runTest(selectedServer, clientInfo, multiStream, {
      onPhaseChange: (newPhase) => {
        setPhase(newPhase);
      },
      onProgress: (percent, text) => {
        setProgressPercent(percent);
        setStatusText(text);
      },
      onPingUpdate: (p, j, loss) => {
        setPingIdle(p);
        setJitter(j);
        setPacketLoss(loss);
      },
      onDownloadUpdate: (stats, loadedPing) => {
        setCurrentSpeed(stats.current);
        setDownloadStats(stats);
        setPingDownloadLoaded(loadedPing);
      },
      onUploadUpdate: (stats, loadedPing) => {
        setCurrentSpeed(stats.current);
        setUploadStats(stats);
        setPingUploadLoaded(loadedPing);
      },
      onSample: (sample) => {
        setSamples((prev) => [...prev, sample]);
      },
      onComplete: (result) => {
        setIsRunning(false);
        setPhase('complete');
        setProgressPercent(100);
        setStatusText(lang === 'vi' ? 'Kiểm tra tốc độ hoàn tất 100%' : 'Speed test completed successfully');
        setCurrentSpeed(result.download.average);
        setPingIdle(result.ping);
        setPingDownloadLoaded(result.pingDownloadLoaded);
        setPingUploadLoaded(result.pingUploadLoaded);
        setJitter(result.jitter);
        setPacketLoss(result.packetLoss);
        setLatestResult(result);

        // Save to history
        setHistory((prev) => {
          const next = [result, ...prev.slice(0, 49)];
          try {
            localStorage.setItem('speedtest_history', JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });

        // Smooth scroll to diagnostics
        setTimeout(() => {
          diagnosticsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      },
      onError: (err) => {
        setIsRunning(false);
        setPhase('error');
        setStatusText(err);
        alert(err);
      },
    });
  }, [isRunning, selectedServer, clientInfo, multiStream, lang]);

  const stopTest = () => {
    speedEngine.abort();
    setIsRunning(false);
    setPhase('idle');
    setProgressPercent(0);
    setStatusText(lang === 'vi' ? 'Đã hủy bài đo' : 'Test cancelled');
  };

  const scrollTo = (target: string) => {
    if (activeTab !== 'test') {
      setActiveTab('test');
    }
    setTimeout(() => {
      if (target === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (target === 'speedtest-section') {
        speedtestRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else if (target === 'bufferbloat-section') {
        bufferbloatRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else if (target === 'diagnostics-section') {
        diagnosticsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  // Unit conversion helper
  const formatSpeed = (valMbps: number) => {
    if (unit === 'MB/s') {
      return (valMbps / 8).toFixed(1);
    }
    return valMbps.toFixed(1);
  };

  // Verdict generators matching screenshot
  const getDownloadVerdict = (speed: number) => {
    if (speed >= 120) return lang === 'vi' ? 'Xem 4K / Tải game cực mượt' : 'Ultra 4K & Gaming Ready';
    if (speed >= 60) return lang === 'vi' ? 'Họp video & xem phim mượt mà' : 'Smooth HD Calls & Streaming';
    if (speed >= 25) return lang === 'vi' ? 'Lướt web, công việc ổn định' : 'Standard Web & Office';
    if (speed > 0) return lang === 'vi' ? 'Băng thông cơ bản' : 'Basic Bandwidth';
    return lang === 'vi' ? 'Đo băng thông kéo về' : 'Inbound throughput';
  };

  const getUploadVerdict = (speed: number) => {
    if (speed >= 80) return lang === 'vi' ? 'Livestream 4K & Backup cực nhanh' : '4K Streaming & Fast Backup';
    if (speed >= 25) return lang === 'vi' ? 'Gửi file / Sao lưu ổn định' : 'Smooth Uploads & Cloud Sync';
    if (speed >= 5) return lang === 'vi' ? 'Họp online & gửi ảnh tốt' : 'Clear Video Meetings';
    if (speed > 0) return lang === 'vi' ? 'Tải lên cơ bản' : 'Basic Upload';
    return lang === 'vi' ? 'Bước kế sau download' : 'Follows download';
  };

  const getPingVerdict = (p: number) => {
    if (p === 0) return lang === 'vi' ? 'Chưa đo' : 'Idle';
    if (p <= 25) return lang === 'vi' ? 'Độ trễ cực thấp (Chuẩn Game)' : 'Ultra-low Latency';
    if (p <= 55) return lang === 'vi' ? 'Độ trễ tối ưu, phản hồi nhanh' : 'Optimal Latency';
    if (p <= 120) return lang === 'vi' ? 'Độ trễ trung bình' : 'Average Latency';
    return lang === 'vi' ? 'Độ trễ cao' : 'High Latency';
  };

  const getJitterVerdict = (j: number, loss: number) => {
    if (j === 0 && loss === 0) return lang === 'vi' ? 'Chưa đo' : 'Idle';
    if (loss > 1) return lang === 'vi' ? 'Có hiện tượng mất gói' : 'Packet loss detected';
    if (j <= 4) return lang === 'vi' ? 'Đường truyền ổn định' : 'Stable link';
    if (j <= 20) return lang === 'vi' ? 'Biến thiên nhẹ' : 'Slight jitter';
    return lang === 'vi' ? 'Dao động độ trễ' : 'Jitter fluctuation';
  };

  // Sparkline generator for Download & Upload matching screenshot
  const renderSparkline = (phaseType: 'download' | 'upload', color: string) => {
    const phaseSamples = samples.filter((s) => s.phase === phaseType);
    if (phaseSamples.length < 2) {
      return (
        <div className="w-full h-8 flex items-center my-1 opacity-50">
          <svg className="w-full h-6 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path
              d="M 0 14 Q 25 10 50 14 T 100 13"
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
          </svg>
        </div>
      );
    }

    const max = Math.max(...phaseSamples.map((s) => s.speed), 10);
    const recent = phaseSamples.slice(-25);
    const pts = recent.map((s, idx, arr) => {
      const x = (idx / Math.max(arr.length - 1, 1)) * 100;
      const y = 18 - (s.speed / max) * 15;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${pts.join(' L ')}`;
    const areaD = `M 0,20 L ${pts.join(' L ')} L 100,20 Z`;
    const gradId = `spark-${phaseType}`;

    return (
      <div className="w-full h-8 flex items-center my-1">
        <svg className="w-full h-6 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradId})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#090D16] text-slate-100'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        multiStream={multiStream}
        onToggleMultiStream={handleToggleMultiStream}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onScrollTo={scrollTo}
        userMode={userMode}
        onToggleMode={handleToggleMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Render Tab 2: Giới Thiệu (About Hachihi & Telemetry) Tab */}
        {activeTab === 'guide' ? (
          <AboutTab
            lang={lang}
            theme={theme}
            onSwitchToTest={() => setActiveTab('test')}
          />
        ) : (
          /* Render Tab 1: Speed Test Interactive View */
          <>
            {/* Unified Speed Cockpit: Gauge in Center, 4 Stat Cards on the Two Sides */}
            <section
              ref={speedtestRef}
              className={`relative border rounded-2xl p-4 md:p-6 overflow-hidden transition-colors ${
                isDark
                  ? 'bg-slate-900/50 border-slate-800/90 shadow-2xl'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {/* 3-Column Cockpit Layout: Left Flank (Download + Ping), Center (Gauge Dial), Right Flank (Upload + Jitter/Loss) */}
              <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4 lg:gap-6 items-stretch">
                {/* LEFT FLANK: Tải xuống (Download) & Độ trễ (Ping) */}
                <div className="col-span-1 sm:col-span-4 lg:col-span-3 flex flex-col justify-between gap-3 sm:gap-4 order-2 sm:order-1 h-full">
                  {/* Card 1: Download */}
                  <div className={`flex-1 p-3.5 sm:p-4 border rounded-xl flex flex-col justify-between transition-all duration-200 ${
                    downloadStats.isMeasuring
                      ? 'bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                      : isDark
                      ? 'bg-slate-950/80 border-slate-800/90'
                      : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs text-slate-400 gap-1">
                      <span className="font-bold flex items-center gap-1.5 truncate text-slate-300">
                        <ArrowDownCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="tracking-wider uppercase">{lang === 'vi' ? 'TẢI XUỐNG' : 'DOWNLOAD'}</span>
                      </span>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                        downloadStats.isMeasuring
                          ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 animate-pulse'
                          : downloadStats.isDone
                          ? 'bg-cyan-950/50 border-cyan-500/30 text-cyan-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500'
                      }`}>
                        {downloadStats.isMeasuring
                          ? (lang === 'vi' ? 'Đang đo...' : 'Testing...')
                          : downloadStats.isDone
                          ? (lang === 'vi' ? 'Hoàn tất' : 'Done')
                          : (lang === 'vi' ? 'Chưa đo' : 'Idle')}
                      </span>
                    </div>

                    <div className="my-1.5">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className={`font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {downloadStats.isMeasuring
                            ? formatSpeed(downloadStats.current)
                            : downloadStats.isDone
                            ? formatSpeed(downloadStats.average)
                            : '--'}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {downloadStats.isDone || downloadStats.isMeasuring ? unit : ''}
                        </span>
                      </div>
                    </div>

                    {/* Waveform Sparkline */}
                    {renderSparkline('download', '#22d3ee')}

                    {/* Subtitle Verdict */}
                    <div className="text-[11px] font-medium text-cyan-300/90 pt-1 flex items-center gap-1.5 border-t border-slate-800/80">
                      <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{getDownloadVerdict(downloadStats.isDone ? downloadStats.average : downloadStats.current)}</span>
                    </div>
                  </div>

                  {/* Card 2: Ping Idle */}
                  <div className={`flex-1 p-3.5 sm:p-4 border rounded-xl flex flex-col justify-between transition-all duration-200 ${
                    phase === 'ping'
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : isDark
                      ? 'bg-slate-950/80 border-slate-800/90'
                      : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs text-slate-400 gap-1">
                      <span className="font-bold flex items-center gap-1.5 truncate text-slate-300">
                        <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="tracking-wider uppercase">{lang === 'vi' ? 'ĐỘ TRỄ (PING)' : 'IDLE PING'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-500/30 shrink-0">
                        RTT
                      </span>
                    </div>

                    <div className="my-1.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {pingIdle > 0 ? pingIdle : '--'}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          ms
                        </span>
                      </div>
                    </div>

                    {/* Jitter Progress Bar Segment */}
                    <div className="flex items-center gap-1 my-1">
                      <span className={`w-3.5 h-1.5 rounded-xs ${pingIdle > 0 ? (pingIdle <= 60 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-700'}`} />
                      <span className={`w-3.5 h-1.5 rounded-xs ${pingIdle > 0 ? (pingIdle <= 40 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-700'}`} />
                      <span className={`w-3.5 h-1.5 rounded-xs ${pingIdle > 0 && pingIdle <= 25 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                      <span className={`w-3.5 h-1.5 rounded-xs ${pingIdle > 0 && pingIdle <= 15 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                      <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                        {jitter > 0 ? `±${jitter.toFixed(1)}ms Jitter` : '±0.0ms Jitter'}
                      </span>
                    </div>

                    {/* Subtitle Verdict */}
                    <div className="text-[11px] font-medium text-amber-300/90 pt-1 flex items-center gap-1.5 border-t border-slate-800/80">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{getPingVerdict(pingIdle)}</span>
                    </div>
                  </div>
                </div>

                {/* CENTER: Tachometer Gauge Dial */}
                <div className="col-span-2 sm:col-span-4 lg:col-span-6 flex flex-col items-center justify-center order-1 sm:order-2 my-auto px-1 sm:px-2">
                  <GaugeMeter
                    currentSpeed={unit === 'MB/s' ? currentSpeed / 8 : currentSpeed}
                    phase={phase}
                    isRunning={isRunning}
                    onStart={startTest}
                    onStop={stopTest}
                    lang={lang}
                    unit={unit}
                    isEnterpriseMode={userMode === 'enterprise'}
                  />
                </div>

                {/* RIGHT FLANK: Tải lên (Upload) & Jitter / Mất gói */}
                <div className="col-span-1 sm:col-span-4 lg:col-span-3 flex flex-col justify-between gap-3 sm:gap-4 order-3 h-full">
                  {/* Card 3: Upload */}
                  <div className={`flex-1 p-3.5 sm:p-4 border rounded-xl flex flex-col justify-between transition-all duration-200 ${
                    uploadStats.isMeasuring
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : isDark
                      ? 'bg-slate-950/80 border-slate-800/90'
                      : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs text-slate-400 gap-1">
                      <span className="font-bold flex items-center gap-1.5 truncate text-slate-300">
                        <ArrowUpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="tracking-wider uppercase">{lang === 'vi' ? 'TẢI LÊN' : 'UPLOAD'}</span>
                      </span>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                        uploadStats.isMeasuring
                          ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 animate-pulse'
                          : uploadStats.isDone
                          ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500'
                      }`}>
                        {uploadStats.isMeasuring
                          ? (lang === 'vi' ? 'Đang đo...' : 'Testing...')
                          : uploadStats.isDone
                          ? (lang === 'vi' ? 'Hoàn tất' : 'Done')
                          : (lang === 'vi' ? 'Chưa đo' : 'Idle')}
                      </span>
                    </div>

                    <div className="my-1.5">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className={`font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {uploadStats.isMeasuring
                            ? formatSpeed(uploadStats.current)
                            : uploadStats.isDone
                            ? formatSpeed(uploadStats.average)
                            : '--'}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {uploadStats.isDone || uploadStats.isMeasuring ? unit : ''}
                        </span>
                      </div>
                    </div>

                    {/* Waveform Sparkline */}
                    {renderSparkline('upload', '#34d399')}

                    {/* Subtitle Verdict */}
                    <div className="text-[11px] font-medium text-emerald-300/90 pt-1 flex items-center gap-1.5 border-t border-slate-800/80">
                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{getUploadVerdict(uploadStats.isDone ? uploadStats.average : uploadStats.current)}</span>
                    </div>
                  </div>

                  {/* Card 4: Jitter & Packet Loss */}
                  <div className={`flex-1 p-3.5 sm:p-4 border rounded-xl flex flex-col justify-between transition-all duration-200 ${
                    phase === 'complete' && jitter > 0
                      ? 'bg-slate-950/80 border-slate-800/90'
                      : isDark
                      ? 'bg-slate-950/80 border-slate-800/90'
                      : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs text-slate-400 gap-1">
                      <span className="font-bold flex items-center gap-1.5 truncate text-slate-300">
                        <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="tracking-wider uppercase truncate">{lang === 'vi' ? 'JITTER & MẤT GÓI' : 'JITTER & LOSS'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/30 shrink-0">
                        QoS
                      </span>
                    </div>

                    <div className="my-1.5">
                      <div className="flex items-baseline gap-3">
                        <div>
                          <span className={`font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {jitter > 0 ? jitter.toFixed(1) : '--'}
                          </span>
                          <span className={`text-xs font-mono ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ms</span>
                        </div>
                        <div className={`border-l pl-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                          <span className={`font-mono text-lg font-bold tabular-nums ${packetLoss === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {packetLoss}%
                          </span>
                          <span className={`text-[10px] font-mono block -mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {lang === 'vi' ? 'mất gói' : 'loss'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`text-[11px] font-mono pt-1 border-t border-slate-800/80 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {getJitterVerdict(jitter, packetLoss)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Real-time Telemetry Bandwidth Chart with Current / Avg / Peak */}
            <section>
              <LiveTelemetryChart
                samples={samples}
                currentPhase={phase}
                currentSpeed={currentSpeed}
                averageSpeed={phase === 'download' ? downloadStats.average : phase === 'upload' ? uploadStats.average : latestResult?.download.average || 0}
                peakSpeed={phase === 'download' ? downloadStats.peak : phase === 'upload' ? uploadStats.peak : latestResult?.download.peak || 0}
                lang={lang}
              />
            </section>

            {/* Sleek Network Status, Server Node & Mode Switcher Bar */}
            <section
              className={`border rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
              }`}
            >
              {/* Left: ISP, IP with mask, protocol */}
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className={`font-bold truncate max-w-[190px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{clientInfo.isp}</span>
                <span className="font-mono text-cyan-400 font-semibold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                  {maskIp ? clientInfo.maskedIp : clientInfo.ip}
                </span>
                <button
                  type="button"
                  onClick={() => setMaskIp(!maskIp)}
                  title={maskIp ? 'Hiện IP đầy đủ' : 'Che bớt IP'}
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  {maskIp ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                </button>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                  {clientInfo.ipVersion}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold inline-flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5" />
                  {clientInfo.connectionType}
                </span>
                <span className="text-slate-400 hidden md:inline">· {clientInfo.city}, {clientInfo.country}</span>
              </div>

              {/* Right: Target Server + Mode Toggle */}
              <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>Trạm:</span>
                  <span className={`font-semibold truncate max-w-[130px] lg:max-w-[160px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {selectedServer.name}
                  </span>
                  <span className="font-mono text-emerald-400">
                    (~{selectedServer.pingEstimate || 15}ms)
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setIsServerModalOpen(true)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  {lang === 'vi' ? 'Đổi Trạm' : 'Change'}
                </button>

                {/* Mode Switcher */}
                <div className={`p-0.5 rounded-lg border text-[11px] font-semibold flex items-center ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('enterprise')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      userMode === 'enterprise' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Doanh Nghiệp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('technical')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      userMode === 'technical' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Kỹ Thuật
                  </button>
                </div>
              </div>
            </section>

            {/* Share & Report Action Bar (When result is ready) */}
            {latestResult && (
              <section
                className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300 ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-800/40'
                    : 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {lang === 'vi' ? 'Phiên Đo Đạt Chuẩn Kỹ Thuật Đã Hoàn Tất!' : 'Benchmark Completed Successfully!'}
                    </h4>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {lang === 'vi'
                        ? 'Xuất chứng nhận kèm mã QR, in báo cáo PDF hoặc sao chép nội dung kỹ thuật để khiếu nại nhà mạng.'
                        : 'Export official certificate with QR code, print PDF or copy ISP support ticket.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAuditModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer whitespace-nowrap justify-center"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{lang === 'vi' ? 'In Biên Bản Nghiệm Thu (A4)' : 'Print Audit Protocol (A4)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl border transition-all cursor-pointer whitespace-nowrap justify-center ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'vi' ? 'Chứng Nhận & QR' : 'Certificate & QR'}</span>
                  </button>
                </div>
              </section>
            )}

            {/* Enterprise Operational Capability & AI Brief Card */}
            {latestResult && (
              <section ref={diagnosticsRef} className="space-y-6">
                <EnterpriseAuditCard
                  result={latestResult}
                  lang={lang}
                  theme={theme}
                  onOpenAuditModal={() => setIsAuditModalOpen(true)}
                />
              </section>
            )}

            {/* P1: Network Diagnostics & Speedtest SCORE (0 - 100) Card */}
            {latestResult && (
              <section>
                <NetworkDiagnosticsCard
                  result={latestResult}
                  mode={userMode === 'technical' ? 'technician' : 'basic'}
                  onToggleMode={(m) => handleToggleMode(m === 'technician' ? 'technical' : 'enterprise')}
                  lang={lang}
                />
              </section>
            )}

            {/* Bufferbloat Deep-Dive Analysis with Full A+/A/B/C/D/F rating scale */}
            <section ref={bufferbloatRef}>
              <BufferbloatAnalysis
                report={latestResult ? latestResult.bufferbloat : null}
                lang={lang}
              />
            </section>

            {/* Direct Accuracy Benchmark Section */}
            <section
              className={`border rounded-2xl p-6 space-y-4 transition-colors ${
                isDark
                  ? 'bg-slate-900/40 border-slate-800/80'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {lang === 'vi'
                      ? 'Tiêu Chuẩn Đo Lường Tốc Độ Mạng Thực Tế Của Hachihi Speedtest'
                      : 'Accuracy Benchmark: Genuine Speedtest Telemetry by Hachihi'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className="hidden sm:flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Xem thông tin giới thiệu' : 'About & Guide'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div
                  className={`p-4 rounded-xl border space-y-1.5 transition-colors ${
                    isDark ? 'bg-slate-950/60 border-slate-800/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    {lang === 'vi' ? 'Download: Băng Thông Đạt Đỉnh Thật' : 'Download: True Saturation'}
                  </div>
                  <p className="leading-relaxed">
                    {lang === 'vi'
                      ? 'Tốc độ tải xuống đo đạc trực tiếp qua luồng byte nhị phân ngẫu nhiên thực tế, không nén, có warm-up 1.5s loại bỏ ảo giác spike ban đầu.'
                      : 'Download metrics benchmark the true physical saturation rate with 1.5s warmup discarding early TCP ramp-up spikes.'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-1.5 transition-colors ${
                    isDark ? 'bg-slate-950/60 border-slate-800/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    {lang === 'vi' ? 'Ping & Jitter: Đo Vòng Lặp Thực Tế' : 'Ping & Jitter: True RTT'}
                  </div>
                  <p className="leading-relaxed">
                    {lang === 'vi'
                      ? 'Đo đạc chính xác thời gian trễ vòng lặp (RTT) tới máy chủ hạ tầng Hachihi theo mili-giây thực tế, không sử dụng số liệu làm đẹp hay giả lập.'
                      : 'Speedtest measures direct round-trip latency to live infrastructure without artificial smoothing or simulated delays.'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-1.5 transition-colors ${
                    isDark ? 'bg-slate-950/60 border-slate-800/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {lang === 'vi' ? 'Bufferbloat: Đo Độ Trễ Dưới Tải' : 'Bufferbloat: Loaded Latency'}
                  </div>
                  <p className="leading-relaxed">
                    {lang === 'vi'
                      ? 'Hệ thống đo sâu Loaded Latency khi đường truyền bị ép tải cực đại cùng lúc, giúp phát hiện hàng đợi router bị tràn gây giật ping trong game.'
                      : 'Measures latency under peak saturation to expose router queue bufferbloat causing severe latency spikes.'}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`w-full border-t py-6 text-center text-xs transition-colors ${
          isDark
            ? 'border-slate-800/80 bg-slate-950 text-slate-500'
            : 'border-slate-200 bg-white text-slate-600'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Speedtest</span>
            <span>·</span>
            <a
              href="https://hachihi.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-semibold"
            >
              hachihi.vn
            </a>
            <span>·</span>
            <span>{lang === 'vi' ? 'Hệ thống đo lường Internet chuẩn xác & minh bạch' : 'Genuine network telemetry'}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>Hotline: <a href="tel:0933842126" className="text-cyan-400 hover:underline">0933842126</a></span>
            <span>·</span>
            <span>Support: <a href="tel:0918001944" className="text-amber-400 hover:underline">09-1800-1944</a></span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ServerSelectorModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        servers={SERVER_NODES}
        selectedServer={selectedServer}
        onSelectServer={(srv) => setSelectedServer(srv)}
        lang={lang}
      />

      <ShareCertificateModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        result={latestResult}
        lang={lang}
      />

      <EnterpriseAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        result={latestResult}
        lang={lang}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={() => {
          setHistory([]);
          try {
            localStorage.removeItem('speedtest_history');
            localStorage.removeItem('netpulse_history');
          } catch {
            // ignore
          }
        }}
        onSelectResult={(res) => {
          setLatestResult(res);
          setDownloadStats({
            current: res.download?.average ?? res.downloadSpeed,
            average: res.download?.average ?? res.downloadSpeed,
            peak: res.download?.peak ?? res.downloadSpeed,
            isMeasuring: false,
            isDone: true,
          });
          setUploadStats({
            current: res.upload?.average ?? res.uploadSpeed,
            average: res.upload?.average ?? res.uploadSpeed,
            peak: res.upload?.peak ?? res.uploadSpeed,
            isMeasuring: false,
            isDone: true,
          });
          setPingIdle(res.ping);
          setPingDownloadLoaded(res.pingDownloadLoaded ?? res.ping);
          setPingUploadLoaded(res.pingUploadLoaded ?? res.ping);
          setJitter(res.jitter);
          setPacketLoss(res.packetLoss);
          setSamples(res.samples || []);
          setActiveTab('test');
        }}
        lang={lang}
      />
    </div>
  );
}
