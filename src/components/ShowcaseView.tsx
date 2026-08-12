import React, { useState } from 'react';
import { Play, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Terminal, TrendingUp } from 'lucide-react';

export const ShowcaseView: React.FC = () => {
  const [symbol, setSymbol] = useState('NVDA');
  const [quantity, setQuantity] = useState<number>(100);
  const [price, setPrice] = useState<number>(135.50);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');

  const [orderLogs, setOrderLogs] = useState<Array<{ id: string; time: string; text: string; status: 'executed' | 'risk_checked' | 'persisted' }>>([
    { id: '1', time: '10:14:02', text: 'ORDER ORD-782X: BOUGHT 50 AAPL @ $224.10 - EXECUTED (Latency 1.2ms)', status: 'executed' },
    { id: '2', time: '10:14:05', text: 'ORDER ORD-912M: SOLD 200 TSLA @ $210.50 - EXECUTED (Latency 1.4ms)', status: 'executed' }
  ]);

  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);

    setTimeout(() => {
      const newOrdId = 'ORD-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const timeStr = new Date().toLocaleTimeString();

      const newLog = {
        id: Date.now().toString(),
        time: timeStr,
        text: `ORDER ${newOrdId}: ${side} ${quantity} ${symbol} @ $${price.toFixed(2)} — EXECUTED & COMMITTED (Latency 1.1ms)`,
        status: 'executed' as const
      };

      setOrderLogs(prev => [newLog, ...prev]);
      setIsExecuting(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase mb-1">FINAL STAGE — GENERATED APPLICATION DEMO</div>
          <h1 className="text-2xl font-serif text-white uppercase font-bold">FINTECH TRADING ORDER MATCHING ENGINE</h1>
        </div>

        <span className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase rounded-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE ENGINE SANDBOX ONLINE</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Trading Form */}
        <div className="card-luxury p-6 rounded-sm space-y-6 border border-[#C5A059]/30">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h2 className="text-sm font-serif text-white uppercase font-semibold">PLACE ALGORITHMIC ORDER</h2>
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
          </div>

          <form onSubmit={handleExecuteOrder} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">ORDER SIDE</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2 text-xs font-mono font-bold uppercase rounded-xs border transition-all ${
                    side === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-black text-white/40 border-white/10'
                  }`}
                >
                  BUY (LONG)
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2 text-xs font-mono font-bold uppercase rounded-xs border transition-all ${
                    side === 'SELL'
                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                      : 'bg-black text-white/40 border-white/10'
                  }`}
                >
                  SELL (SHORT)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">ASSET SYMBOL</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
              >
                <option value="NVDA">NVDA — NVIDIA Corp</option>
                <option value="AAPL">AAPL — Apple Inc</option>
                <option value="TSLA">TSLA — Tesla Inc</option>
                <option value="AMZN">AMZN — Amazon.com</option>
                <option value="GOOGL">GOOGL — Alphabet Inc</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">QUANTITY</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">PRICE ($)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isExecuting}
              className={`w-full py-3 text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-all ${
                side === 'BUY' 
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                  : 'bg-red-500 text-white hover:bg-red-400'
              }`}
            >
              {isExecuting ? 'MATCHING ENGINE EXECUTING...' : `SUBMIT ${side} ORDER ($${(quantity * price).toFixed(2)})`}
            </button>
          </form>
        </div>

        {/* Live Matching Ledger Stream */}
        <div className="lg:col-span-2 card-luxury p-6 rounded-sm space-y-4 bg-[#0A0A0A] border border-white/10">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-[#C5A059]" />
              <h3 className="text-sm font-serif text-white uppercase font-semibold">ORDER BOOK LEDGER STREAM</h3>
            </div>
            <span className="text-[10px] font-mono text-white/40">REDIS RESP IN-MEMORY SNAPSHOT</span>
          </div>

          <div className="bg-black/90 p-4 rounded-xs border border-white/10 font-mono text-xs space-y-3 max-h-[360px] overflow-y-auto">
            {orderLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#121212] border border-white/5 rounded-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-emerald-400 font-medium">{log.text}</div>
                  <div className="text-[9px] text-white/30">{log.time} — Risk Scan: GEMINI PASSED</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
