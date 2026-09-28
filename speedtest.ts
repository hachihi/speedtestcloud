export type TestPhase = 
  | 'idle' 
  | 'detecting' 
  | 'ping' 
  | 'download' 
  | 'upload' 
  | 'jitter_loss' 
  | 'bufferbloat' 
  | 'complete' 
  | 'error';

export interface ServerNode {
  id: string;
  name: string;
  provider: string;
  city: string;
  country: string;
  countryCode: string;
  pingEstimate: number;
  type: 'local' | 'cdn' | 'global';
  endpoint?: string;
  host: string;
  distanceKm?: number;
}

export interface ClientConnectionInfo {
  ip: string;
  maskedIp: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  isp: string;
  org: string;
  asn: string;
  connectionType: 'Wi-Fi' | 'LAN' | 'Di động' | 'Broadband';
  effectiveType?: string;
  linkSpeed?: string;
  ipVersion: 'IPv4' | 'IPv6';
}

// Backwards compatibility alias
export type ClientNetworkInfo = ClientConnectionInfo;

export interface MetricSample {
  time: number; // seconds from test start
  speed: number; // Mbps
  ping?: number; // ms
  phase: TestPhase;
}

export interface BufferbloatReport {
  idlePing: number;
  downloadLoadedPing: number;
  uploadLoadedPing: number;
  downloadDelta: number;
  uploadDelta: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  verdictVi: string;
  verdictEn: string;
  impactVi: string;
  impactEn: string;
}

export interface QoEItem {
  service: 'gaming' | 'streaming' | 'conference' | 'cloud';
  nameVi: string;
  nameEn: string;
  score: number; // 0 - 100
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  statusVi: string;
  statusEn: string;
  detailsVi: string;
  detailsEn: string;
}

export interface NetworkDiagnostics {
  score: number; // 0 - 100 (speedtest SCORE)
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  internet: { rating: string; status: 'good' | 'fair' | 'poor'; note: string };
  wifi: { rating: string; status: 'good' | 'fair' | 'poor'; note: string };
  gaming: { rating: string; status: 'good' | 'fair' | 'poor'; note: string };
  videoCall: { rating: string; status: 'good' | 'fair' | 'poor'; note: string };
  streaming: { rating: string; status: 'good' | 'fair' | 'poor'; note: string };
  probableCauses: string[];
  technicianLogs: string[];
}

export interface SpeedMetricData {
  current: number;
  average: number;
  peak: number;
  isMeasuring: boolean;
  isDone: boolean;
}

export interface SpeedTestResult {
  id: string;
  timestamp: number;
  clientInfo: ClientConnectionInfo;
  server: ServerNode;
  ping: number; // Idle Ping ms
  pingDownloadLoaded: number;
  pingUploadLoaded: number;
  jitter: number;
  packetLoss: number;
  download: {
    average: number;
    peak: number;
  };
  upload: {
    average: number;
    peak: number;
  };
  // Backwards compatibility properties
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  bufferbloat: BufferbloatReport;
  diagnostics: NetworkDiagnostics;
  qoe: QoEItem[];
  connectionType: 'multi' | 'single';
  samples: MetricSample[];
  durationSec: number;
}
