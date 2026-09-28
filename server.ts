import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Ping endpoint for accurate RTT / jitter
  app.get('/api/speedtest/ping', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    
    res.json({
      timestamp: Date.now(),
      serverRegion: 'Google Cloud Asia-Southeast (Low Latency Node)',
      clientIp,
    });
  });

  // Client IP & ISP detection endpoint
  app.get('/api/speedtest/client-info', async (req, res) => {
    try {
      const forwarded = req.headers['x-forwarded-for'] as string;
      const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket.remoteAddress || '127.0.0.1');

      let ispInfo = {
        ip: clientIp,
        city: 'Ho Chi Minh City',
        region: 'VN',
        country: 'Vietnam',
        countryCode: 'VN',
        isp: 'Viettel Telecom',
        org: 'Viettel Group',
        asn: 'AS7552'
      };

      // Query geo info if it's a public IP
      if (clientIp && !clientIp.startsWith('127.') && !clientIp.startsWith('10.') && !clientIp.startsWith('192.168.') && !clientIp.startsWith('::1')) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2200);
          const response = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,countryCode,regionName,city,isp,org,as,query`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = await response.json();
            if (data && data.status === 'success') {
              ispInfo = {
                ip: data.query || clientIp,
                city: data.city || 'Ho Chi Minh City',
                region: data.regionName || 'Vietnam',
                country: data.country || 'Vietnam',
                countryCode: data.countryCode || 'VN',
                isp: data.isp || 'Local ISP',
                org: data.org || data.isp || 'Broadband Network',
                asn: data.as || 'AS-Local'
              };
            }
          }
        } catch {
          // Keep defaults
        }
      }

      res.json(ispInfo);
    } catch {
      res.status(500).json({ error: 'Failed to retrieve network info' });
    }
  });

  // Pre-generate 1MB high-entropy pseudo-random buffer to prevent compression cheating
  const chunk1MB = crypto.randomBytes(1024 * 1024);

  // High-speed chunked download endpoint
  app.get('/api/speedtest/download', (req, res) => {
    const sizeMB = Math.min(Math.max(parseInt(req.query.size as string, 10) || 10, 1), 60);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', (sizeMB * 1024 * 1024).toString());
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let written = 0;
    function writeNext() {
      let ok = true;
      while (written < sizeMB && ok) {
        written++;
        if (written === sizeMB) {
          res.end(chunk1MB);
          return;
        } else {
          ok = res.write(chunk1MB);
        }
      }
      if (written < sizeMB) {
        res.once('drain', writeNext);
      }
    }
    writeNext();
  });

  // High-speed upload sink endpoint
  app.post('/api/speedtest/upload', (req, res) => {
    let bytesReceived = 0;
    const startTime = Date.now();

    req.on('data', (chunk: Buffer) => {
      bytesReceived += chunk.length;
    });

    req.on('end', () => {
      const durationMs = Math.max(Date.now() - startTime, 1);
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.json({
        bytesReceived,
        durationMs,
        speedMbps: Number(((bytesReceived * 8) / (durationMs / 1000) / (1024 * 1024)).toFixed(2))
      });
    });

    req.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
  });

  // Enterprise AI Network Assessment & Executive Summary endpoint
  app.post('/api/speedtest/ai-report', async (req, res) => {
    try {
      const {
        downloadSpeed = 0,
        uploadSpeed = 0,
        ping = 0,
        jitter = 0,
        packetLoss = 0,
        loadedDownloadPing = 0,
        loadedUploadPing = 0,
        bufferbloatGrade = 'A',
        isp = 'Nhà mạng nội địa',
        city = 'Việt Nam',
        companyName = 'Văn phòng Doanh nghiệp',
      } = req.body || {};

      const dl = Number(downloadSpeed);
      const ul = Number(uploadSpeed);
      const rtt = Number(ping);
      const jit = Number(jitter);
      const loss = Number(packetLoss);

      // Calculate baseline capacity
      let estimatedStaff = '10 - 20 nhân sự';
      if (dl >= 500 && ul >= 300) {
        estimatedStaff = '80 - 150+ nhân sự';
      } else if (dl >= 250 && ul >= 150) {
        estimatedStaff = '50 - 80 nhân sự';
      } else if (dl >= 100 && ul >= 70) {
        estimatedStaff = '25 - 50 nhân sự';
      } else if (dl >= 50 && ul >= 30) {
        estimatedStaff = '15 - 25 nhân sự';
      }

      const prompt = `Bạn là Trợ lý Chuyên gia Hạ tầng Mạng Doanh Nghiệp (Enterprise Network Consultant) tại Việt Nam.
Hãy phân tích các chỉ số đo lường đường truyền Internet văn phòng sau:
- Công ty/Đơn vị: ${companyName}
- Nhà mạng (ISP): ${isp} (${city})
- Tốc độ Tải xuống (Download): ${dl.toFixed(1)} Mbps
- Tốc độ Tải lên (Upload): ${ul.toFixed(1)} Mbps
- Độ trễ nhàn rỗi (Ping RTT): ${rtt} ms
- Độ trễ khi tải nặng (Loaded Download / Upload): ${loadedDownloadPing} ms / ${loadedUploadPing} ms
- Đánh giá nghẽn hàng đợi (Bufferbloat): ${bufferbloatGrade}
- Biến thiên độ trễ (Jitter): ${jit} ms
- Tỉ lệ rớt gói (Packet Loss): ${loss}%

Yêu cầu xuất JSON duy nhất (không bọc markdown backtick hay bất cứ ký tự nào khác) với cấu trúc sau:
{
  "executiveSummary": "1 đến 2 câu súc tích, khách quan gửi Ban Giám Đốc/Lãnh đạo, giải thích bằng ngôn ngữ quản trị doanh nghiệp xem đường truyền hôm nay có đạt chuẩn vận hành công ty hay không.",
  "capacityVerdict": "Đoạn văn ngắn nhận xét sức tải văn phòng (khoảng ${estimatedStaff}) và khả năng đáp ứng đồng thời các tác vụ làm việc.",
  "workplacePillars": {
    "videoConference": "Nhận xét độ ổn định khi họp Zoom/Google Meet/MS Teams nhiều người cùng lúc",
    "cloudErp": "Nhận xét khả năng đồng bộ file Google Drive/OneDrive, phần mềm kế toán, ERP/CRM",
    "remoteVpn": "Nhận xét độ mượt của VPN, Remote Desktop, UltraViewer kết nối chi nhánh"
  },
  "ispTicket": "Một mẫu tin nhắn kỹ thuật ngắn gọn, lịch sự, chuẩn mực và đanh thép để IT gửi tổng đài nhà mạng ${isp} đối soát hoặc yêu cầu tối ưu đường truyền (nếu mạng có chỉ số xấu như loss, bufferbloat cao, jitter lớn hoặc băng thông không đạt cam kết).",
  "itAdvice": [
    "Khuyến nghị kỹ thuật số 1 cho IT nội bộ",
    "Khuyến nghị kỹ thuật số 2 cho IT nội bộ"
  ]
}`;

      // Try Gemini if apiKey exists
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          });

          const rawText = response.text?.trim() || '';
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
          const parsed = JSON.parse(cleaned);
          return res.json({ success: true, source: 'ai', ...parsed });
        } catch (err: any) {
          console.warn('Gemini generation fallback:', err?.message);
        }
      }

      // High quality deterministic fallback
      const isGood = dl >= 80 && ul >= 50 && rtt <= 30 && loss === 0;
      const isFair = dl >= 30 && ul >= 20 && rtt <= 60 && loss <= 1;

      const fallback = {
        success: true,
        source: 'deterministic',
        executiveSummary: isGood
          ? `Đường truyền ${isp} tại văn phòng hoạt động xuất sắc (${dl.toFixed(0)} Mbps Download / ${ul.toFixed(0)} Mbps Upload, Ping ${rtt}ms), đảm bảo toàn bộ hệ thống vận hành trơn tru.`
          : isFair
          ? `Đường truyền ${isp} đáp ứng mức cơ bản (${dl.toFixed(0)} Mbps), tuy nhiên độ trễ ${rtt}ms và biến thiên ${jit}ms cần được IT giám sát trong giờ cao điểm.`
          : `Cảnh báo: Đường truyền ${isp} có dấu hiệu suy hao (${dl.toFixed(0)} Mbps, Packet loss ${loss}%), cần liên hệ kỹ thuật nhà mạng kiểm tra tuyến cáp quang.`,
        capacityVerdict: `Hạ tầng băng thông hiện tại đáp ứng tối ưu cho quy mô ${estimatedStaff} làm việc đồng thời không bị nghẽn mạng.`,
        workplacePillars: {
          videoConference: isGood
            ? 'Rất tốt: Cho phép tổ chức đồng thời 10 - 20 cuộc họp trực tuyến HD không giật hình hay rè tiếng.'
            : 'Khá: Họp trực tuyến cơ bản ổn định, khuyến nghị tắt video nền khi phòng họp đông người.',
          cloudErp: isGood
            ? 'Tối ưu: Tải lên và đồng bộ file hợp đồng, dữ liệu M365/Google Drive tức thì.'
            : 'Bình thường: Thao tác file dung lượng lớn (>500MB) có thể mất vài phút.',
          remoteVpn: isGood
            ? 'Mượt mà: Độ trễ thấp, kết nối VPN chi nhánh và Remote Desktop phản hồi chuột phím tức thì.'
            : 'Chấp nhận được: Có thể có độ trễ nhẹ khi điều khiển máy tính từ xa qua mạng khác tỉnh.'
        },
        ispTicket: `Kính gửi Bộ phận Kỹ thuật & Hỗ trợ Doanh nghiệp ${isp},\nĐơn vị chúng tôi kiểm tra chất lượng kết nối văn phòng vào lúc ${new Date().toLocaleTimeString('vi-VN')} ngày ${new Date().toLocaleDateString('vi-VN')}:\n- Băng thông Download/Upload: ${dl.toFixed(1)} / ${ul.toFixed(1)} Mbps\n- Độ trễ Ping: ${rtt} ms (Jitter: ${jit} ms, Packet Loss: ${loss}%)\n- Đánh giá tải nặng (Bufferbloat): Grade ${bufferbloatGrade}\nĐề nghị quý nhà mạng kiểm tra port quang tại OLT/Tủ cáp và định tuyến quốc tế để đảm bảo SLA cam kết hợp đồng. Trân trọng!`,
        itAdvice: [
          'Kích hoạt Smart Queue Management (SQM) hoặc giới hạn băng thông khách (Guest Wi-Fi) để chống nghẽn giờ cao điểm.',
          'Ưu tiên cắm dây mạng LAN Cat6 cho các máy trạm thiết yếu, phòng họp trực tuyến và máy chủ kế toán.'
        ]
      };

      return res.json(fallback);
    } catch {
      return res.status(500).json({ error: 'Failed to generate enterprise report' });
    }
  });

  // Production static files or Vite dev middleware
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Speedtest server listening on port ${PORT}`);
  });
}

startServer();
