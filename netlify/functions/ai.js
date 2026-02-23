import { getAuthedUser, methodNotAllowed, unauthorized } from './_lib/auth.js';
import { connectLambda, getStore } from '@netlify/blobs';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = 15000;
const MAX_SUMMARY_LENGTH = 2000;
const MAX_DETAILS_JSON_LENGTH = 12000;
const MAX_CHAT_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 20;
const MAX_HISTORY_PART_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 25;

const FALLBACK_INSIGHT = 'AI Insight: ลองตรวจสอบค่าใช้จ่ายในหมวดอาหารที่ดูเหมือนจะสูงขึ้นในสัปดาห์นี้';
const FALLBACK_CHAT = 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI โปรดลองอีกครั้งภายหลัง';
const FALLBACK_ANALYSIS = `📊 สรุปสุขภาพทางการเงิน

จากข้อมูลที่มี คุณมีการจัดการรายรับ-รายจ่ายในระดับที่พอใช้ได้ แต่ยังมีจุดที่สามารถปรับปรุงได้

💡 คำแนะนำ:
• พยายามเพิ่มอัตราการออมให้ถึง 20% ของรายรับ
• ติดตามค่าใช้จ่ายหมวดที่สูงที่สุดอย่างสม่ำเสมอ
• บันทึกรายรับ-รายจ่ายทุกวันเพื่อข้อมูลที่แม่นยำขึ้น`;

function badRequest(message) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: message }),
  };
}

function parseBody(body) {
  try {
    const parsed = JSON.parse(body || '{}');
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeText(value, fallback) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function historyToContents(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((turn) => turn && (turn.role === 'user' || turn.role === 'model') && Array.isArray(turn.parts))
    .map((turn) => ({
      role: turn.role,
      parts: turn.parts
        .map((part) => ({ text: typeof part?.text === 'string' ? part.text.slice(0, MAX_HISTORY_PART_LENGTH) : '' }))
        .filter((part) => part.text.trim().length > 0),
    }))
    .filter((turn) => turn.parts.length > 0)
    .slice(-MAX_HISTORY_TURNS);
}

function badRequestWithCode(message, code) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: message, code }),
  };
}

function validateStringLength(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function validateHistory(history) {
  if (history == null) return null;
  if (!Array.isArray(history)) return 'Invalid history';
  if (history.length > MAX_HISTORY_TURNS) return 'History too long';
  for (const turn of history) {
    if (!turn || (turn.role !== 'user' && turn.role !== 'model') || !Array.isArray(turn.parts)) {
      return 'Invalid history';
    }
    for (const part of turn.parts) {
      if (typeof part?.text !== 'string') return 'Invalid history';
      if (part.text.length > MAX_HISTORY_PART_LENGTH) return 'History item too long';
    }
  }
  return null;
}

function getRateLimitStore() {
  return getStore({ name: 'ai-rate-limits' });
}

function rateLimitKeyForUser(userId) {
  return `ai-rate:${userId}`;
}

async function enforceRateLimit(userId) {
  try {
    const store = getRateLimitStore();
    const now = Date.now();
    const key = rateLimitKeyForUser(userId);
    const current = await store.get(key, { type: 'json' });

    const windowStart = typeof current?.windowStart === 'number' ? current.windowStart : now;
    const count = typeof current?.count === 'number' ? current.count : 0;
    const inWindow = now - windowStart < RATE_LIMIT_WINDOW_MS;
    const nextCount = inWindow ? count + 1 : 1;
    const nextWindowStart = inWindow ? windowStart : now;

    if (inWindow && count >= RATE_LIMIT_MAX_REQUESTS) {
      const retryAfterSeconds = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - windowStart)) / 1000));
      return {
        statusCode: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
        body: JSON.stringify({
          error: 'Too many AI requests. Please try again soon.',
          code: 'AI_RATE_LIMITED',
        }),
      };
    }

    await store.setJSON(key, {
      windowStart: nextWindowStart,
      count: nextCount,
    });
    return null;
  } catch (error) {
    console.error('[ai] rate limiter unavailable', error);
    return null;
  }
}

