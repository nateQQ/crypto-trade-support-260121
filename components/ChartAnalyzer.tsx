import React, { useState, useRef } from 'react';
import { Upload, X, ArrowRight, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { analyzeChartImage } from '../services/geminiService';
import { AnalysisResult, PositionDirection } from '../types';

export const ChartAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // Reset previous result
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeChartImage(selectedFile, context);
      setResult(analysis);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* Upload Section */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">1. Upload Binance Chart</h2>
          <p className="text-sm text-gray-400 mb-4">
            Upload a 15m or 1h timeframe chart screenshot. Ensure MACD (12,26,9) is visible at the bottom.
          </p>
          
          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-700/30 transition-all group"
            >
              <Upload className="w-10 h-10 text-gray-500 group-hover:text-blue-400 mb-3" />
              <span className="text-gray-400 group-hover:text-gray-200">Click to upload screenshot</span>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-600">
              <img src={previewUrl} alt="Chart Preview" className="w-full h-auto object-cover max-h-96" />
              <button 
                onClick={clearFile}
                className="absolute top-2 right-2 bg-gray-900/80 p-1.5 rounded-full hover:bg-red-900/80 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {selectedFile && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-md font-semibold text-white mb-3">2. Add Context (Optional)</h3>
            <textarea
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-24"
              placeholder="E.g., Analyzing SUI 1h chart, looking for entry..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`w-full mt-4 py-3 rounded-lg font-bold text-white flex items-center justify-center transition-all ${
                isAnalyzing 
                  ? 'bg-blue-800 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]'
              }`}
            >
              {isAnalyzing ? (
                <>Loading AI Model...</>
              ) : (
                <>Analyze Chart with Gemini <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="lg:col-span-7">
        {result ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 h-full animate-in fade-in zoom-in-95">
             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                  Analysis Result
                </h2>
                <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center ${
                  result.recommendation.direction === PositionDirection.LONG 
                    ? 'bg-green-900/20 border-green-500/50 text-green-400'
                    : result.recommendation.direction === PositionDirection.SHORT
                    ? 'bg-red-900/20 border-red-500/50 text-red-400'
                    : 'bg-gray-700/20 border-gray-600 text-gray-400'
                }`}>
                  <span className="text-xs uppercase font-bold tracking-wider mb-1">Recommendation</span>
                  <span className="text-3xl font-black">{result.recommendation.direction}</span>
                  <span className="text-xs mt-2 opacity-80">{result.recommendation.trend} Trend Detected</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-500 mb-1">Entry Price</p>
                      <p className="font-mono font-bold text-blue-400">{result.recommendation.entryPrice}</p>
                   </div>
                   <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-500 mb-1">Target Price</p>
                      <p className="font-mono font-bold text-green-400">{result.recommendation.targetPrice}</p>
                   </div>
                   <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-500 mb-1">Stop Loss</p>
                      <p className="font-mono font-bold text-red-400">{result.recommendation.stopLoss}</p>
                   </div>
                   <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-500 mb-1">PnL Projection</p>
                      <p className="font-mono font-bold text-yellow-400">{result.recommendation.pnlProjection}</p>
                   </div>
                </div>
             </div>

             <div className="mb-6">
               <h3 className="text-sm font-bold text-white mb-2 flex items-center">
                 <Clock className="w-4 h-4 mr-2 text-purple-400" />
                 MACD Status
               </h3>
               <p className="text-sm text-gray-300 bg-purple-900/10 border border-purple-500/20 p-3 rounded-lg">
                 {result.recommendation.macdStatus}
               </p>
             </div>

             <div className="prose prose-invert max-w-none">
                <h3 className="text-sm font-bold text-white mb-2">Technical Rationale</h3>
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {result.recommendation.reasoning}
                </p>
             </div>
             
             <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex items-center text-xs text-yellow-500 bg-yellow-900/20 p-3 rounded border border-yellow-700/50">
                   <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                   <p>Confidence: {result.recommendation.confidence}. Trading carries risk. This is AI-generated technical analysis, not financial advice.</p>
                </div>
             </div>

          </div>
        ) : (
           <div className="h-full bg-gray-800/50 rounded-xl border border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 p-12">
              <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
              <p>Upload a chart and run analysis to see trading recommendations.</p>
           </div>
        )}
      </div>
    </div>
  );
};
