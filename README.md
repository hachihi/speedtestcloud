# HCH Speedtest

Đo tốc độ Internet (Ping / Download / Upload) chạy hoàn toàn trên Cloudflare Speed Test edge.

## Chạy local
```bash
npm install
npm run dev
```

## Deploy lên Cloudflare (Workers Builds, kết nối GitHub)
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Cấu hình nằm trong `wrangler.jsonc` (tên Worker phải trùng tên project trên Cloudflare: `speedtestcloud`).
- Secret AI (tuỳ chọn): **Settings → Variables and Secrets** (runtime, không phải Build variables) thêm `GEMINI_API_KEY`.

`worker/index.ts` phục vụ API `/api/speedtest/ai-report`, các đường dẫn khác trả về file tĩnh trong `dist`.
