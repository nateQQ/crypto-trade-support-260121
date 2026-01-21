import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, PositionDirection, AnalysisTrend, SentimentData } from "../types";
import { THUAN_CAPITAL_SEARCH_QUERY } from "../constants";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
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
            
            Return a JSON object with the following structure:
            {
                "sentiment": "Bullish" | "Bearish" | "Neutral",
                "summary": "A concise summary of the market mood (max 2-3 sentences).",
                "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
            }`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });

        const text = response.text || "{}";
        // Parse JSON
        try {
             return JSON.parse(text) as SentimentData;
        } catch (e) {
             const cleanText = text.replace(/```json/g, '').replace(/```/g, '');
             return JSON.parse(cleanText) as SentimentData;
        }
    } catch (e) {
        console.error("Sentiment fetch failed", e);
        return {
            sentiment: "Neutral",
            summary: "Unable to fetch sentiment data due to an error.",
            keyPoints: []
        };
    }
};

export const analyzeChartImage = async (file: File, additionalContext: string): Promise<AnalysisResult> => {
  const ai = getAiClient();
  const base64Data = await fileToGenerativePart(file);

  // Using gemini-2.5-flash-latest for multimodal capability (vision + reasoning)
  const model = "gemini-flash-latest"; 

  const prompt = `
    You are an expert technical analyst for cryptocurrency trading.
    Analyze this chart screenshot (likely Binance). 
    
    CRITICAL INSTRUCTION:
    Focus specifically on the MACD indicator (12, 26, 9) at the bottom of the chart.
    
    THE TRADING STRATEGY:
    - We are looking for a specific pattern: "MACD entering the second half of the red zone".
    - This means the MACD histogram bars are red (negative) but are starting to get shorter (lighter color in some themes), indicating bearish momentum is weakening and a potential reversal to the upside is coming.
    - If this pattern is detected on a 15-minute or 1-hour timeframe, it is a strong signal for a LONG position.
    
    TASK:
    1. Identify the coin symbol and timeframe from the image if possible.
    2. Analyze the price trend.
    3. Analyze the MACD histogram state closely.
    4. Provide a trading recommendation based on the strategy above.
    
    CONTEXT PROVIDED BY USER:
    "${additionalContext}"

    OUTPUT FORMAT:
    Return valid JSON adhering to this schema:
    {
      "trend": "UP" | "DOWN" | "NEUTRAL",
      "direction": "LONG" | "SHORT" | "WAIT",
      "entryPrice": "Suggest specific price or 'Current Market Price'",
      "targetPrice": "Suggest specific target based on resistance",
      "stopLoss": "Suggest stop loss based on recent support",
      "pnlProjection": "Estimated Risk/Reward ratio (e.g., 1:3)",
      "reasoning": "Detailed technical analysis explanation focusing on MACD",
      "confidence": "High" | "Medium" | "Low",
      "macdStatus": "Describe the specific look of the MACD histogram"
    }
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      // We can define a schema but the prompt instructions are usually sufficient for Flash 2.5/Pro 3
      // Let's use loose JSON parsing for robustness
    }
  });

  const text = response.text || "{}";
  let jsonResult;
  try {
    jsonResult = JSON.parse(text);
  } catch (e) {
    // Fallback if markdown fence is included
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    jsonResult = JSON.parse(cleanText);
  }

  return {
    fileName: file.name,
    timestamp: new Date().toISOString(),
    recommendation: {
      trend: jsonResult.trend as AnalysisTrend || AnalysisTrend.NEUTRAL,
      direction: jsonResult.direction as PositionDirection || PositionDirection.WAIT,
      entryPrice: jsonResult.entryPrice || "N/A",
      targetPrice: jsonResult.targetPrice || "N/A",
      stopLoss: jsonResult.stopLoss || "N/A",
      pnlProjection: jsonResult.pnlProjection || "N/A",
      reasoning: jsonResult.reasoning || "Analysis failed to produce reasoning.",
      confidence: jsonResult.confidence || "Low",
      macdStatus: jsonResult.macdStatus || "Unknown"
    }
  };
};
