import React from 'react';
import { ShoppingCart, Database, PlayCircle, BarChart3, Server, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dataset', label: 'Dataset Studio', icon: Database, badge: 'Step 1' },
    { id: 'mining', label: 'Mining Studio', icon: PlayCircle, badge: 'Step 2' },
    { id: 'rules', label: 'Rules & Insights', icon: BarChart3, badge: 'Step 3' },
    { id: 'hadoop', label: 'Hadoop Architecture', icon: Server, badge: 'Engine' },
  ];

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 shadow-lg shadow-orange-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  MarketBasket
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 border border-orange-400/30 text-orange-300 uppercase tracking-wider">
                  Apriori AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Hadoop MapReduce Multi-Pass Analytics
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="flex items-center p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Engine Status Badge */}
          <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold tracking-wide">MapReduce Streaming Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
