import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, PositionDirection, AnalysisTrend, SentimentData } from "../types";
import { THUAN_CAPITAL_SEARCH_QUERY } from "../constants";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fetchMarketSentiment = async (): Promise<SentimentData> => {
    try {
        const ai = getAiClient();
        const model = 'gemini-3-flash-preview'; 
        const response = await ai.models.generateContent({
            model,
            contents: `Search for the latest crypto market sentiment from major sources like CoinMarketCap news and "Thuan Capital" youtube channel updates. 
            Return a JSON object:
            {
                "sentiment": "Bullish" | "Bearish" | "Neutral",
                "summary": "Concise summary.",
                "keyPoints": ["Point 1", "Point 2", "Point 3"]
            }`,
            config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
        });
        const text = response.text || "{}";
        try { return JSON.parse(text) as SentimentData; } catch (e) {
             const cleanText = text.replace(/```json/g, '').replace(/```/g, '');
             return JSON.parse(cleanText) as SentimentData;
        }
    } catch (e) {
        console.error("Sentiment fetch failed", e);
        return { sentiment: "Neutral", summary: "Error fetching data.", keyPoints: [] };
    }
};

export const analyzeChartImage = async (files: { file15m?: File, file1h?: File }, additionalContext: string): Promise<AnalysisResult> => {
  const ai = getAiClient();
  const model = "gemini-flash-latest";
  const parts: any[] = [];

  if (files.file15m) {
    const data = await fileToGenerativePart(files.file15m);
    parts.push({ inlineData: { mimeType: files.file15m.type, data }, text: "This is the 15-minute chart." });
  }
  if (files.file1h) {
    const data = await fileToGenerativePart(files.file1h);
    parts.push({ inlineData: { mimeType: files.file1h.type, data }, text: "This is the 1-hour chart." });
  }

  const prompt = `
    You are an expert technical analyst. Compare and contrast the provided 15m and 1h charts.
    
    CRITICAL STRATEGY:
    - Look for MACD (12, 26, 9) "second half red zone" pattern (bars shortening in negative territory).
    - Use the 1h chart for major trend confirmation and the 15m chart for precise entry timing.
    - If BOTH charts show the pattern, it is a high-confidence signal.
    
    OUTPUT FORMAT (JSON):
    {
      "trend": "UP" | "DOWN" | "NEUTRAL",
      "direction": "LONG" | "SHORT" | "WAIT",
      "entryPrice": "Specific price",
      "targetPrice": "Specific target",
      "stopLoss": "Specific stop loss",
      "pnlProjection": "Risk/Reward ratio",
      "reasoning": "Synthesis of both timeframes",
      "confidence": "High" | "Medium" | "Low",
      "macdStatus": "Summary of MACD across both timeframes"
    }
  `;
  parts.push({ text: prompt + "\nContext: " + additionalContext });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: { responseMimeType: "application/json" }
  });

  const text = response.text || "{}";
  const jsonResult = JSON.parse(text.replace(/```json/g, '').replace(/```/g, ''));

  return {
    fileName: "Combined Analysis",
    timestamp: new Date().toISOString(),
    recommendation: {
      trend: jsonResult.trend as AnalysisTrend || AnalysisTrend.NEUTRAL,
      direction: jsonResult.direction as PositionDirection || PositionDirection.WAIT,
      entryPrice: jsonResult.entryPrice || "N/A",
      targetPrice: jsonResult.targetPrice || "N/A",
      stopLoss: jsonResult.stopLoss || "N/A",
      pnlProjection: jsonResult.pnlProjection || "N/A",
      reasoning: jsonResult.reasoning || "No reasoning provided.",
      confidence: jsonResult.confidence || "Low",
      macdStatus: jsonResult.macdStatus || "Unknown"
    }
  };
};