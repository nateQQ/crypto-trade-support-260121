import React, { useState, useRef } from 'react';
import { Upload, X, ArrowRight, AlertTriangle, CheckCircle, TrendingUp, Clock, Layers } from 'lucide-react';
import { analyzeChartImage } from '../services/geminiService';
import { AnalysisResult, PositionDirection } from '../types';

interface UploadBoxProps {
  label: string;
  file: File | null;
  preview: string | null;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const UploadBox: React.FC<UploadBoxProps> = ({ label, file, preview, onSelect, onClear, inputRef }) => (
  <div className="flex flex-col space-y-2">
    <span className="text-sm font-semibold text-gray-400">{label}</span>
    {!preview ? (
      <div 
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-600 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-700/30 transition-all group"
      >
        <Upload className="w-8 h-8 text-gray-500 group-hover:text-blue-400 mb-2" />
        <span className="text-xs text-gray-400 group-hover:text-gray-200">Upload Chart</span>
        <input type="file" ref={inputRef} onChange={onSelect} accept="image/*" className="hidden" />
      </div>
    ) : (
      <div className="relative rounded-xl overflow-hidden border border-gray-600 h-40 bg-black">
        <img src={preview} alt={label} className="w-full h-full object-contain" />
        <button onClick={onClear} className="absolute top-1 right-1 bg-gray-900/80 p-1 rounded-full hover:bg-red-900/80 text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>
);

export const ChartAnalyzer: React.FC = () => {
  const [files, setFiles] = useState<{ file15m: File | null, file1h: File | null }>({ file15m: null, file1h: null });
  const [previews, setPreviews] = useState<{ p15m: string | null, p1h: string | null }>({ p15m: null, p1h: null });
  const [context, setContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const ref15m = useRef<HTMLInputElement>(null);
  const ref1h = useRef<HTMLInputElement>(null);

  const handleSelect = (key: '15m' | '1h') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (key === '15m') {
        setFiles(prev => ({ ...prev, file15m: file }));
        setPreviews(prev => ({ ...prev, p15m: URL.createObjectURL(file) }));
      } else {
        setFiles(prev => ({ ...prev, file1h: file }));
        setPreviews(prev => ({ ...prev, p1h: URL.createObjectURL(file) }));
      }
      setResult(null);
    }
  };

  const clearFile = (key: '15m' | '1h') => {
    if (key === '15m') {
      setFiles(prev => ({ ...prev, file15m: null }));
      setPreviews(prev => ({ ...prev, p15m: null }));
    } else {
      setFiles(prev => ({ ...prev, file1h: null }));
      setPreviews(prev => ({ ...prev, p1h: null }));
    }
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!files.file15m && !files.file1h) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeChartImage(files, context);
      setResult(analysis);
    } catch (error) {
      alert("Analysis failed. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center">
            <Layers className="w-5 h-5 mr-2 text-blue-400" />
            1. Dual Chart Input
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <UploadBox label="15m (Entry)" file={files.file15m} preview={previews.p15m} onSelect={handleSelect('15m')} onClear={() => clearFile('15m')} inputRef={ref15m} />
            <UploadBox label="1h (Trend)" file={files.file1h} preview={previews.p1h} onSelect={handleSelect('1h')} onClear={() => clearFile('1h')} inputRef={ref1h} />
          </div>

          <div className="space-y-4">
            <textarea
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 h-20"
              placeholder="Additional context..."
              value={context}
              onChange={e => setContext(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!files.file15m && !files.file1h)}
              className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center transition-all shadow-lg ${
                isAnalyzing ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
              {isAnalyzing ? "Processing Images..." : "Run Synthesized Analysis"}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        {result ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 h-full shadow-2xl animate-in fade-in slide-in-from-right-4">
             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" /> Analysis Result
                </h2>
                <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">Synthesized Analysis</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center ${
                  result.recommendation.direction === PositionDirection.LONG ? 'bg-green-900/20 border-green-500/50 text-green-400' :
                  result.recommendation.direction === PositionDirection.SHORT ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-gray-700/20 border-gray-600 text-gray-400'
                }`}>
                  <span className="text-3xl font-black">{result.recommendation.direction}</span>
                  <span className="text-xs uppercase mt-1 opacity-70">Confidence: {result.recommendation.confidence}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                   <div className="bg-gray-900 p-2 rounded-lg border border-gray-700"><p className="text-gray-500">Entry</p><p className="font-bold text-blue-400">{result.recommendation.entryPrice}</p></div>
                   <div className="bg-gray-900 p-2 rounded-lg border border-gray-700"><p className="text-gray-500">Target</p><p className="font-bold text-green-400">{result.recommendation.targetPrice}</p></div>
                   <div className="bg-gray-900 p-2 rounded-lg border border-gray-700"><p className="text-gray-500">Stop</p><p className="font-bold text-red-400">{result.recommendation.stopLoss}</p></div>
                   <div className="bg-gray-900 p-2 rounded-lg border border-gray-700"><p className="text-gray-500">P/L</p><p className="font-bold text-yellow-400">{result.recommendation.pnlProjection}</p></div>
                </div>
             </div>

             <div className="space-y-4">
               <div>
                 <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Dual-Timeframe MACD</h3>
                 <p className="text-sm text-gray-300 leading-relaxed bg-purple-900/10 p-3 rounded-lg border border-purple-500/20">{result.recommendation.macdStatus}</p>
               </div>
               <div>
                 <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Synthesized Rationale</h3>
                 <p className="text-sm text-gray-400 leading-relaxed bg-gray-900/50 p-3 rounded-lg border border-gray-700 whitespace-pre-wrap">{result.recommendation.reasoning}</p>
               </div>
             </div>
          </div>
        ) : (
          <div className="h-full bg-gray-800/50 rounded-xl border border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 p-12">
            <TrendingUp className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-center">Upload both timeframes for a professional-grade synthesis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);