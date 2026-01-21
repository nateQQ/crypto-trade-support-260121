import { MarketCoin } from '../types';
import { WATCHLIST_COINS, TOP_COINS_LIMIT } from '../constants';

// CoinGecko API is free but has rate limits.
const BASE_URL = 'https://api.coingecko.com/api/v3';

// Mock data to ensure app functionality when API limit is reached or CORS fails
const MOCK_DATA: Record<string, MarketCoin> = {
  'bitcoin': { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 96542, market_cap: 1900000000000, market_cap_rank: 1, price_change_percentage_24h: 2.5, total_volume: 50000000000 },
  'ethereum': { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 3650, market_cap: 420000000000, market_cap_rank: 2, price_change_percentage_24h: 1.2, total_volume: 20000000000 },
  'solana': { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 185.5, market_cap: 85000000000, market_cap_rank: 4, price_change_percentage_24h: -3.5, total_volume: 4000000000 },
  'sui': { id: 'sui', symbol: 'sui', name: 'Sui', image: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg', current_price: 1.92, market_cap: 2200000000, market_cap_rank: 45, price_change_percentage_24h: 5.4, total_volume: 600000000 },
  'berachain': { id: 'berachain-bjet', symbol: 'bera', name: 'Berachain', image: 'https://assets.coingecko.com/coins/images/33454/standard/berachain_logo.png', current_price: 69.42, market_cap: 100000000, market_cap_rank: 200, price_change_percentage_24h: 12.5, total_volume: 1000000 },
};

const getMockTopCoins = () => Object.values(MOCK_DATA).slice(0, TOP_COINS_LIMIT);
const getMockWatchlist = () => WATCHLIST_COINS.map(id => MOCK_DATA[id] || {
    id, symbol: id, name: id.toUpperCase(), image: '', current_price: 0, market_cap: 0, market_cap_rank: 999, price_change_percentage_24h: 0, total_volume: 0
});

export const fetchTopCoins = async (): Promise<MarketCoin[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${TOP_COINS_LIMIT}&page=1&sparkline=false`,
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    throw new Error("Invalid response format");
  } catch (error) {
    console.warn("Fetching top coins failed (using mock data). Error:", error);
    return getMockTopCoins();
  }
};

export const fetchWatchlistCoins = async (): Promise<MarketCoin[]> => {
  try {
    const ids = WATCHLIST_COINS.join(',');
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&page=1&sparkline=false`,
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    throw new Error("Invalid response format");
  } catch (error) {
    console.warn("Fetching watchlist failed (using mock data). Error:", error);
    return getMockWatchlist();
  }
};