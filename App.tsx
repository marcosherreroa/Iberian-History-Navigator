
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchHistoricalData } from './services/geminiService';
import { HistoryData, HistoricalEntity } from './types';
import HistoricalMap from './components/HistoricalMap';
import { History, Calendar, Search, Loader2, Info, X, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [year, setYear] = useState<number>(2024);
  const [inputValue, setInputValue] = useState<string>("2024");
  const [loading, setLoading] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<HistoricalEntity | null>(null);
  
  // Track ongoing requests to prevent race conditions
  const requestIdRef = useRef<number>(0);

  const loadHistory = useCallback(async (targetYear: number) => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setSelectedEntity(null);

    try {
      const data = await fetchHistoricalData(targetYear);
      
      // Only update state if this is still the most recent request
      if (currentRequestId === requestIdRef.current) {
        setHistoryData(data);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError("Failed to load historical data.");
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadHistory(2024);
  }, [loadHistory]);

  const handleYearChange = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue.trim().toUpperCase();
    let numericYear = 0;

    if (val.endsWith('BC')) {
      numericYear = -parseInt(val.replace('BC', '').trim());
    } else if (val.endsWith('CE')) {
      numericYear = parseInt(val.replace('CE', '').trim());
    } else {
      numericYear = parseInt(val);
    }

    if (isNaN(numericYear) || numericYear < -3000 || numericYear > 2026) {
      setError("Valid range: 3000 BC to 2026 CE");
      return;
    }

    setYear(numericYear);
    loadHistory(numericYear);
  };

  const getYearLabel = (y: number) => {
    if (y < 0) return `${Math.abs(y)} BC`;
    return `${y} CE`;
  };

  return (
    <div className="flex flex-col h-screen w-full font-sans text-slate-900 overflow-hidden relative">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-[1000] p-4 flex flex-col md:flex-row justify-between items-start gap-4 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-200 pointer-events-auto w-full md:max-w-xs overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <History className="text-indigo-600 w-6 h-6 shrink-0" />
            <h1 className="text-lg font-bold tracking-tight text-slate-800 truncate">Iberia Chronos</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Instant Explorer</p>
          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-2 leading-tight">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2">
              Results are cached for instant navigation between eras.
            </p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-200 pointer-events-auto w-full md:w-auto md:min-w-[320px] overflow-hidden">
          <form onSubmit={handleYearChange} className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Year (e.g. 711 or 300 BC)"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-2.5 rounded-xl transition-all shadow-lg active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </form>

          {error && <div className="text-[10px] text-rose-600 font-bold mb-2 bg-rose-50 p-1.5 rounded border border-rose-100 text-center">{error}</div>}

          <div className="flex items-center justify-around bg-slate-50/50 rounded-xl p-2 border border-slate-100">
             <div className="text-center px-2">
               <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Selected Era</span>
               <span className="text-base font-black text-indigo-700 tabular-nums">
                 {historyData?.label || getYearLabel(year)}
               </span>
             </div>
             <div className="h-6 w-[1px] bg-slate-200" />
             <div className="text-center px-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Entities</span>
                <span className="text-base font-black text-slate-700">
                  {historyData?.entities.length || 0}
                </span>
             </div>
          </div>
        </div>
      </header>

      {/* Detail Panel */}
      {selectedEntity && (
        <div className="absolute left-4 bottom-20 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-[1001] w-[calc(100%-2rem)] md:w-80 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 pointer-events-auto overflow-hidden animate-in slide-in-from-left duration-300">
            <div className="p-1 h-1" style={{ backgroundColor: selectedEntity.color }} />
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-black text-slate-800 leading-tight pr-4">
                  {selectedEntity.name}
                </h2>
                <button 
                  onClick={() => setSelectedEntity(null)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium text-sm">
                {selectedEntity.description}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between opacity-50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Historical Record</span>
                <ChevronRight className="w-3 h-3 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Map */}
      <main className="flex-1 w-full bg-slate-100 relative">
        <HistoricalMap 
          entities={historyData?.entities || []} 
          onSelectEntity={setSelectedEntity}
          selectedEntityName={selectedEntity?.name}
        />
        
        {/* Subtle Map Overlay Loading indicator for cached/partial updates */}
        {loading && historyData && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-slate-100 flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Updating Borders...</span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 left-6 right-6 md:left-auto z-[1000] pointer-events-none flex justify-center md:justify-end">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-slate-200 pointer-events-auto flex items-center gap-4">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Optimized Engine v2.0
          </span>
        </div>
      </footer>

      {/* Full Overlay for first load or major changes */}
      {loading && !historyData && (
        <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-sm z-[2000] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-slate-800 tracking-tight">Accessing History</h3>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 italic">Generating Map...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
