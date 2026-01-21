import React from 'react';
import { Activity, BarChart2 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">CryptoTrade AI</h1>
            <p className="text-xs text-gray-400">Daily Trading Support & MACD Analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
           <span className="flex items-center"><BarChart2 className="w-4 h-4 mr-1"/> Market Data: CoinGecko</span>
        </div>
      </div>
    </header>
  );
};
