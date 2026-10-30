import React, { useState } from 'react';
import { Sparkles, Download, ArrowRight, Info, Search, HelpCircle, TrendingUp } from 'lucide-react';

export default function RulesExplorer({ rules }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('lift'); // 'lift', 'confidence', 'support'
  const [minLiftFilter, setMinLiftFilter] = useState(0);

  const filtered = rules
    .filter((r) => {
      const matchSearch =
        search === '' ||
        r.antecedent.some((i) => i.toLowerCase().includes(search.toLowerCase())) ||
        r.consequent.some((i) => i.toLowerCase().includes(search.toLowerCase()));
      const matchLift = r.lift >= Number(minLiftFilter);
      return matchSearch && matchLift;
    })
    .sort((a, b) => {
      if (sortBy === 'lift') return b.lift - a.lift;
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'support') return b.support_count - a.support_count;
      return 0;
    });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market_basket_rules_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Antecedent', 'Consequent', 'Support_Count', 'Support_Pct', 'Confidence', 'Lift'];
    const rows = rules.map((r) => [
      `"${r.antecedent.join(', ')}"`,
      `"${r.consequent.join(', ')}"`,
      r.support_count,
      r.support_pct,
      r.confidence,
      r.lift
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market_basket_rules_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Bar with Metrics and Export */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Association Rules ({filtered.length} of {rules.length})</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Derived customer affinity rules: purchase probability (Confidence) and cross-sell strength (Lift)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={exportCSV}
              disabled={rules.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 text-xs rounded-xl border border-white/10 font-semibold transition cursor-pointer active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={exportJSON}
              disabled={rules.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white text-xs rounded-xl font-semibold transition cursor-pointer active:scale-95 shadow-md shadow-orange-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Filters and search row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items in rule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 text-slate-100 placeholder-slate-400 px-3.5 py-2 rounded-xl focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">Min Lift:</span>
              <select
                value={minLiftFilter}
                onChange={(e) => setMinLiftFilter(Number(e.target.value))}
                className="bg-slate-950 border border-white/15 text-slate-100 font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <option value={0}>All Rules (Lift &ge; 0)</option>
                <option value={1}>Lift &ge; 1.0 (Positive)</option>
                <option value={1.2}>Lift &ge; 1.2 (High Affinity)</option>
                <option value={1.5}>Lift &ge; 1.5 (Very High)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-white/15 text-slate-100 font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <option value="lift">Highest Lift Factor</option>
                <option value="confidence">Highest Confidence</option>
                <option value="support">Highest Support</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 border-b border-white/10 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5 w-14">#</th>
                <th className="px-5 py-3.5">Antecedent (If Customer Buys)</th>
                <th className="px-2 py-3.5 w-8 text-center">&rArr;</th>
                <th className="px-5 py-3.5">Consequent (Also Likely Buys)</th>
                <th className="px-5 py-3.5 w-32">Support</th>
                <th className="px-5 py-3.5 w-36">Confidence</th>
                <th className="px-5 py-3.5 w-40">Lift Correlation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900/60 font-medium">
              {filtered.map((rule, idx) => {
                const isHighLift = rule.lift >= 1.2;
                const isModerateLift = rule.lift >= 1.0 && rule.lift < 1.2;
                return (
                  <tr key={idx} className="hover:bg-white/[0.04] transition">
                    <td className="px-5 py-3.5 text-slate-400 font-mono font-bold">
                      #{idx + 1}
                    </td>

                    {/* Antecedent */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {rule.antecedent.map((item, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-400/25 text-orange-200 font-semibold capitalize"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-2 py-3.5 text-center text-orange-400 font-bold text-sm">
                      &rarr;
                    </td>

                    {/* Consequent */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {rule.consequent.map((item, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/25 text-amber-200 font-semibold capitalize"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Support */}
                    <td className="px-5 py-3.5 font-mono">
                      <div className="font-bold text-white text-sm">{rule.support_count.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{rule.support_pct}% of baskets</div>
                    </td>

                    {/* Confidence */}
                    <td className="px-5 py-3.5 font-mono">
                      <div className="font-bold text-amber-400 text-sm">
                        {(rule.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
                          style={{ width: `${rule.confidence * 100}%` }}
                        />
                      </div>
                    </td>

                    {/* Lift */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-white text-base">
                          {rule.lift.toFixed(2)}x
                        </span>
                        {isHighLift && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold uppercase tracking-wider">
                            Strong
                          </span>
                        )}
                        {isModerateLift && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-wider">
                            Positive
                          </span>
                        )}
                        {rule.lift < 1.0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 border border-white/10 text-slate-400 font-medium">
                            Neutral
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No association rules found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metric Interpretations Callout Box */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Info className="w-4 h-4 text-orange-400" />
          <span>Interpreting Retail Affinity Metrics</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <strong className="text-orange-300 font-semibold text-xs block">Support Count & %</strong>
            <p className="text-xs text-slate-300 leading-relaxed">
              Measures popularity: how frequently the combined itemset appears across all transactions in the store.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <strong className="text-amber-300 font-semibold text-xs block">Confidence %</strong>
            <p className="text-xs text-slate-300 leading-relaxed">
              Conditional probability: given that a basket contains item A, the probability that item B is also present.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <strong className="text-emerald-300 font-semibold text-xs block">Lift Correlation</strong>
            <p className="text-xs text-slate-300 leading-relaxed">
              True affinity factor: Lift &gt; 1 indicates item A increases purchases of B beyond random baseline coincidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
