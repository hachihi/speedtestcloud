// Cloudflare Pages Function: POST /api/speedtest/ai-report
// Cấu hình biến môi trường (Settings > Variables and Secrets): GEMINI_API_KEY (tuỳ chọn), GEMINI_MODEL (tuỳ chọn)

interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

interface Ctx {
  request: Request;
  env: Env;
}

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });

export const onRequestOptions = async () => new Response(null, { status: 204, headers: CORS });

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  try {
    const body: any = await request.json().catch(() => ({}));
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
    } = body || {};

    const dl = Number(downloadSpeed);
    const ul = Number(uploadSpeed);
    const rtt = Number(ping);
    const jit = Number(jitter);
    const loss = Number(packetLoss);

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

    const isOptimal = dl >= 80 && ul >= 50 && rtt <= 35 && loss === 0;
    const isFair = dl >= 30 && ul >= 20 && rtt <= 60 && loss <= 1;

    // Deterministic fallback response
    const fallbackResponse = {
      success: true,
      source: 'deterministic',
      executiveSummary: isOptimal
        ? `Đường truyền ${isp} tại văn phòng hoạt động xuất sắc (${dl.toFixed(0)} Mbps Download / ${ul.toFixed(0)} Mbps Upload, Ping ${rtt}ms), đảm bảo toàn bộ hệ thống vận hành trơn tru.`
        : isFair
        ? `Đường truyền ${isp} đáp ứng mức cơ bản, khuyến nghị IT theo dõi các khung giờ họp cao điểm.`
        : `Cảnh báo: Đường truyền ${isp} có suy hao, cần báo kỹ thuật nhà mạng rà soát.`,
      capacityVerdict: `Băng thông hiện tại đáp ứng tối ưu cho quy mô ${estimatedStaff} làm việc đồng thời.`,
      workplacePillars: {
        videoConference: isOptimal ? 'Rất tốt: 15-30 cuộc họp trực tuyến HD đồng thời không delay' : 'Khá: Họp trực tuyến mượt, hạn chế bật camera 4K',
        cloudErp: isOptimal ? 'Tối ưu: Đồng bộ file Google Drive, M365 và ERP tức thì' : 'Bình thường: Thao tác file lớn có thể mất vài phút',
        remoteVpn: isOptimal ? 'Mượt mà: Phiên VPN bảo mật và Remote Desktop không có độ trễ phím' : 'Đạt chuẩn: Phiên kết nối chi nhánh ổn định'
      },
      ispTicket: `Kính gửi Nhà mạng ${isp},\nĐơn vị chúng tôi ghi nhận thông số đường truyền: Download ${dl.toFixed(1)} Mbps, Upload ${ul.toFixed(1)} Mbps, Ping ${rtt}ms, Loss ${loss}%. Đề nghị rà soát chất lượng dịch vụ theo hợp đồng.`,
      itAdvice: [
        'Kích hoạt Smart Queue Management (SQM) để phòng ngừa nghẽn hàng đợi lúc họp trực tuyến đông người.',
        'Ưu tiên kết nối mạng dây LAN Cat6 cho các máy chủ kế toán và thiết bị phòng họp chính.'
      ]
    };

    const apiKey = env.GEMINI_API_KEY;
    if (apiKey) {
      try {
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
  "executiveSummary": "1 đến 2 câu súc tích gửi Ban Giám Đốc/Lãnh đạo",
  "capacityVerdict": "Đoạn văn ngắn nhận xét sức tải văn phòng (khoảng ${estimatedStaff})",
  "workplacePillars": {
    "videoConference": "Nhận xét độ ổn định khi họp Zoom/Teams",
    "cloudErp": "Nhận xét khả năng đồng bộ Google Drive/ERP",
    "remoteVpn": "Nhận xét độ mượt của VPN/Remote Desktop"
  },
  "ispTicket": "Một mẫu tin nhắn kỹ thuật lịch sự, đanh thép để IT gửi tổng đài ${isp}",
  "itAdvice": [
    "Khuyến nghị kỹ thuật số 1 cho IT nội bộ",
    "Khuyến nghị kỹ thuật số 2 cho IT nội bộ"
  ]
}`;

        const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );
        if (resp.ok) {
          const data: any = await resp.json();
          const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
          const parsed = JSON.parse(cleaned);
          return json({ success: true, source: 'ai', ...parsed });
        }
      } catch {
        // Fallback to deterministic
      }
    }

    return json(fallbackResponse);
  } catch (err: any) {
    return json({ error: err?.message || 'error' }, 500);
  }
};
