<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Financial Analyst (Netlify-only)

โปรเจกต์นี้ย้ายเป็น **Netlify-only architecture** แล้ว:
- Frontend: Vite + React
- Auth: Netlify Identity
- API: Netlify Functions
- Data store: Netlify Blobs

## Quickstart

### 1) ติดตั้ง dependencies

```bash
npm install
```

### 2) ตั้งค่า env (optional)

สร้าง `.env` จากตัวอย่าง:

```bash
cp .env.example .env
```

ค่าที่รองรับ:

```env
# ใส่เมื่อจะให้ frontend วิ่งไปโดเมนอื่น (เช่น production)
VITE_NETLIFY_SITE_URL=""

# โดยปกติไม่ต้องใส่ ใช้ค่า default = <site>/.netlify/identity
VITE_NETLIFY_IDENTITY_URL=""
```

### 3) รัน local frontend

```bash
npm run dev
```

## Deploy to Netlify

### 1) Production deploy

```bash
npm run netlify:deploy
```

### 2) ตั้งค่า Netlify Identity (ใน Dashboard)

ไปที่ Site settings -> Identity
1. เปิดใช้งาน Identity
2. Registration แนะนำให้เริ่มที่ `Open` เพื่อทดสอบ
3. หลังทดสอบค่อยปรับ policy ตามต้องการ
4. ช่วง debug แนะนำปิดออปชันยืนยันอีเมลก่อน login

## Auth Troubleshooting

- สมัครแล้วไม่เข้า dashboard:
  - ตรวจว่า Identity เปิดใช้งานแล้ว และ Registration เป็น `Open`
  - ถ้าเปิด email confirmation จะต้องยืนยันอีเมลก่อน login
- Login ไม่สำเร็จ:
  - ตรวจข้อความ error ใต้ฟอร์ม (เช่น `Invalid login credentials`)
  - เปิด DevTools Console ดู log prefix `[auth]`, `[api]`, `[app]` ในโหมด dev

## API Endpoints (Netlify Functions)

- `GET /.netlify/functions/me`
- `GET /.netlify/functions/transactions`
- `POST /.netlify/functions/transactions`
- `POST /.netlify/functions/logout`

## Data Model (Blobs)

เก็บข้อมูลต่อผู้ใช้ด้วย key:
- `transactions:{userId}` -> array ของ transaction

Transaction shape:
- `id`
- `type` (`income` | `expense` | `invest`)
- `amount`
- `category`
- `date`
- `note`

## Limitations

- Blobs เหมาะกับงาน small-medium ที่ไม่ต้อง join/query ซับซ้อนแบบ relational DB
- โมดูล `/admin` ถูกปิดชั่วคราวใน Netlify-only mode

## Legacy Mode (Optional)

โหมดเดิม `Express + Postgres + Cloudflare tunnel` ยังอยู่ใน repo:
- `server/`
- `docker-compose.yml`
- `scripts/share.sh`

รันโหมดเดิมด้วย:

```bash
npm run legacy:share
```
