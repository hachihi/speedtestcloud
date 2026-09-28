import React, { useState } from 'react';
import { Volume2, VolumeX, History, Layers, Sun, Moon, Info, Gauge, Building2, Cpu } from 'lucide-react';

interface NavbarProps {
  lang: 'vi' | 'en';
  onToggleLang: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  multiStream: boolean;
  onToggleMultiStream: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeTab: 'test' | 'guide';
  onSelectTab: (tab: 'test' | 'guide') => void;
  onOpenHistory: () => void;
  onScrollTo: (id: string) => void;
  userMode?: 'enterprise' | 'technical';
  onToggleMode?: (mode: 'enterprise' | 'technical') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  audioEnabled,
  onToggleAudio,
  multiStream,
  onToggleMultiStream,
  theme,
  onToggleTheme,
  activeTab,
  onSelectTab,
  onOpenHistory,
  onScrollTo,
  userMode = 'enterprise',
  onToggleMode,
}) => {
  const isDark = theme === 'dark';
  const [logoError, setLogoError] = useState(false);

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors ${
        isDark
          ? 'bg-[#090D16]/90 border-slate-800/80 text-slate-100'
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand & Tab switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => {
              onSelectTab('test');
              onScrollTo('top');
            }}
            className="text-base sm:text-lg font-bold tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            {!logoError ? (
              <img
                src="https://drive.google.com/uc?export=view&id=1z8McGUxFssJJy7iFD0jaBeC0LfIGuDcf"
                alt="Speedtest Logo"
                className="w-8 h-8 object-contain rounded-lg shrink-0"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 font-extrabold text-lg flex items-center justify-center shadow-[0_0_14px_rgba(52,211,153,0.6)] select-none shrink-0"
                title="Hachihi"
              >
                H
              </div>
            )}
            <span className={isDark ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold'}>Speedtest</span>
          </button>

          {/* Primary View Tabs */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-xs font-semibold ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectTab('test')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'test'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Đo Tốc Độ' : 'Speed Test'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Giới Thiệu' : 'About Us'}</span>
            </button>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Multi-stream vs Single-stream toggle */}
          {activeTab === 'test' && (
            <button
              type="button"
              onClick={onToggleMultiStream}
              title={
                lang === 'vi'
                  ? multiStream
                    ? 'Đang bật đa luồng (Multi-stream) để ép tải tối đa'
                    : 'Đang bật đơn luồng (Single-stream)'
                  : multiStream
                  ? 'Multi-stream active'
                  : 'Single-stream active'
              }
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                multiStream
                  ? isDark
                    ? 'bg-slate-800 text-cyan-300 border-slate-700'
                    : 'bg-cyan-50 text-cyan-700 border-cyan-300'
                  : isDark
                  ? 'bg-slate-900 text-slate-400 border-slate-800'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              <span>{multiStream ? 'Multi' : 'Single'}</span>
            </button>
          )}

          {/* Theme Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDark ? (lang === 'vi' ? 'Chuyển sang Giao diện Sáng' : 'Switch to Light Mode') : (lang === 'vi' ? 'Chuyển sang Giao diện Tối' : 'Switch to Dark Mode')}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white bg-slate-900 border-slate-800 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleAudio}
            title={audioEnabled ? (lang === 'vi' ? 'Tắt âm thanh' : 'Mute Sound') : (lang === 'vi' ? 'Bật âm thanh' : 'Enable Sound')}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white bg-slate-900 border-slate-800 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {audioEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            title={lang === 'vi' ? 'Xem lịch sử đo' : 'View Test History'}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white bg-slate-900 border-slate-800 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
          </button>

          {/* Language VI / EN Toggle */}
          <button
            type="button"
            onClick={onToggleLang}
            className={`px-2.5 py-1 text-xs font-bold font-mono rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            {lang === 'vi' ? 'VI' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
};
