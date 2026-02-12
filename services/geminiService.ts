import { GoogleGenAI } from "@google/genai";
import type { ChatHistoryTurn } from "../types";

const apiKey = process.env.GEMINI_API_KEY ?? process.env.API_KEY ?? "";

function getClient() {
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    throw new Error("GEMINI_API_KEY is not set or invalid. Set it in .env.local.");
  }
  return new GoogleGenAI({ apiKey });
}

const FALLBACK_INSIGHT =
  "AI Insight: ลองตรวจสอบค่าใช้จ่ายในหมวดอาหารที่ดูเหมือนจะสูงขึ้นในสัปดาห์นี้";
const FALLBACK_CHAT = "ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI โปรดลองอีกครั้งภายหลัง";
const FALLBACK_ANALYSIS = `📊 สรุปสุขภาพทางการเงิน

จากข้อมูลที่มี คุณมีการจัดการรายรับ-รายจ่ายในระดับที่พอใช้ได้ แต่ยังมีจุดที่สามารถปรับปรุงได้

💡 คำแนะนำ:
• พยายามเพิ่มอัตราการออมให้ถึง 20% ของรายรับ
• ติดตามค่าใช้จ่ายหมวดที่สูงที่สุดอย่างสม่ำเสมอ
• บันทึกรายรับ-รายจ่ายทุกวันเพื่อข้อมูลที่แม่นยำขึ้น`;

function normalizeApiText(value: unknown): string | null {
  if (value == null) return null;
  const s = typeof value === "string" ? value : String(value);
  return s.trim() || null;
}

export const getFinancialInsight = async (summary: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this financial summary: "${summary}", provide a single, short, actionable advice for a student in Thai language. Start with "AI Insight: ".`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 150,
      },
    });
    const text = normalizeApiText(response?.text);
    return text ?? FALLBACK_INSIGHT;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("GEMINI_API_KEY")) throw error;
      console.error("Gemini Error:", error.message);
    } else {
      console.error("Gemini Error:", error);
    }
    return FALLBACK_INSIGHT;
  }
};

export const getFinancialAnalysis = async (detailsJson: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `คุณเป็น AI Financial Analyst สำหรับนักศึกษา จงวิเคราะห์ข้อมูลการเงินต่อไปนี้อย่างละเอียด:

${detailsJson}

กรุณาตอบเป็นภาษาไทย โดยครอบคลุมหัวข้อเหล่านี้:
1. 📊 สรุปภาพรวมสุขภาพทางการเงิน (1-2 ประโยค)
2. ✅ จุดแข็ง — สิ่งที่ทำได้ดี (1-2 ข้อ)
3. ⚠️ จุดที่ควรปรับปรุง (1-2 ข้อ)
4. 💡 คำแนะนำเชิงปฏิบัติ (2-3 ข้อสั้นๆ ที่นักศึกษาทำได้จริง)

ตอบให้กระชับ ไม่เกิน 200 คำ ใช้โทนที่เป็นมิตรและให้กำลังใจ`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });
    const text = normalizeApiText(response?.text);
    return text ?? FALLBACK_ANALYSIS;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("GEMINI_API_KEY")) throw error;
      console.error("Analysis Error:", error.message);
    } else {
      console.error("Analysis Error:", error);
    }
    return FALLBACK_ANALYSIS;
  }
};

export type { ChatHistoryTurn } from "../types";

export const chatWithAI = async (
  message: string,
  history: ChatHistoryTurn[]
): Promise<string> => {
  try {
    const ai = getClient();
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: history.length > 0 ? history : undefined,
      config: {
        systemInstruction:
          "You are a helpful AI Financial Analyst specialized in helping students manage their money. You speak Thai primarily. Be encouraging, precise, and professional. Keep your responses short and concise — ideally 2-3 sentences. Avoid long paragraphs or bullet points unless the user explicitly asks for detailed explanation.",
        maxOutputTokens: 200,
      },
    });

    const response = await chat.sendMessage({ message });
    const text = normalizeApiText(response?.text);
    return text ?? FALLBACK_CHAT;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("GEMINI_API_KEY")) throw error;
      console.error("Chat Error:", error.message);
    } else {
      console.error("Chat Error:", error);
    }
    return FALLBACK_CHAT;
  }
};
