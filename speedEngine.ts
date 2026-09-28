import {
  BufferbloatReport,
  ClientConnectionInfo,
  MetricSample,
  NetworkDiagnostics,
  QoEItem,
  ServerNode,
  SpeedMetricData,
  SpeedTestResult,
  TestPhase,
} from '../types/speedtest';
import { soundEffects } from './soundEffects';

export interface SpeedTestCallbacks {
  onPhaseChange: (phase: TestPhase) => void;
  onProgress: (percent: number, statusText: string) => void;
  onPingUpdate: (ping: number, jitter: number, loss: number) => void;
  onDownloadUpdate: (stats: SpeedMetricData, loadedPing: number) => void;
  onUploadUpdate: (stats: SpeedMetricData, loadedPing: number) => void;
  onSample: (sample: MetricSample) => void;
  onComplete: (result: SpeedTestResult) => void;
  onError: (error: string) => void;
}

export class SpeedTestRunner {
  private abortController: AbortController | null = null;
  private isRunning: boolean = false;
  private backendAvailable: boolean | null = null;

  private maskIp(ip: string): string {
    if (!ip) return '***.***.***.***';
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***`;
      }
    } else if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return `${parts[0]}:${parts[1]}:****:****`;
      }
    }
    return ip;
  }

  /** Toàn bộ phép đo chạy trên Cloudflare Speed Test edge (anycast, gần VN), không đi qua Vercel. */
  public async checkBackendAvailability(): Promise<boolean> {
    this.backendAvailable = false;
    return false;
  }

  public getPingSources(nodeId: string, tag: string): string[] {
    return [
      `https://speed.cloudflare.com/__down?bytes=0&node=${encodeURIComponent(nodeId)}&t=${tag}`,
      `https://1.1.1.1/cdn-cgi/trace?t=${tag}`,
    ];
  }

  public getDownloadSources(streamIdx: number): string[] {
    // 25MB/request: đủ lớn để TCP ramp-up xong, không bị giới hạn 4.5MB như Vercel
    return [`https://speed.cloudflare.com/__down?bytes=25000000&r=${streamIdx}-${Date.now()}`];
  }

  public getUploadSources(streamIdx: number): string[] {
    return [`https://speed.cloudflare.com/__up?r=${streamIdx}-${Date.now()}`];
  }

  public async fetchClientInfo(): Promise<ClientConnectionInfo> {
    let clientIp = '118.69.182.24';
    let city = 'Hà Nội';
    let region = 'Hà Nội';
    let country = 'Việt Nam';
    let countryCode = 'VN';
    let isp = 'FPT Telecom';
    let org = 'Hachihi Gateway Route';
    let asn = 'AS18403';

    const ispFromAsn = (as: string) => {
      if (as === '18403') return 'FPT Telecom';
      if (as === '7552' || as === '45899') return 'Viettel Telecom';
      if (as === '131429' || as === '38722') return 'VNPT Vinaphone';
      return null;
    };
    let gotMeta = false;

    // Cách 1: JSON metadata của Cloudflare Speed Test
    try {
      const res = await fetch('https://speed.cloudflare.com/meta', { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        if (d?.clientIp) {
          gotMeta = true;
          clientIp = d.clientIp;
          if (d.city) city = d.city;
          if (d.region) region = d.region;
          if (d.country) {
            countryCode = d.country;
            country = d.country === 'VN' ? 'Việt Nam' : d.country;
          }
          if (d.asn) {
            asn = `AS${d.asn}`;
            isp = ispFromAsn(String(d.asn)) || d.asOrganization || isp;
          }
          if (d.asOrganization) org = d.asOrganization;
        }
      }
    } catch {
      // thử cách 2
    }

    // Cách 2: header cf-meta-* của endpoint __down
    if (!gotMeta) {
      try {
        const cfRes = await fetch('https://speed.cloudflare.com/__down?bytes=0', { cache: 'no-store' });
        if (cfRes.ok) {
          const ip = cfRes.headers.get('cf-meta-ip');
          const cty = cfRes.headers.get('cf-meta-city');
          const ctry = cfRes.headers.get('cf-meta-country');
          const as = cfRes.headers.get('cf-meta-asn');
          if (ip) { clientIp = ip; gotMeta = true; }
          if (cty) city = decodeURIComponent(cty);
          if (ctry) {
            countryCode = ctry;
            country = ctry === 'VN' ? 'Việt Nam' : ctry;
          }
          if (as) {
            asn = `AS${as}`;
            isp = ispFromAsn(as) || isp;
          }
        }
      } catch {
        // ignore
      }
    }

    // Cách 3: chỉ lấy IP nếu 2 cách trên đều thất bại
    if (!gotMeta) {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const d = await ipRes.json();
          if (d?.ip) clientIp = d.ip;
        }
      } catch {
        // ignore
      }
    }

    // Detect browser network connection API
    let connectionType: ClientConnectionInfo['connectionType'] = 'Wi-Fi';
    let effectiveType: string | undefined = undefined;
    let linkSpeed: string | undefined = undefined;

    const nav = navigator as unknown as {
      connection?: {
        type?: string;
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
      };
    };

    if (nav.connection) {
      const conn = nav.connection;
      effectiveType = conn.effectiveType;
      if (conn.downlink) {
        linkSpeed = `${conn.downlink} Mbps (Browser Link)`;
      }
      if (conn.type === 'wifi') {
        connectionType = 'Wi-Fi';
      } else if (conn.type === 'ethernet') {
        connectionType = 'LAN';
      } else if (conn.type === 'cellular') {
        connectionType = 'Di động';
      }
    }

    return {
      ip: clientIp,
      maskedIp: this.maskIp(clientIp),
      city,
      region,
      country,
      countryCode,
      isp,
      org,
      asn,
      connectionType,
      effectiveType,
      linkSpeed,
      ipVersion: clientIp.includes(':') ? 'IPv6' : 'IPv4',
    };
  }

  public abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRunning = false;
    soundEffects.stopContinuousHum();
  }

  public async runTest(
    server: ServerNode,
    clientInfo: ClientConnectionInfo,
    multiStream: boolean = true,
    callbacks: SpeedTestCallbacks
  ) {
    if (this.isRunning) {
      this.abort();
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const samples: MetricSample[] = [];
    const testStartTime = performance.now();
    const technicianLogs: string[] = [];

    const logTech = (msg: string) => {
      const ts = ((performance.now() - testStartTime) / 1000).toFixed(2);
      technicianLogs.push(`[+${ts}s] ${msg}`);
    };

    try {
      logTech(`Khởi động phiên đo lường với máy chủ: ${server.name}`);
      callbacks.onPhaseChange('detecting');
      callbacks.onProgress(5, 'Đang thiết lập kết nối tới trạm đo...');

      await this.checkBackendAvailability();
      logTech('Hạ tầng trạm đo: Cloudflare Speed Test Edge (anycast)');

      await new Promise((r) => setTimeout(r, 250));
      if (signal.aborted) return;

      // ==========================================
      // BƯỚC 1: PING IDLE & INITIAL JITTER
      // ==========================================
      callbacks.onPhaseChange('ping');
      callbacks.onProgress(10, 'Đo độ trễ Ping cơ sở (Idle RTT)...');
      logTech('Bắt đầu chuỗi 10 gói tin kiểm tra RTT Idle...');

      const idlePingResults: number[] = [];
      let packetLossCount = 0;
      const totalPings = 10;

      for (let i = 0; i < totalPings; i++) {
        if (signal.aborted) return;
        const pingStart = performance.now();
        let pingSuccess = false;
        const pingSources = this.getPingSources(server.id, `${Date.now()}_${i}`);

        for (const pUrl of pingSources) {
          try {
            const pingRes = await fetch(pUrl, {
              signal,
              cache: 'no-store',
            });

            if (pingRes.ok) {
              const rtt = Math.max(Math.round(performance.now() - pingStart), 1);
              idlePingResults.push(rtt);
              soundEffects.playPingTick(rtt);

              const curJitter = this.calculateJitter(idlePingResults);
              const curAvgPing = Math.round(
                idlePingResults.reduce((a, b) => a + b, 0) / idlePingResults.length
              );
              const lossPct = Number(((packetLossCount / (i + 1)) * 100).toFixed(1));

              callbacks.onPingUpdate(curAvgPing, curJitter, lossPct);
              samples.push({
                time: Number(((performance.now() - testStartTime) / 1000).toFixed(2)),
                speed: 0,
                ping: rtt,
                phase: 'ping',
              });
              pingSuccess = true;
              break;
            }
          } catch {
            // try next ping source in fallback list
          }
        }

        if (!pingSuccess) {
          packetLossCount++;
        }

        const prog = Math.round(10 + ((i + 1) / totalPings) * 10);
        callbacks.onProgress(prog, `Đang đo độ trễ gói tin ${i + 1}/${totalPings}...`);
        await new Promise((r) => setTimeout(r, 45));
      }

      const idlePing = idlePingResults.length > 0
        ? Math.round(idlePingResults.reduce((a, b) => a + b, 0) / idlePingResults.length)
        : 15;
      const initialJitter = this.calculateJitter(idlePingResults);
      logTech(`Ping Idle xác định: ${idlePing}ms | Jitter: ${initialJitter}ms`);

      // ==========================================
      // BƯỚC 2: DOWNLOAD VỚI WARM-UP & MULTI-STREAM
      // ==========================================
      callbacks.onPhaseChange('download');
      callbacks.onProgress(20, 'Đang ép tải Download (Warm-up & Đa luồng)...');
      soundEffects.startContinuousHum();
      logTech(`Bắt đầu đo Download với ${multiStream ? '8' : '1'} luồng TCP song song...`);

      const downloadLoadedPings: number[] = [];
      const stopDownloadPing = this.startBackgroundPingMonitor(
        signal,
        (p) => downloadLoadedPings.push(p)
      );

      const downloadStats = await this.runDownloadStream(
        signal,
        multiStream,
        testStartTime,
        samples,
        callbacks,
        idlePing,
        downloadLoadedPings,
        logTech
      );

      stopDownloadPing();
      soundEffects.stopContinuousHum();
      logTech(`Hoàn tất Download: Trung bình ${downloadStats.average} Mbps | Đỉnh ${downloadStats.peak} Mbps`);

      await new Promise((r) => setTimeout(r, 200));
      if (signal.aborted) return;

      // ==========================================
      // BƯỚC 3: UPLOAD VỚI WARM-UP & MULTI-STREAM
      // ==========================================
      callbacks.onPhaseChange('upload');
      callbacks.onProgress(55, 'Đang ép tải Upload (Đa luồng gửi dữ liệu)...');
      soundEffects.startContinuousHum();
      logTech(`Bắt đầu đo Upload với ${multiStream ? '6' : '1'} luồng TCP song song...`);

      const uploadLoadedPings: number[] = [];
      const stopUploadPing = this.startBackgroundPingMonitor(
        signal,
        (p) => uploadLoadedPings.push(p)
      );

      const uploadStats = await this.runUploadStream(
        signal,
        multiStream,
        testStartTime,
        samples,
        callbacks,
        idlePing,
        uploadLoadedPings,
        logTech
      );

      stopUploadPing();
      soundEffects.stopContinuousHum();
      logTech(`Hoàn tất Upload: Trung bình ${uploadStats.average} Mbps | Đỉnh ${uploadStats.peak} Mbps`);

      await new Promise((r) => setTimeout(r, 200));
      if (signal.aborted) return;

      // ==========================================
      // BƯỚC 4: KIỂM ĐỊNH JITTER & PACKET LOSS DƯỚI TẢI
      // ==========================================
      callbacks.onPhaseChange('jitter_loss');
      callbacks.onProgress(85, 'Đo lường biến thiên độ trễ Jitter & rớt gói...');
      logTech('Kiểm định Jitter & Packet Loss sau chu kỳ ép tải...');

      const postLoadPings: number[] = [];
      for (let k = 0; k < 6; k++) {
        if (signal.aborted) return;
        const pStart = performance.now();
        let pSuccess = false;
        const postSources = this.getPingSources('post', `${Date.now()}_${k}`);
        for (const postUrl of postSources) {
          try {
            const res = await fetch(postUrl, { signal, cache: 'no-store' });
            if (res.ok) {
              const rtt = Math.max(Math.round(performance.now() - pStart), 1);
              postLoadPings.push(rtt);
              pSuccess = true;
              break;
            }
          } catch {
            // try next source
          }
        }
        if (!pSuccess) {
          packetLossCount++;
        }
        await new Promise((r) => setTimeout(r, 40));
      }

      const allPings = [...idlePingResults, ...postLoadPings];
      const finalJitter = this.calculateJitter(allPings);
      const totalProbes = totalPings + 6;
      const packetLossPercent = Number(((packetLossCount / totalProbes) * 100).toFixed(1));

      callbacks.onPingUpdate(idlePing, finalJitter, packetLossPercent);

      // ==========================================
      // BƯỚC 5: PHÂN TÍCH BUFFERBLOAT & TỔNG HỢP
      // ==========================================
      callbacks.onPhaseChange('bufferbloat');
      callbacks.onProgress(92, 'Phân tích độ trễ Bufferbloat & chẩn đoán mạng...');

      const dlLoadedAvg = downloadLoadedPings.length > 0
        ? Math.round(downloadLoadedPings.reduce((a, b) => a + b, 0) / downloadLoadedPings.length)
        : idlePing;

      const ulLoadedAvg = uploadLoadedPings.length > 0
        ? Math.round(uploadLoadedPings.reduce((a, b) => a + b, 0) / uploadLoadedPings.length)
        : idlePing;

      const bufferbloat = this.computeBufferbloat(idlePing, dlLoadedAvg, ulLoadedAvg);
      logTech(`Bufferbloat: Idle ${idlePing}ms | DL Loaded ${dlLoadedAvg}ms (+${bufferbloat.downloadDelta}ms) | UL Loaded ${ulLoadedAvg}ms (+${bufferbloat.uploadDelta}ms) => Hạng ${bufferbloat.grade}`);

      // ==========================================
      // BƯỚC 6: CHẨN ĐOÁN MẠNG & TÍNH SCORE (0 - 100)
      // ==========================================
      const diagnostics = this.computeDiagnostics(
        downloadStats.average,
        uploadStats.average,
        idlePing,
        finalJitter,
        packetLossPercent,
        bufferbloat,
        technicianLogs
      );

      const qoe = this.computeQoE(
        downloadStats.average,
        uploadStats.average,
        idlePing,
        finalJitter,
        packetLossPercent,
        bufferbloat.grade
      );

      callbacks.onProgress(100, 'Đã hoàn tất toàn bộ bài đo!');
      callbacks.onPhaseChange('complete');
      soundEffects.playCompletionChord();

      const totalDuration = Number(((performance.now() - testStartTime) / 1000).toFixed(1));

      const result: SpeedTestResult = {
        id: `st-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        clientInfo,
        server,
        ping: idlePing,
        pingDownloadLoaded: dlLoadedAvg,
        pingUploadLoaded: ulLoadedAvg,
        jitter: finalJitter,
        packetLoss: packetLossPercent,
        download: {
          average: downloadStats.average,
          peak: downloadStats.peak,
        },
        upload: {
          average: uploadStats.average,
          peak: uploadStats.peak,
        },
        downloadSpeed: downloadStats.average,
        uploadSpeed: uploadStats.average,
        bufferbloat,
        diagnostics,
        qoe,
        connectionType: multiStream ? 'multi' : 'single',
        samples,
        durationSec: totalDuration,
      };

      this.isRunning = false;
      callbacks.onComplete(result);
    } catch (err: unknown) {
      this.isRunning = false;
      soundEffects.stopContinuousHum();
      if (!signal.aborted) {
        callbacks.onError(err instanceof Error ? err.message : 'Kiểm tra tốc độ gặp sự cố kết nối');
      }
    }
  }

  private calculateJitter(pings: number[]): number {
    if (pings.length < 2) return 1;
    let sumDiff = 0;
    for (let i = 0; i < pings.length - 1; i++) {
      sumDiff += Math.abs(pings[i + 1] - pings[i]);
    }
    return Number((sumDiff / (pings.length - 1)).toFixed(1));
  }

  private startBackgroundPingMonitor(
    signal: AbortSignal,
    onPing: (ping: number) => void
  ): () => void {
    let active = true;
    const run = async () => {
      while (active && !signal.aborted) {
        const start = performance.now();
        const sources = this.getPingSources('bg', `${Date.now()}`);
        for (const bgUrl of sources) {
          try {
            const res = await fetch(bgUrl, {
              signal,
              cache: 'no-store',
            });
            if (res.ok) {
              const rtt = Math.max(Math.round(performance.now() - start), 1);
              onPing(rtt);
              break;
            }
          } catch {
            // try next
          }
        }
        await new Promise((r) => setTimeout(r, 380));
      }
    };
    run();
    return () => {
      active = false;
    };
  }

  private async runDownloadStream(
    signal: AbortSignal,
    multiStream: boolean,
    testStartTime: number,
    samples: MetricSample[],
    callbacks: SpeedTestCallbacks,
    idlePing: number,
    loadedPings: number[],
    logTech: (m: string) => void
  ): Promise<{ average: number; peak: number }> {
    const streamCount = multiStream ? 8 : 1;
    const totalDurationMs = 8500;
    const warmupDurationMs = 1500; // 1.5s warm-up window to bypass TCP ramp-up burst
    const downloadStartTime = performance.now();

    let totalBytesReceived = 0;
    let bytesAtWarmupEnd = 0;
    let warmupPassed = false;

    let previousSampleBytes = 0;
    let previousSampleTime = downloadStartTime;
    let smoothedSpeed = 0;
    let peakSpeed = 0;
    const speedHistory: number[] = [];

    const streamPromises = Array.from({ length: streamCount }).map(async (_, idx) => {
      let sourceIdx = 0;
      while (performance.now() - downloadStartTime < totalDurationMs && !signal.aborted) {
        const sources = this.getDownloadSources(idx);
        const dlUrl = sources[sourceIdx % sources.length];
        try {
          const res = await fetch(dlUrl, {
            signal,
            cache: 'no-store',
          });

          if (!res.ok) {
            sourceIdx = (sourceIdx + 1) % sources.length;
            await new Promise((r) => setTimeout(r, 60));
            continue;
          }

          if (res.body && typeof res.body.getReader === 'function') {
            const reader = res.body.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done || !value) break;

                totalBytesReceived += value.length;

                const now = performance.now();
                if (now - downloadStartTime >= totalDurationMs || signal.aborted) {
                  try { await reader.cancel(); } catch {}
                  break;
                }
              }
            } catch {
              // stream interrupted, continue loop
            }
          } else {
            const buf = await res.arrayBuffer();
            totalBytesReceived += buf.byteLength;
          }
        } catch {
          if (signal.aborted) break;
          sourceIdx = (sourceIdx + 1) % sources.length;
          await new Promise((r) => setTimeout(r, 60));
        }
      }
    });

    const sampleInterval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - downloadStartTime;

      if (!warmupPassed && elapsed >= warmupDurationMs) {
        warmupPassed = true;
        bytesAtWarmupEnd = totalBytesReceived;
        logTech(`Download warm-up kết thúc (1.5s), bắt đầu tính toán tốc độ ổn định...`);
      }

      const timeDeltaSec = (now - previousSampleTime) / 1000;
      if (timeDeltaSec > 0.08) {
        const bytesDelta = totalBytesReceived - previousSampleBytes;
        const instantMbps = (bytesDelta * 8) / (timeDeltaSec * 1_000_000);

        smoothedSpeed = smoothedSpeed === 0
          ? instantMbps
          : smoothedSpeed * 0.6 + instantMbps * 0.4;

        if (warmupPassed) {
          speedHistory.push(smoothedSpeed);
          if (smoothedSpeed > peakSpeed) {
            peakSpeed = smoothedSpeed;
          }
        }

        previousSampleBytes = totalBytesReceived;
        previousSampleTime = now;

        const currentLoadedPing = loadedPings.length > 0
          ? loadedPings[loadedPings.length - 1]
          : idlePing;

        // Compute running average
        let currentAvg = 0;
        if (warmupPassed) {
          const postWarmupDurationSec = (now - (downloadStartTime + warmupDurationMs)) / 1000;
          const postWarmupBytes = totalBytesReceived - bytesAtWarmupEnd;
          if (postWarmupDurationSec > 0.1) {
            currentAvg = Number(((postWarmupBytes * 8) / (postWarmupDurationSec * 1_000_000)).toFixed(1));
          }
        } else {
          currentAvg = Number(smoothedSpeed.toFixed(1));
        }

        const stats: SpeedMetricData = {
          current: Number(smoothedSpeed.toFixed(1)),
          average: currentAvg || Number(smoothedSpeed.toFixed(1)),
          peak: Number(peakSpeed.toFixed(1)),
          isMeasuring: true,
          isDone: false,
        };

        callbacks.onDownloadUpdate(stats, currentLoadedPing);
        soundEffects.updateHumSpeed(smoothedSpeed, 400);

        const sampleTime = Number(((now - testStartTime) / 1000).toFixed(2));
        const sample: MetricSample = {
          time: sampleTime,
          speed: Number(smoothedSpeed.toFixed(1)),
          ping: currentLoadedPing,
          phase: 'download',
        };
        samples.push(sample);
        callbacks.onSample(sample);

        // Progress 20% -> 50%
        const dlProgress = Math.min(20 + Math.round((elapsed / totalDurationMs) * 30), 50);
        callbacks.onProgress(dlProgress, `Đang tải xuống: ${smoothedSpeed.toFixed(1)} Mbps (Đỉnh: ${peakSpeed.toFixed(1)} Mbps)`);
      }
    }, 100);

    await Promise.all(streamPromises);
    clearInterval(sampleInterval);

    // Final Post-Warmup Average Calculation
    const totalTestSec = (performance.now() - downloadStartTime) / 1000;
    const postWarmupSec = Math.max(totalTestSec - (warmupDurationMs / 1000), 1);
    const postWarmupBytes = Math.max(totalBytesReceived - bytesAtWarmupEnd, 1);
    const finalAvg = Number(((postWarmupBytes * 8) / (postWarmupSec * 1_000_000)).toFixed(1));
    const finalPeak = Math.max(Number(peakSpeed.toFixed(1)), finalAvg);

    callbacks.onDownloadUpdate({
      current: finalAvg,
      average: finalAvg,
      peak: finalPeak,
      isMeasuring: false,
      isDone: true,
    }, loadedPings[loadedPings.length - 1] || idlePing);

    return { average: finalAvg, peak: finalPeak };
  }

  private async runUploadStream(
    signal: AbortSignal,
    multiStream: boolean,
    testStartTime: number,
    samples: MetricSample[],
    callbacks: SpeedTestCallbacks,
    idlePing: number,
    loadedPings: number[],
    logTech: (m: string) => void
  ): Promise<{ average: number; peak: number }> {
    const streamCount = multiStream ? 6 : 1;
    const totalDurationMs = 7500;
    const warmupDurationMs = 1200;
    const uploadStartTime = performance.now();

    // Payload 10MB ngẫu nhiên (không nén được), gửi bằng XHR để đếm byte theo thời gian thực
    const chunkSize = 10 * 1000 * 1000;
    const payload = new Uint8Array(chunkSize);
    for (let i = 0; i < chunkSize; i += 65536) {
      crypto.getRandomValues(payload.subarray(i, Math.min(i + 65536, chunkSize)));
    }

    let totalBytesUploaded = 0;
    let bytesAtWarmupEnd = 0;
    let warmupPassed = false;

    let previousSampleBytes = 0;
    let previousSampleTime = uploadStartTime;
    let smoothedSpeed = 0;
    let peakSpeed = 0;

    const uploadOnce = (url: string): Promise<void> =>
      new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        let lastLoaded = 0;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearInterval(deadlineTimer);
          signal.removeEventListener('abort', onAbort);
          resolve();
        };
        const onAbort = () => { try { xhr.abort(); } catch {} finish(); };
        // Hết giờ đo thì cắt luôn request đang bay
        const deadlineTimer = setInterval(() => {
          if (performance.now() - uploadStartTime >= totalDurationMs) onAbort();
        }, 50);
        signal.addEventListener('abort', onAbort);

        xhr.open('POST', url);
        xhr.upload.onprogress = (e) => {
          totalBytesUploaded += e.loaded - lastLoaded;
          lastLoaded = e.loaded;
        };
        xhr.onload = finish;
        xhr.onerror = finish;
        xhr.onabort = finish;
        xhr.ontimeout = finish;
        xhr.send(payload);
      });

    const streamPromises = Array.from({ length: streamCount }).map(async (_, idx) => {
      while (performance.now() - uploadStartTime < totalDurationMs && !signal.aborted) {
        await uploadOnce(this.getUploadSources(idx)[0]);
      }
    });

    const sampleInterval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - uploadStartTime;

      if (!warmupPassed && elapsed >= warmupDurationMs) {
        warmupPassed = true;
        bytesAtWarmupEnd = totalBytesUploaded;
        logTech(`Upload warm-up kết thúc (1.2s), bắt đầu đo băng thông thực...`);
      }

      const timeDeltaSec = (now - previousSampleTime) / 1000;
      if (timeDeltaSec > 0.08) {
        const bytesDelta = totalBytesUploaded - previousSampleBytes;
        const instantMbps = (bytesDelta * 8) / (timeDeltaSec * 1_000_000);

        smoothedSpeed = smoothedSpeed === 0
          ? instantMbps
          : smoothedSpeed * 0.6 + instantMbps * 0.4;

        if (warmupPassed && smoothedSpeed > peakSpeed) {
          peakSpeed = smoothedSpeed;
        }

        previousSampleBytes = totalBytesUploaded;
        previousSampleTime = now;

        const currentLoadedPing = loadedPings.length > 0
          ? loadedPings[loadedPings.length - 1]
          : idlePing;

        let currentAvg = 0;
        if (warmupPassed) {
          const postWarmupDurationSec = (now - (uploadStartTime + warmupDurationMs)) / 1000;
          const postWarmupBytes = totalBytesUploaded - bytesAtWarmupEnd;
          if (postWarmupDurationSec > 0.1) {
            currentAvg = Number(((postWarmupBytes * 8) / (postWarmupDurationSec * 1_000_000)).toFixed(1));
          }
        } else {
          currentAvg = Number(smoothedSpeed.toFixed(1));
        }

        const stats: SpeedMetricData = {
          current: Number(smoothedSpeed.toFixed(1)),
          average: currentAvg || Number(smoothedSpeed.toFixed(1)),
          peak: Number(peakSpeed.toFixed(1)),
          isMeasuring: true,
          isDone: false,
        };

        callbacks.onUploadUpdate(stats, currentLoadedPing);
        soundEffects.updateHumSpeed(smoothedSpeed, 300);

        const sampleTime = Number(((now - testStartTime) / 1000).toFixed(2));
        const sample: MetricSample = {
          time: sampleTime,
          speed: Number(smoothedSpeed.toFixed(1)),
          ping: currentLoadedPing,
          phase: 'upload',
        };
        samples.push(sample);
        callbacks.onSample(sample);

        // Progress 50% -> 80%
        const ulProgress = Math.min(50 + Math.round((elapsed / totalDurationMs) * 30), 80);
        callbacks.onProgress(ulProgress, `Đang tải lên: ${smoothedSpeed.toFixed(1)} Mbps (Đỉnh: ${peakSpeed.toFixed(1)} Mbps)`);
      }
    }, 100);

    await Promise.all(streamPromises);
    clearInterval(sampleInterval);

    const totalTestSec = (performance.now() - uploadStartTime) / 1000;
    const postWarmupSec = Math.max(totalTestSec - (warmupDurationMs / 1000), 1);
    const postWarmupBytes = Math.max(totalBytesUploaded - bytesAtWarmupEnd, 1);
    const finalAvg = Number(((postWarmupBytes * 8) / (postWarmupSec * 1_000_000)).toFixed(1));
    const finalPeak = Math.max(Number(peakSpeed.toFixed(1)), finalAvg);

    callbacks.onUploadUpdate({
      current: finalAvg,
      average: finalAvg,
      peak: finalPeak,
      isMeasuring: false,
      isDone: true,
    }, loadedPings[loadedPings.length - 1] || idlePing);

    return { average: finalAvg, peak: finalPeak };
  }

  private computeBufferbloat(
    idlePing: number,
    dlLoadedPing: number,
    ulLoadedPing: number
  ): BufferbloatReport {
    const downloadDelta = Math.max(dlLoadedPing - idlePing, 0);
    const uploadDelta = Math.max(ulLoadedPing - idlePing, 0);
    const maxDelta = Math.max(downloadDelta, uploadDelta);

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
    let verdictVi = '';
    let verdictEn = '';
    let impactVi = '';
    let impactEn = '';

    if (maxDelta <= 5) {
      grade = 'A+';
      verdictVi = 'Hạng A+ (Tuyệt đối không có Bufferbloat, độ trễ tăng ≤ 5ms)';
      verdictEn = 'Grade A+ (Flawless zero queue bufferbloat, delta ≤ 5ms)';
      impactVi = 'Đường truyền tối ưu tuyệt đối. Chơi game hoặc gọi video hoàn toàn không bị giật lag dù người khác đang tải phim 4K nặng.';
      impactEn = 'Absolute peak performance. Gaming and calls stay responsive even during heavy background saturation.';
    } else if (maxDelta <= 18) {
      grade = 'A';
      verdictVi = 'Hạng A (Rất tốt, độ trễ tăng không đáng kể, delta ≤ 18ms)';
      verdictEn = 'Grade A (Great stability, minimal queue delay, delta ≤ 18ms)';
      impactVi = 'Hàng đợi router xử lý mượt mà. Đạt chuẩn cho hộ gia đình và văn phòng nhiều thiết bị xem video, họp trực tuyến cùng lúc.';
      impactEn = 'Minimal latency increase under load. Excellent for multi-user households with simultaneous 4K streams and gaming.';
    } else if (maxDelta <= 45) {
      grade = 'B';
      verdictVi = 'Hạng B (Khá tốt, có trễ nhẹ khi tải nặng, delta ≤ 45ms)';
      verdictEn = 'Grade B (Good, slight latency increase under load, delta ≤ 45ms)';
      impactVi = 'Có hiện tượng dồn hàng đợi nhẹ khi tải file lớn. Game thủ thi đấu eSports có thể cảm nhận delay nhẹ, xem phim và gọi thoại vẫn tốt.';
      impactEn = 'Slight latency increase during heavy downloads. Competitive gamers might experience slight tick delays.';
    } else if (maxDelta <= 95) {
      grade = 'C';
      verdictVi = 'Hạng C (Trung bình, nghẽn hàng đợi rõ rệt, delta ≤ 95ms)';
      verdictEn = 'Grade C (Fair, noticeable queue congestion, delta ≤ 95ms)';
      impactVi = 'Độ trễ tăng rõ rệt khi tải file. Gọi Zoom hoặc Zalo có thể bị méo tiếng nếu trong mạng có máy đang download hoặc cập nhật game.';
      impactEn = 'Noticeable lag spikes under load. Video calls might stutter if someone else on your network downloads.';
    } else if (maxDelta <= 180) {
      grade = 'D';
      verdictVi = 'Hạng D (Kém, hàng đợi router quá tải nghiêm trọng, delta ≤ 180ms)';
      verdictEn = 'Grade D (Poor, severe router queue overflow, delta ≤ 180ms)';
      impactVi = 'Bộ đệm router tràn khiến ping nhảy vọt thêm hàng trăm ms, gây giật đứng hình trong game và rớt cuộc gọi thoại.';
      impactEn = 'Router queue overflows. Gaming pings spike by hundreds of milliseconds, causing packet drops and freeze.';
    } else {
      grade = 'F';
      verdictVi = 'Hạng F (Rất kém, Bufferbloat nghiêm trọng, router thiếu SQM)';
      verdictEn = 'Grade F (Critical, severe bufferbloat, router lacks SQM)';
      impactVi = 'Router không quản lý hàng đợi (thiếu SQM / Cake / FQ-CoDel). Cần bật tính năng Smart Queue Management (SQM) hoặc nâng cấp router.';
      impactEn = 'Severe bufferbloat. Enabling SQM (Smart Queue Management) or Cake/FQ-Codel on your router is strongly recommended.';
    }

    return {
      idlePing,
      downloadLoadedPing: dlLoadedPing,
      uploadLoadedPing: ulLoadedPing,
      downloadDelta,
      uploadDelta,
      grade,
      verdictVi,
      verdictEn,
      impactVi,
      impactEn,
    };
  }

  private computeDiagnostics(
    download: number,
    upload: number,
    ping: number,
    jitter: number,
    loss: number,
    bufferbloat: BufferbloatReport,
    technicianLogs: string[]
  ): NetworkDiagnostics {
    // 1. Overall Score (0 - 100)
    let score = 100;

    // Ping penalties
    if (ping > 25 && ping <= 50) score -= (ping - 25) * 0.4;
    else if (ping > 50) score -= 10 + (ping - 50) * 0.6;

    // Jitter penalties
    if (jitter > 3) score -= (jitter - 3) * 2.5;

    // Loss penalties
    if (loss > 0) score -= loss * 12;

    // Bandwidth penalties
    if (download < 30) score -= (30 - download) * 0.8;
    if (upload < 15) score -= (15 - upload) * 0.7;

    // Bufferbloat penalties
    if (bufferbloat.grade === 'B') score -= 5;
    else if (bufferbloat.grade === 'C') score -= 14;
    else if (bufferbloat.grade === 'D') score -= 22;
    else if (bufferbloat.grade === 'F') score -= 32;

    score = Math.max(10, Math.min(100, Math.round(score)));

    let grade: 'S' | 'A' | 'B' | 'C' | 'D' = 'B';
    if (score >= 90) grade = 'S';
    else if (score >= 80) grade = 'A';
    else if (score >= 65) grade = 'B';
    else if (score >= 45) grade = 'C';
    else grade = 'D';

    // 2. Ratings per category
    const internetRating = score >= 85 ? 'Rất tốt' : score >= 70 ? 'Tốt' : score >= 50 ? 'Trung bình' : 'Kém';
    const internetStatus = score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';

    const wifiRating = jitter <= 4 && loss === 0 ? 'Tốt & Ổn định' : loss > 1 || jitter > 8 ? 'Chập chờn / Nhiễu sóng' : 'Khá tốt';
    const wifiStatus = (jitter <= 4 && loss === 0) ? 'good' : (loss > 1 || jitter > 8) ? 'poor' : 'fair';

    const gamingRating = ping <= 25 && jitter <= 3 && loss === 0 && (bufferbloat.grade === 'A+' || bufferbloat.grade === 'A')
      ? 'Chuẩn eSports Chuyên Nghiệp'
      : ping <= 45 && jitter <= 5
      ? 'Tốt & Mượt Mà'
      : 'Độ Trễ Cao / Dễ Gián Đoạn';
    const gamingStatus = (ping <= 30 && jitter <= 3 && loss === 0) ? 'good' : ping <= 55 ? 'fair' : 'poor';

    const videoCallRating = upload >= 15 && jitter <= 4 && loss === 0
      ? 'Rất Tốt (HD Mượt)'
      : upload >= 8
      ? 'Tốt (Đạt chuẩn họp Zoom/Meet)'
      : 'Có Thể Bị Rè / Méo Tiếng';
    const videoCallStatus = (upload >= 15 && jitter <= 4 && loss === 0) ? 'good' : upload >= 8 ? 'fair' : 'poor';

    const streamRating = download >= 100
      ? 'Xuất Sắc (Xem 4K / 8K HDR Không Chờ)'
      : download >= 30
      ? 'Tốt (Xem 4K 60fps Mượt)'
      : 'Khá (Phù hợp 1080p)';
    const streamStatus = download >= 30 ? 'good' : 'fair';

    // 3. Probable causes for issues
    const probableCauses: string[] = [];
    if (bufferbloat.grade === 'C' || bufferbloat.grade === 'D' || bufferbloat.grade === 'F') {
      probableCauses.push(
        'Bufferbloat cao: Router thiếu tính năng kiểm soát hàng đợi thông minh (SQM - Smart Queue Management) hoặc có nhiều thiết bị đang ngốn băng thông nền.'
      );
    }
    if (ping > 45) {
      probableCauses.push(
        'Ping cao: Thiết bị có thể đang kết nối qua Wi-Fi 2.4GHz thay vì 5GHz/cáp LAN, hoặc trạm phát Wi-Fi cách xa vị trí đo.'
      );
    }
    if (jitter > 5) {
      probableCauses.push(
        'Jitter cao: Sóng Wi-Fi bị nhiễu kênh (Channel Interference) từ các mạng lân cận hoặc thiết bị Bluetooth.'
      );
    }
    if (loss > 0) {
      probableCauses.push(
        'Rớt gói tin (Packet Loss): Cáp mạng LAN bị gãy gập/tiếp xúc kém, hoặc sóng Wi-Fi bị vật cản che khuất.'
      );
    }
    if (download < 30) {
      probableCauses.push(
        'Tốc độ tải xuống thấp hơn dự kiến: Kiểm tra xem có ứng dụng tải ngầm (Windows Update, Torrent, OneDrive) hoặc giới hạn băng thông router.'
      );
    }

    if (probableCauses.length === 0) {
      probableCauses.push('Đường truyền mạng hoàn hảo, thông số kỹ thuật tối ưu không có điểm nghẽn.');
    }

    return {
      score,
      grade,
      internet: { rating: internetRating, status: internetStatus, note: `Băng thông ${(download + upload).toFixed(0)} Mbps hai chiều` },
      wifi: { rating: wifiRating, status: wifiStatus, note: `Jitter ${jitter}ms · Rớt gói ${loss}%` },
      gaming: { rating: gamingRating, status: gamingStatus, note: `Ping ${ping}ms · Bufferbloat ${bufferbloat.grade}` },
      videoCall: { rating: videoCallRating, status: videoCallStatus, note: `Tải lên ${upload} Mbps ổn định` },
      streaming: { rating: streamRating, status: streamStatus, note: `Tải xuống ${download} Mbps` },
      probableCauses,
      technicianLogs,
    };
  }

  private computeQoE(
    download: number,
    upload: number,
    ping: number,
    jitter: number,
    loss: number,
    bufferGrade: string
  ): QoEItem[] {
    let gamingScore = 100;
    if (ping > 50) gamingScore -= (ping - 50) * 0.8;
    if (ping > 25 && ping <= 50) gamingScore -= (ping - 25) * 0.4;
    if (jitter > 3) gamingScore -= (jitter - 3) * 3;
    if (loss > 0) gamingScore -= loss * 12;
    if (bufferGrade === 'C') gamingScore -= 8;
    if (bufferGrade === 'D') gamingScore -= 18;
    if (bufferGrade === 'F') gamingScore -= 30;
    gamingScore = Math.max(10, Math.min(100, Math.round(gamingScore)));

    const getGrade = (s: number): 'S' | 'A' | 'B' | 'C' | 'D' => {
      if (s >= 90) return 'S';
      if (s >= 80) return 'A';
      if (s >= 65) return 'B';
      if (s >= 45) return 'C';
      return 'D';
    };

    let streamScore = 100;
    if (download < 25) streamScore -= (25 - download) * 2.5;
    if (download >= 25 && download < 80) streamScore -= 10;
    if (loss > 0.5) streamScore -= loss * 8;
    if (jitter > 8) streamScore -= 8;
    streamScore = Math.max(15, Math.min(100, Math.round(streamScore)));

    let confScore = 100;
    if (upload < 8) confScore -= (8 - upload) * 6;
    if (ping > 45) confScore -= (ping - 45) * 0.6;
    if (jitter > 5) confScore -= (jitter - 5) * 4;
    if (loss > 0) confScore -= loss * 15;
    confScore = Math.max(15, Math.min(100, Math.round(confScore)));

    let cloudScore = 100;
    if (upload < 20) cloudScore -= (20 - upload) * 2;
    if (download < 40) cloudScore -= (40 - download) * 1;
    if (loss > 1) cloudScore -= loss * 5;
    cloudScore = Math.max(20, Math.min(100, Math.round(cloudScore)));

    return [
      {
        service: 'gaming',
        nameVi: 'Game Đối Kháng & eSports (Valorant, CS2, LOL)',
        nameEn: 'Competitive eSports (Valorant, CS2, LOL)',
        score: gamingScore,
        grade: getGrade(gamingScore),
        statusVi: gamingScore >= 85 ? 'Chuẩn Thi Đấu Chuyên Nghiệp' : gamingScore >= 70 ? 'Mượt Mà & Ổn Định' : 'Có Thể Bị Giật Ping / Delay',
        statusEn: gamingScore >= 85 ? 'Tournament Ready' : gamingScore >= 70 ? 'Smooth & Stable' : 'Noticeable Tick Delay',
        detailsVi: `Ping ${ping}ms · Jitter ${jitter}ms · Mất gói ${loss}%`,
        detailsEn: `Ping ${ping}ms · Jitter ${jitter}ms · Packet loss ${loss}%`,
      },
      {
        service: 'streaming',
        nameVi: 'Xem Phim 4K / 8K HDR (Netflix, YouTube)',
        nameEn: '4K / 8K HDR Streaming (Netflix, YouTube)',
        score: streamScore,
        grade: getGrade(streamScore),
        statusVi: download >= 100 ? 'Sẵn Sàng 8K Không Cần Chờ Buffer' : download >= 30 ? 'Phát Mượt 4K HDR 60fps' : 'Chỉ Phù Hợp Full HD 1080p',
        statusEn: download >= 100 ? 'Instant 8K Ultra HDR' : download >= 30 ? 'Smooth 4K HDR 60fps' : 'Standard 1080p Capable',
        detailsVi: `Tải xuống ${download} Mbps · Băng thông ổn định`,
        detailsEn: `Download ${download} Mbps · Stable bitrate`,
      },
      {
        service: 'conference',
        nameVi: 'Hội Nghị & Gọi Video (Zoom, Teams, Meet)',
        nameEn: 'Video Conferencing (Zoom, Teams, Meet)',
        score: confScore,
        grade: getGrade(confScore),
        statusVi: confScore >= 85 ? 'Âm Thanh & Hình Ảnh HD Hoàn Hảo' : 'Chất Lượng Bình Thường',
        statusEn: confScore >= 85 ? 'Crystal Clear HD Audio & Video' : 'Normal Conference Quality',
        detailsVi: `Tải lên ${upload} Mbps · Độ lệch pha thấp`,
        detailsEn: `Upload ${upload} Mbps · Low packet drift`,
      },
      {
        service: 'cloud',
        nameVi: 'Lưu Trữ Đám Mây & Sao Lưu Dữ Liệu Lớn',
        nameEn: 'Cloud Backup & High-Volume Data Transfers',
        score: cloudScore,
        grade: getGrade(cloudScore),
        statusVi: upload >= 50 ? 'Truyền Tệp Dung Lượng Lớn Siêu Tốc' : 'Tốc Độ Đồng Bộ Tiêu Chuẩn',
        statusEn: upload >= 50 ? 'High-Speed Cloud Sync' : 'Standard Sync Rate',
        detailsVi: `Băng thông 2 chiều ${(download + upload).toFixed(0)} Mbps`,
        detailsEn: `Total bidirectional ${(download + upload).toFixed(0)} Mbps`,
      },
    ];
  }
}

export const speedEngine = new SpeedTestRunner();
