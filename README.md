<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# วิธีรันและดีพลอยแอป AI Studio

เอกสารนี้รวมทุกอย่างที่ต้องใช้สำหรับรันแอปบนเครื่องของคุณ (local)

ดูแอปของคุณใน AI Studio: https://ai.studio/apps/temp/1

## เปิดเว็บแบบ Step-by-step (ทำตามนี้ได้เลย)

### แบบที่ 1: เปิดใช้ในเครื่องตัวเอง (Local)

1. เปิด Terminal 1 แล้วรันฐานข้อมูล
   ```bash
   docker compose up -d
   ```
2. เปิด Terminal 2 แล้วรัน Backend
   ```bash
   cd server
   cp .env.example .env
   npm install
   npx prisma migrate dev
   npm run dev
   ```
3. เปิด Terminal 3 แล้วรัน Frontend
   ```bash
   # รันจากโฟลเดอร์หลักของโปรเจกต์
   cp .env.example .env
   npm install
   npm run dev
   ```
4. เปิดเว็บ
   - หน้าเว็บ: `http://localhost:3000`
   - API health check: `http://localhost:4000/api/health`

### แบบที่ 2: เปิดให้คนอื่นเข้าได้ผ่าน Cloudflare Tunnel

1. ทำขั้นตอน Local ให้ครบก่อน (แบบที่ 1)
2. เปิด Terminal 4 แล้วสร้าง Frontend tunnel
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. เปิด Terminal 5 แล้วสร้าง Backend tunnel
   ```bash
   cloudflared tunnel --url http://localhost:4000
   ```
4. เอา URL ที่ได้จาก Backend tunnel ไปใส่ไฟล์ `.env` (root)
   ```bash
   VITE_API_BASE_URL="https://<backend-tunnel>.trycloudflare.com"
   ```
5. เอา URL ที่ได้จาก Frontend tunnel ไปใส่ไฟล์ `server/.env`
   ```bash
   CORS_ORIGIN="http://localhost:3000,https://<frontend-tunnel>.trycloudflare.com"
   ```
6. รีสตาร์ท Backend และ Frontend (กด `Ctrl+C` แล้วรัน `npm run dev` ใหม่ทั้งสองฝั่ง)
7. เปิดเว็บด้วย Frontend tunnel URL ที่ได้จากข้อ 2

## รันบนเครื่อง (Local)

**สิ่งที่ต้องมี:** Node.js


1. ติดตั้ง dependencies:
   ```bash
   npm install
   ```
2. รันแอป:
   ```bash
   npm run dev
   ```
3. เปิดแอปและตั้งค่า Gemini API key:
   `/#/settings`

## Gemini API Key

แอปนี้ถูกดีพลอยแบบ public static site ดังนั้น API key จะถูกเก็บไว้เฉพาะในเบราว์เซอร์ของผู้ใช้
จะไม่ถูกฝังในไฟล์ build และไม่ถูกเก็บบนเซิร์ฟเวอร์

## Backend (เว็บไซต์แบบ Dynamic)

**สิ่งที่ต้องมี:** Docker (สำหรับ Postgres), Node.js

### เริ่มระบบ Full Stack (แนะนำ)

ใช้ทั้งหมด 3 เทอร์มินัล

1. เริ่ม Postgres:
   ```bash
   docker compose up -d
   ```
2. เริ่ม backend API:
   ```bash
   cd server
   cp .env.example .env
   npm install
   npx prisma migrate dev
   npm run dev
   ```
3. เริ่ม frontend:
   ```bash
   # รันจากโฟลเดอร์หลักของโปรเจกต์
   npm install
   npm run dev
   ```

URL Frontend: `http://localhost:3000`  
URL Backend: `http://localhost:4000`  
Health Check Backend: `http://localhost:4000/api/health`

### หยุดการทำงานของบริการ

1. หยุด frontend/backend: กด `Ctrl+C` ในแต่ละเทอร์มินัลที่รันอยู่
2. หยุด Postgres:
   ```bash
   docker compose down
   ```

ถ้าเปิด frontend ผ่าน LAN IP (เช่น `http://10.53.33.100:3000`) ให้ตั้งค่า
`CORS_ORIGIN` ใน `server/.env` เป็นโดเมนที่อนุญาต (คั่นด้วย comma) ตัวอย่าง:
`CORS_ORIGIN="http://localhost:3000,http://10.53.33.100:3000"`

### URL API ของ Frontend

ถ้าต้องการใช้ API base URL อื่น ให้ตั้งค่า:
`VITE_API_BASE_URL` ในไฟล์ `.env` ที่ root (คัดลอกจาก `.env.example`) ตัวอย่าง:

```bash
VITE_API_BASE_URL="http://localhost:4000"
```

## Cloudflare Tunnel (เปิดลิงก์สาธารณะสำหรับแอปที่รันบนเครื่อง)

ใช้ทั้งหมด 4 เทอร์มินัล

1. เริ่ม Postgres:
   ```bash
   docker compose up -d
   ```
2. เริ่ม backend API:
   ```bash
   cd server
   cp .env.example .env
   npm install
   npx prisma migrate dev
   npm run dev
   ```
3. เริ่ม frontend:
   ```bash
   # รันจากโฟลเดอร์หลักของโปรเจกต์
   cp .env.example .env
   npm install
   npm run dev -- --host 0.0.0.0 --port 3000
   ```
4. เปิด tunnels:
   ```bash
   # tunnel สำหรับ frontend
   cloudflared tunnel --url http://localhost:3000

   # tunnel สำหรับ backend (เปิดในอีกเทอร์มินัล)
   cloudflared tunnel --url http://localhost:4000
   ```

จากนั้นตั้งค่า env:

- `.env` ที่ root
  ```bash
  VITE_API_BASE_URL="https://<backend-tunnel>.trycloudflare.com"
  ```
- `server/.env`
  ```bash
  CORS_ORIGIN="http://localhost:3000,https://<frontend-tunnel>.trycloudflare.com"
  ```

หลังแก้ค่า `.env` แล้ว ให้รีสตาร์ททั้ง frontend และ backend

## ดีพลอยไป GitHub Pages (Project Site)

1. Push โค้ดขึ้น branch `main`
2. ไปที่ settings ของ repo บน GitHub > `Pages` แล้วตั้ง `Source` เป็น `GitHub Actions`
3. เว็บไซต์จะพร้อมใช้งานที่:
   `https://<owner>.github.io/ai-financial-analyst/`

หมายเหตุ:
- `vite.config.ts` ตั้งค่า `base: '/ai-financial-analyst/'` สำหรับ production
- Router ใช้ `HashRouter` เพื่อป้องกันปัญหา refresh แล้วเจอ 404 บน static hosting
