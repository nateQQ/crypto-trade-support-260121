import React, { useEffect, useState } from 'react';
import { MarketCoin, SentimentData } from '../types';
import { fetchTopCoins, fetchWatchlistCoins } from '../services/marketService';
import { fetchMarketSentiment } from '../services/geminiService';
import { TrendingUp, TrendingDown, Loader2, Newspaper, Check, BarChart3 } from 'lucide-react';

interface CoinRowProps {
  coin: MarketCoin;
  isSelected: boolean;
  onSelect: (coin: MarketCoin) => void;
}

const CoinRow: React.FC<CoinRowProps> = ({ coin, isSelected, onSelect }) => (
  <div 
    onClick={() => onSelect(coin)}
    className={`flex items-center justify-between p-3 rounded-lg transition-all border-b border-gray-700 last:border-0 cursor-pointer group ${
      isSelected 
        ? 'bg-blue-900/30 border-l-4 border-l-blue-500 pl-2' 
        : 'hover:bg-gray-700/50 border-l-4 border-l-transparent pl-3'
    }`}
  >
    <div className="flex items-center space-x-3">
      <div className="relative">
         <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
         {isSelected && (
             <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                 <Check className="w-2 h-2 text-white" />
             </div>
         )}
      </div>
      <div>
        <p className={`font-bold transition-colors ${isSelected ? 'text-blue-400' : 'text-gray-200 group-hover:text-white'}`}>
            {coin.symbol.toUpperCase()}
        </p>
        <p className="text-xs text-gray-400">{coin.name}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-medium text-gray-200">${coin.current_price.toLocaleString()}</p>
      <p className={`text-sm flex items-center justify-end ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {coin.price_change_percentage_24h.toFixed(2)}%
      </p>
    </div>
  </div>
);

export const MarketOverview: React.FC = () => {
  const [topCoins, setTopCoins] = useState<MarketCoin[]>([]);
  const [watchlist, setWatchlist] = useState<MarketCoin[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [top, watch, sent] = await Promise.all([
            fetchTopCoins(),
            fetchWatchlistCoins(),
            fetchMarketSentiment()
        ]);
        
        // Ensure we always set arrays, falling back to empty arrays if undefined
        setTopCoins(Array.isArray(top) ? top : []);
        setWatchlist(Array.isArray(watch) ? watch : []);
        setSentiment(sent);
        
        if (Array.isArray(watch) && watch.length > 0) {
            setSelectedCoinId(watch[0].id);
        }
      } catch (error) {
        console.error("Failed to load market data", error);
        // Fallback to empty states in worst-case
        setTopCoins([]);
        setWatchlist([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const safeTopCoins = Array.isArray(topCoins) ? topCoins : [];
  const safeWatchlist = Array.isArray(watchlist) ? watchlist : [];
  
  const upCount = safeTopCoins.filter(c => c.price_change_percentage_24h >= 0).length;
  const downCount = safeTopCoins.length - upCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-xl border border-gray-700">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8">
      {/* Sentiment Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        <div className="p-6">
            <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                    <Newspaper className="w-6 h-6 mr-3 text-blue-400" />
                    Market Sentiment
                </h2>
                {sentiment && (
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                        sentiment.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        sentiment.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                        {sentiment.sentiment}
                    </span>
                )}
            </div>
            
            <div className="bg-gray-900/40 rounded-xl p-5 border border-gray-700/50">
                {sentiment ? (
                    <div className="space-y-4">
                        <p className="text-lg text-gray-200 leading-relaxed">{sentiment.summary}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-700/50">
                            {Array.isArray(sentiment.keyPoints) && sentiment.keyPoints.length > 0 ? (
                                sentiment.keyPoints.map((point, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-300">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        {point}
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm italic col-span-2">No key developments available.</p>
                            )}
                        </div>
                    </div>
                ) : <p className="text-gray-400 text-sm">Sentiment analysis unavailable.</p>}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-white mb-4">Watchlist</h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
            {safeWatchlist.length > 0 ? (
              safeWatchlist.map(coin => (
                <CoinRow key={coin.id} coin={coin} isSelected={selectedCoinId === coin.id} onSelect={c => setSelectedCoinId(c.id)} />
              ))
            ) : (
              <p className="text-gray-500 text-center mt-10">No watchlist data available</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Top 10 Market Pulse</h2>
              <div className="flex items-center space-x-3 text-sm font-bold">
                  <span className="text-green-400 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> {upCount} Up</span>
                  <span className="text-red-400 flex items-center"><TrendingDown className="w-3 h-3 mr-1"/> {downCount} Down</span>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
            {safeTopCoins.length > 0 ? (
               safeTopCoins.map(coin => <CoinRow key={coin.id} coin={coin} isSelected={false} onSelect={() => {}} />)
            ) : (
              <p className="text-gray-500 text-center mt-10">No market data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};