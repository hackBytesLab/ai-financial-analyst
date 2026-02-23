import type { ChatHistoryTurn } from "../types";
import { identity } from "./identity";

const siteBase = import.meta.env.VITE_NETLIFY_SITE_URL || window.location.origin;
const functionsBase = `${siteBase}/.netlify/functions`;

const FALLBACK_INSIGHT = "AI Insight: Review your food spending this week and set a tighter daily cap.";
const FALLBACK_CHAT = "Sorry, AI is temporarily unavailable. Please try again in a moment.";
const FALLBACK_ANALYSIS = `Financial summary\n\nYour spending and income tracking is working, but there is room to improve.\n\nSuggestions:\n- Target a 20% savings rate\n- Monitor your highest spending category weekly\n- Log transactions daily for better accuracy`;

function normalizeApiText(value: unknown): string | null {
  if (value == null) return null;
  const s = typeof value === "string" ? value : String(value);
  return s.trim() || null;
}

async function requestAI<T>(body: unknown): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = await identity.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${functionsBase}/ai`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || `AI request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const getFinancialInsight = async (summary: string): Promise<string> => {
  try {
    const response = await requestAI<{ text?: string }>({
      action: "insight",
      summary,
    });
    const text = normalizeApiText(response?.text);
    return text ?? FALLBACK_INSIGHT;
  } catch (error) {
    console.error("Gemini Error:", error);
    return FALLBACK_INSIGHT;
  }
};

export const getFinancialAnalysis = async (detailsJson: string): Promise<string> => {
  try {
    const response = await requestAI<{ text?: string }>({
      action: "analysis",
      detailsJson,
    });
    const text = normalizeApiText(response?.text);
    return text ?? FALLBACK_ANALYSIS;
  } catch (error) {
    console.error("Analysis Error:", error);
    return FALLBACK_ANALYSIS;
  }
};

export type { ChatHistoryTurn } from "../types";

export const chatWithAI = async (
  message: string,
  history: ChatHistoryTurn[]
): Promise<string> => {
  try {
    const response = await requestAI<{ text?: string }>({
      action: "chat",
      message,
      history,
    });
    const text = normalizeApiText(response?.text);
    return text ?? FALLBACK_CHAT;
  } catch (error) {
    console.error("Chat Error:", error);
    return FALLBACK_CHAT;
  }
};
