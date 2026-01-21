export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

export enum AnalysisTrend {
  UP = 'UP',
  DOWN = 'DOWN',
  NEUTRAL = 'NEUTRAL',
}

export enum PositionDirection {
  LONG = 'LONG',
  SHORT = 'SHORT',
  WAIT = 'WAIT',
}

export interface TradeRecommendation {
  trend: AnalysisTrend;
  direction: PositionDirection;
  entryPrice: string;
  targetPrice: string;
  stopLoss: string;
  pnlProjection: string;
  reasoning: string;
  confidence: string; // e.g., "High", "Medium", "Low"
  macdStatus: string; // Description of MACD state (e.g., "Second half red zone")
}

export interface AnalysisResult {
  fileName: string;
  timestamp: string;
  recommendation: TradeRecommendation;
  groundingUrls?: string[];
}

export interface SentimentData {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  keyPoints: string[];
}

export interface MarketSentiment {
  source: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
}
