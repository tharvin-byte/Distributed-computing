import React, { useState } from 'react';
import { Layers, Search, Filter } from 'lucide-react';

export default function FrequentItemsetsView({ frequentItemsets }) {
  const [selectedLength, setSelectedLength] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const lengths = Array.from(new Set(frequentItemsets.map((f) => f.length))).sort((a, b) => a - b);

  const filtered = frequentItemsets.filter((f) => {
    const matchesLength = selectedLength === 'all' || f.length === Number(selectedLength);
    const matchesSearch =
      searchQuery === '' ||
      f.itemset.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLength && matchesSearch;
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-400" />
            <span>Frequent Itemsets ({filtered.length} of {frequentItemsets.length})</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Itemsets satisfying the minimum support threshold, discovered sequentially across MapReduce passes
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 text-slate-100 placeholder-slate-400 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Length filter dropdown */}
          <select
            value={selectedLength}
            onChange={(e) => setSelectedLength(e.target.value)}
            className="bg-slate-950 border border-white/15 text-slate-100 font-semibold text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">All Sizes (k)</option>
            {lengths.map((len) => (
              <option key={len} value={len}>
                {len}-itemsets
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* High-Contrast Itemsets Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-300 border-b border-white/10 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3 w-20">Size (k)</th>
              <th className="px-5 py-3">Discovered Itemset</th>
              <th className="px-5 py-3 w-36">Support Count</th>
              <th className="px-5 py-3 w-48">Support % of Baskets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-slate-900/60 font-medium">
            {filtered.map((item, idx) => (
              <tr key={idx} className="hover:bg-white/[0.04] transition">
                <td className="px-5 py-3 font-mono text-orange-400 font-bold">
                  k={item.length}
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.itemset.map((val, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-400/25 text-orange-200 text-xs font-semibold capitalize"
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 font-mono font-bold text-white text-sm">
                  {item.support.toLocaleString()}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, item.support_pct)}%` }}
                      />
                    </div>
                    <span className="font-mono text-slate-200 font-bold w-12 text-right">
                      {item.support_pct}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  No frequent itemsets match the current criteria. Run mining to populate results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
