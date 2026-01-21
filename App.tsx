import React from 'react';
import { Header } from './components/Header';
import { MarketOverview } from './components/MarketOverview';
import { ChartAnalyzer } from './components/ChartAnalyzer';
import { ApiKeyWarning } from './components/ApiKeyModal';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-20">
      <ApiKeyWarning />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
           <h1 className="text-3xl font-bold text-white mb-2">Daily Trading Dashboard</h1>
           <p className="text-gray-400">Monitor trends for SUI, SOL, BERA and analyze Binance charts for MACD setups.</p>
        </div>

        {/* Top Section: Data & Sentiment */}
        <section className="mb-10">
          <MarketOverview />
        </section>

        {/* Core Feature: Image Analysis */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
             <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
             <h2 className="text-2xl font-bold text-white">Technical Analysis Engine</h2>
          </div>
          <ChartAnalyzer />
        </section>
      </main>

      <footer className="border-t border-gray-800 mt-12 py-8 bg-gray-900 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} CryptoTrade AI Support. Use at your own risk.</p>
      </footer>
    </div>
  );
};

export default App;