function createAiError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function buildPrompt(action, payload) {
  if (action === 'insight') {
    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Based on this financial summary: "${payload.summary}", provide a single, short, actionable advice for a student in Thai language. Start with "AI Insight: ".`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
      },
      fallback: FALLBACK_INSIGHT,
    };
  }

  if (action === 'analysis') {
    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `คุณเป็น AI Financial Analyst สำหรับนักศึกษา จงวิเคราะห์ข้อมูลการเงินต่อไปนี้อย่างละเอียด:

${payload.detailsJson}

กรุณาตอบเป็นภาษาไทย โดยครอบคลุมหัวข้อเหล่านี้:
1. 📊 สรุปภาพรวมสุขภาพทางการเงิน (1-2 ประโยค)
2. ✅ จุดแข็ง — สิ่งที่ทำได้ดี (1-2 ข้อ)
3. ⚠️ จุดที่ควรปรับปรุง (1-2 ข้อ)
4. 💡 คำแนะนำเชิงปฏิบัติ (2-3 ข้อสั้นๆ ที่นักศึกษาทำได้จริง)

ตอบให้กระชับ ไม่เกิน 200 คำ ใช้โทนที่เป็นมิตรและให้กำลังใจ`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
      fallback: FALLBACK_ANALYSIS,
    };
  }

  if (action === 'chat') {
    const contents = historyToContents(payload.history);
    contents.push({
      role: 'user',
      parts: [{ text: payload.message }],
    });
    return {
      contents,
      systemInstruction: {
        parts: [
          {
            text: 'You are a helpful AI Financial Analyst specialized in helping students manage their money. You speak Thai primarily. Be encouraging, precise, and professional. Keep your responses short and concise, ideally 2-3 sentences. Avoid long paragraphs or bullet points unless the user explicitly asks for detailed explanation.',
          },
        ],
      },
      generationConfig: {
        maxOutputTokens: 200,
      },
      fallback: FALLBACK_CHAT,
    };
  }

  return null;
}

async function callGemini(apiKey, body) {
  const endpoint = `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createAiError('AI_TIMEOUT', 'Gemini request timeout');
    }
    throw createAiError('AI_NETWORK_ERROR', 'Gemini network failure');
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    if (res.status === 400) {
      throw createAiError('AI_UPSTREAM_BAD_REQUEST', 'Gemini rejected payload');
    }
    if (res.status === 401 || res.status === 403) {
      throw createAiError('AI_UPSTREAM_AUTH', 'Gemini authentication failed');
    }
    throw createAiError('AI_UPSTREAM_ERROR', `Gemini API status ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' ? text : '';
}

export const handler = async (event, context) => {
  try {
    connectLambda(event);
  } catch {
    // ignore when not running in blobs-enabled local runtime
  }

  if (event.httpMethod !== 'POST') {
    return methodNotAllowed();
  }

  const authed = await getAuthedUser(event, context);
  if (!authed) {
    return unauthorized();
  }

  const rateLimited = await enforceRateLimit(authed.userId);
  if (rateLimited) {
    return rateLimited;
  }

  const payload = parseBody(event.body);
  if (!payload) {
    return badRequest('Invalid JSON payload');
  }

  const action = payload.action;
  if (action !== 'insight' && action !== 'analysis' && action !== 'chat') {
    return badRequest('Invalid action');
  }

  if (action === 'insight' && !validateStringLength(payload.summary, MAX_SUMMARY_LENGTH)) {
    return badRequestWithCode('Invalid summary', 'AI_INVALID_SUMMARY');
  }
  if (action === 'analysis' && !validateStringLength(payload.detailsJson, MAX_DETAILS_JSON_LENGTH)) {
    return badRequestWithCode('Invalid detailsJson', 'AI_INVALID_DETAILS_JSON');
  }
  if (action === 'chat' && !validateStringLength(payload.message, MAX_CHAT_MESSAGE_LENGTH)) {
    return badRequestWithCode('Invalid message', 'AI_INVALID_MESSAGE');
  }
  if (action === 'chat') {
    const historyError = validateHistory(payload.history);
    if (historyError) {
      return badRequestWithCode(historyError, 'AI_INVALID_HISTORY');
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'AI service is not configured',
        code: 'GEMINI_API_KEY_MISSING',
      }),
    };
  }

  const prompt = buildPrompt(action, payload);
  if (!prompt) {
    return badRequest('Unsupported action');
  }

  try {
    const text = await callGemini(apiKey, {
      contents: prompt.contents,
      systemInstruction: prompt.systemInstruction,
      generationConfig: prompt.generationConfig,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ text: normalizeText(text, prompt.fallback) }),
    };
  } catch (error) {
    console.error('[ai] handler failed', error);
    const code = error?.code || 'AI_UNKNOWN_ERROR';
    const statusCode = code === 'AI_TIMEOUT' ? 504 : 502;
    return {
      statusCode,
      body: JSON.stringify({
        error: 'AI request failed',
        code,
      }),
    };
  }
};
