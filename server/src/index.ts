import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const CORS_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    // If CORS_ORIGIN is not set, reflect the caller origin to simplify LAN/dev usage.
    origin: CORS_ORIGINS.length > 0 ? CORS_ORIGINS : true,
    credentials: true,
  }),
);
app.use(express.json());

type JwtPayload = { userId: string };

const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'invest']),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string().min(1),
  note: z.string().optional().nullable(),
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // update lastLogin
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.get('/api/me', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true, lastLogin: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

  app.get('/api/admin/users', requireAuth, async (req, res) => {
    const userId = (req as any).userId as string;
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!me || me.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const users = await prisma.user.findMany({ select: { id: true, email: true, createdAt: true, lastLogin: true, role: true }, orderBy: { createdAt: 'desc' } });
    res.json({ users });
  });

app.get('/api/transactions', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const items = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  });
  res.json({
    transactions: items.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date.toISOString().split('T')[0],
      note: t.note || '',
    })),
  });
});

app.post('/api/transactions', requireAuth, async (req, res) => {
  const parsed = transactionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const userId = (req as any).userId as string;
  const data = parsed.data;
  const created = await prisma.transaction.create({
    data: {
      userId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      date: new Date(data.date),
      note: data.note || '',
    },
  });
  res.json({
    transaction: {
      id: created.id,
      type: created.type,
      amount: created.amount,
      category: created.category,
      date: created.date.toISOString().split('T')[0],
      note: created.note || '',
    },
  });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
