import { MarketCoin } from '../types';
import { WATCHLIST_COINS, TOP_COINS_LIMIT } from '../constants';

// CoinGecko API is free but has rate limits.
const BASE_URL = 'https://api.coingecko.com/api/v3';

export const fetchTopCoins = async (): Promise<MarketCoin[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${TOP_COINS_LIMIT}&page=1&sparkline=false`
    );
    if (!response.ok) throw new Error('Failed to fetch top coins');
    return await response.json();
  } catch (error) {
    console.error("Error fetching top coins:", error);
    return [];
  }
};

export const fetchWatchlistCoins = async (): Promise<MarketCoin[]> => {
  try {
    const ids = WATCHLIST_COINS.join(',');
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&page=1&sparkline=false`
    );
    if (!response.ok) throw new Error('Failed to fetch watchlist');
    return await response.json();
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return [];
  }
};
