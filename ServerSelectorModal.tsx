import React, { useState } from 'react';
import { ServerNode } from '../types/speedtest';
import { X, Search, Globe, Check, Radio } from 'lucide-react';

interface ServerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: ServerNode[];
  selectedServer: ServerNode;
  onSelectServer: (server: ServerNode) => void;
  lang: 'vi' | 'en';
}

export const ServerSelectorModal: React.FC<ServerSelectorModalProps> = ({
  isOpen,
  onClose,
  servers,
  selectedServer,
  onSelectServer,
  lang,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vn' | 'global'>('all');

  if (!isOpen) return null;

  const filteredServers = servers.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.provider.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filterType === 'vn') return s.countryCode === 'VN';
    if (filterType === 'global') return s.countryCode !== 'VN';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {lang === 'vi' ? 'Chọn Máy Chủ Kiểm Tra (Server Nodes)' : 'Select Test Server Node'}
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

        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'vi' ? 'Tìm theo tên nhà mạng, thành phố...' : 'Search by provider, city...'}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {lang === 'vi' ? 'Tất cả máy chủ' : 'All Servers'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('vn')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterType === 'vn'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {lang === 'vi' ? 'Việt Nam (Trong nước)' : 'Vietnam Domestic'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('global')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterType === 'global'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {lang === 'vi' ? 'Quốc tế (Singapore / Tokyo / US)' : 'International'}
            </button>
          </div>
        </div>

        {/* Server List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-800/40">
          {filteredServers.map((server) => {
            const isSelected = selectedServer.id === server.id;
            return (
              <div
                key={server.id}
                onClick={() => {
                  onSelectServer(server);
                  onClose();
                }}
                className={`pt-2 first:pt-0 p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-cyan-950/40 border border-cyan-800/50'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-cyan-400">
                    {server.countryCode}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">
                        {server.name}
                      </span>
                      {server.type === 'local' && (
                        <span className="text-[10px] font-mono text-cyan-400">
                          [Cloud Edge]
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {server.city} · {server.provider}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-slate-300">
                      ~{server.pingEstimate} ms
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {lang === 'vi' ? 'Ước tính RTT' : 'Est. Latency'}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                        : 'border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredServers.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              {lang === 'vi' ? 'Không tìm thấy trạm đo phù hợp' : 'No servers matching your query'}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {lang === 'vi' ? 'Máy chủ khuyên dùng: Speedtest Cloud Edge' : 'Recommended: Speedtest Cloud Edge'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
