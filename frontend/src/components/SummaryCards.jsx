import React from 'react';
import { Database, Tag, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';

export default function SummaryCards({ datasetInfo, jobStatus }) {
  const totalTx = datasetInfo?.total_transactions ?? 0;
  const uniqueItems = datasetInfo?.unique_items_count ?? 0;
  const frequentCount = jobStatus?.frequent_itemsets?.length ?? 0;
  const rulesCount = jobStatus?.rules?.length ?? 0;
  const strongRulesCount = (jobStatus?.rules ?? []).filter((r) => r.lift > 1.2).length;

  const cards = [
    {
      title: 'Active Dataset',
      value: totalTx.toLocaleString(),
      subtitle: datasetInfo?.dataset_name || 'No dataset loaded',
      badge: 'Transactions',
      icon: Database,
      gradient: 'from-orange-600/25 via-amber-600/10 to-transparent',
      borderColor: 'border-orange-500/35',
      iconColor: 'text-orange-400',
    },
    {
      title: 'Store Catalog',
      value: uniqueItems.toString(),
      subtitle: 'Distinct items in inventory',
      badge: 'Items',
      icon: Tag,
      gradient: 'from-amber-600/25 via-yellow-600/10 to-transparent',
      borderColor: 'border-amber-500/35',
      iconColor: 'text-amber-400',
    },
    {
      title: 'Frequent Itemsets',
      value: frequentCount.toString(),
      subtitle: jobStatus?.status === 'completed' ? `Across ${jobStatus.pass_metrics.length} passes` : 'Awaiting run',
      badge: jobStatus?.status === 'completed' ? 'Discovered' : 'Pending',
      icon: CheckCircle2,
      gradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Association Rules',
      value: rulesCount.toString(),
      subtitle: rulesCount > 0 ? `${strongRulesCount} high affinity (Lift > 1.2)` : 'Awaiting mining',
      badge: rulesCount > 0 ? `${strongRulesCount} Strong` : 'Rules',
      icon: Sparkles,
      gradient: 'from-orange-600/30 via-amber-600/15 to-transparent',
      borderColor: 'border-orange-500/40',
      iconColor: 'text-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl border ${card.borderColor} bg-slate-900/80 bg-gradient-to-br ${card.gradient} p-5 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-white/20 hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl bg-white/[0.05] border border-white/10 ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono tabular-nums">
                {card.value}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 font-semibold border border-white/10">
                {card.badge}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-300 font-medium truncate">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
