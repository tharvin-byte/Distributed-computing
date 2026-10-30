import React, { useState } from 'react';
import { Play, RotateCw, CheckCircle2, AlertTriangle, Layers, Clock, ArrowRight, Sliders, Sparkles } from 'lucide-react';
import { runMining } from '../services/api';

export default function MiningStudio({
  datasetInfo,
  jobStatus,
  setJobStatus,
  onMiningStarted,
  onViewRules
}) {
  const totalTx = datasetInfo?.total_transactions || 1000;
  const defaultMinSupport = Math.max(2, Math.floor(totalTx * 0.18)); // 18% support for optimal rule discovery

  const [minSupport, setMinSupport] = useState(defaultMinSupport);
  const [minConfidence, setMinConfidence] = useState(40); // 40% default for rich association rule discovery
  const [maxLength, setMaxLength] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportPct = ((minSupport / totalTx) * 100).toFixed(1);

  const handleStartMining = async () => {
    setIsSubmitting(true);
    try {
      const initialJob = await runMining({
        dataset_name: datasetInfo?.dataset_name || 'csv_dataset_sample.csv',
        min_support: Number(minSupport),
        min_confidence: Number(minConfidence) / 100.0,
        max_itemset_length: Number(maxLength)
      });
      setJobStatus(initialJob);
      onMiningStarted(initialJob.job_id);
    } catch (err) {
      alert(`Failed to start mining job: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRunning = jobStatus?.status === 'running' || jobStatus?.status === 'pending';
  const isCompleted = jobStatus?.status === 'completed';
  const isFailed = jobStatus?.status === 'failed';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Parameter Configuration Card */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-5">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-400" />
              <span>Apriori Mining Configuration</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Configure support and confidence thresholds for sequential MapReduce candidate generation & pruning
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-white/10 text-xs font-semibold text-slate-200">
            Target Dataset: <strong className="text-orange-400 font-mono">{datasetInfo?.dataset_name}</strong> ({totalTx.toLocaleString()} tx)
          </span>
        </div>

        {/* 3 Parameter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Minimum Support Slider */}
          <div className="p-5 bg-slate-950/70 border border-white/10 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Minimum Support</span>
              <span className="px-2.5 py-1 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-300 font-mono font-bold text-sm">
                {minSupport} ({supportPct}%)
              </span>
            </div>
            <input
              type="range"
              min="2"
              max={totalTx}
              value={minSupport}
              disabled={isRunning}
              onChange={(e) => setMinSupport(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <p className="text-xs text-slate-400 leading-relaxed">
              Minimum number of baskets containing an itemset for it to be deemed frequent and kept for next pass.
            </p>
          </div>

          {/* Minimum Confidence Slider */}
          <div className="p-5 bg-slate-950/70 border border-white/10 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Minimum Confidence</span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-sm">
                {minConfidence}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={minConfidence}
              disabled={isRunning}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <p className="text-xs text-slate-400 leading-relaxed">
              Conditional probability threshold: P(Buy B | Bought A) must meet or exceed this percentage.
            </p>
          </div>

          {/* Max Itemset Length */}
          <div className="p-5 bg-slate-950/70 border border-white/10 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Max Itemset Size (k)</span>
              <span className="px-2.5 py-1 rounded-md bg-orange-600/20 border border-orange-600/30 text-orange-300 font-mono font-bold text-sm">
                Up to {maxLength}-itemsets
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              value={maxLength}
              disabled={isRunning}
              onChange={(e) => setMaxLength(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <p className="text-xs text-slate-400 leading-relaxed">
              Maximum multi-pass passes to compute before automatically stopping candidate generation.
            </p>
          </div>
        </div>

        {/* Action Button & Status Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-white/5">
          <div className="text-xs">
            {isRunning && (
              <span className="inline-flex items-center gap-2.5 text-orange-400 font-semibold">
                <RotateCw className="w-4 h-4 animate-spin text-orange-400" />
                Executing MapReduce Pass {jobStatus?.current_pass || 1}...
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Mining completed! {jobStatus.frequent_itemsets.length} frequent itemsets and {jobStatus.rules.length} association rules discovered.
              </span>
            )}
            {isFailed && (
              <span className="inline-flex items-center gap-2 text-red-400 font-semibold">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Error: {jobStatus.error}
              </span>
            )}
            {!jobStatus && (
              <span className="text-slate-400">
                Ready to execute MapReduce streaming passes.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartMining}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2.5 px-7 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition shadow-xl shadow-orange-600/30 cursor-pointer active:scale-95"
          >
            {isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Running MapReduce Passes...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Apriori Mining</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Multi-Pass Execution Stepper & Progress */}
      {jobStatus && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Sequential MapReduce Passes Timeline
              </h3>
            </div>
            {isCompleted && (
              <button
                type="button"
                onClick={onViewRules}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
              >
                <span>View Discovered Association Rules</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Pass Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {jobStatus.pass_metrics.map((pass) => (
              <div
                key={pass.pass_number}
                className="p-5 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400 font-mono">
                    Pass {pass.pass_number} (k={pass.pass_number})
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {pass.duration_seconds}s
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Frequent Itemsets:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {pass.frequent_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Pruned Candidates:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {pass.discarded_count}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-full" />
                </div>
              </div>
            ))}

            {isRunning && (
              <div className="p-5 bg-slate-950/40 border-2 border-dashed border-orange-500/40 rounded-2xl flex flex-col justify-center items-center text-center space-y-2">
                <RotateCw className="w-6 h-6 text-orange-400 animate-spin" />
                <span className="text-xs font-bold text-orange-300">
                  Executing Pass {jobStatus.current_pass}...
                </span>
                <span className="text-[11px] text-slate-400">Streaming candidate combinations</span>
              </div>
            )}
          </div>

          {/* Execution Summary Box */}
          {isCompleted && (
            <div className="p-4 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <strong className="text-white font-semibold">Algorithm Conclusion: </strong>
                All passes finished in{' '}
                <span className="text-orange-400 font-mono font-bold">
                  {jobStatus.pass_metrics.reduce((acc, p) => acc + p.duration_seconds, 0).toFixed(2)}s
                </span>.
                Pruning halted further iterations at pass {jobStatus.pass_metrics.length} because no further candidates exceeded minimum support.
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold font-mono border border-orange-500/30 whitespace-nowrap">
                {jobStatus.rules.length} Rules Generated
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
