import React, { useState, useEffect } from 'react';
import {
  Server,
  Terminal,
  Code2,
  GitBranch,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { fetchHadoopInfo } from '../services/api';

export default function HadoopArchitectureView({ datasetInfo, miningParams }) {
  const [hadoopData, setHadoopData] = useState(null);
  const [activeCodeTab, setActiveCodeTab] = useState('driver');
  const [activeStageStep, setActiveStageStep] = useState(2);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [commandMode, setCommandMode] = useState('driver'); // 'driver' or 'single'

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchHadoopInfo();
        setHadoopData(data);
      } catch (err) {
        console.error('Failed to load Hadoop info:', err);
      }
    }
    load();
  }, []);

  const datasetName = datasetInfo?.dataset_name || 'csv_dataset.csv';
  const minSupport = miningParams?.min_support || 250;
  const reducers = 1;

  const singlePassCommand = `export HADOOP_STREAMING_JAR="$HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-3.x.x.jar"

hadoop jar $HADOOP_STREAMING_JAR \\
  -D mapreduce.job.name="market-basket-apriori-pass-1" \\
  -D mapreduce.job.reduces=${reducers} \\
  -input /data/market-basket/${datasetName} \\
  -output /results/market-basket/pass-1 \\
  -mapper "python3 mapper.py --itemset-length 1 --discarded-file discarded_items.json --input-format csv" \\
  -reducer "python3 reducer.py --minimum-support ${minSupport}" \\
  -files mapper.py,reducer.py,discarded_items.json`;

  const driverCommand = `export HADOOP_STREAMING_JAR="$HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-3.x.x.jar"

python3 src/hadoop_apriori.py /data/market-basket/${datasetName} \\
  --minimum-support ${minSupport} \\
  --output /results/market-basket \\
  --reducers ${reducers}`;

  const currentCommand = commandMode === 'driver' ? driverCommand : singlePassCommand;

  const copyToClipboard = (text, setCopiedState) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const stages = hadoopData?.architecture?.stages || [];
  const currentStage = stages.find((s) => s.step === activeStageStep) || stages[1];
  const activeScript = hadoopData?.scripts?.[activeCodeTab] || hadoopData?.scripts?.driver;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner with Double-Bezel Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-orange-950/40 via-slate-900/60 to-slate-950 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-400/30 text-orange-300 text-xs font-semibold uppercase tracking-wider">
              <Server className="w-3.5 h-3.5 text-orange-400" />
              <span>Hadoop MapReduce Architecture</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              How the Multi-Pass Apriori Engine Works on Hadoop
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              This repository pairs Apache Hadoop's distributed MapReduce streaming framework with Python workers to process massive retail transaction datasets. Below is a deep dive into the cluster execution flow, distributed cache pruning, and CLI orchestration.
            </p>
          </div>

          {/* Quick Architecture Pills */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Communication</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block font-mono">STDIN / STDOUT</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Cluster Cache</span>
              <span className="text-sm font-bold text-amber-400 mt-1 block font-mono">-files flag</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Map Workers</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block font-mono">Stateless (mapper.py)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Reduce Workers</span>
              <span className="text-sm font-bold text-amber-300 mt-1 block font-mono">Aggregator (reducer.py)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Interactive Visual Data Flow Pipeline */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              <span>MapReduce Distributed Pipeline Flow</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click on each sequential stage below to inspect its data contract, operations, and node roles
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Pass k &isin; [1..N]</span>
        </div>

        {/* Pipeline Stepper Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stages.map((stage) => {
            const isSelected = stage.step === activeStageStep;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setActiveStageStep(stage.step)}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 relative group ${
                  isSelected
                    ? 'bg-gradient-to-b from-orange-600/20 to-amber-900/30 border-orange-500/50 shadow-lg shadow-orange-500/15'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}
                  >
                    {stage.step}
                  </span>
                  {stage.step < 5 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:block" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{stage.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {stage.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Detailed Breakdown Card for Selected Stage */}
        {currentStage && (
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold font-mono">
                  Stage {currentStage.step} of 5
                </span>
                <h4 className="text-sm font-bold text-white">{currentStage.title}</h4>
              </div>
              <span className="text-xs text-amber-400 font-mono">Distributed Execution</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentStage.description}
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Multi-Pass Apriori & Distributed Cache Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Why Multi-Pass is Challenging on Hadoop */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">
              The Multi-Pass Challenge & Solution
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In standard MapReduce, jobs run as single independent batches. However, the <strong>Apriori Algorithm</strong> is inherently iterative:
          </p>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span>
                <strong>Stateless Workers:</strong> Hadoop Streaming spawns independent OS processes for each chunk. The mappers cannot maintain persistent global memory between passes.
              </span>
            </li>
            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span>
                <strong>Distributed Cache (<code className="text-amber-300 font-mono">-files</code>):</strong> At the start of pass $k$, the driver broadcasts the latest <code className="text-amber-300 font-mono">discarded_items.json</code> directly to all TaskTracker / NodeManager worker nodes.
              </span>
            </li>
            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>
                <strong>Anti-Monotone Pruning:</strong> If any subset of a candidate is in the discarded set, the candidate is dropped <em>before</em> emitting to shuffle/sort, drastically saving network I/O.
              </span>
            </li>
          </ul>
        </div>

        {/* Right: Live Hadoop Streaming Command Generator */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Live Hadoop CLI Command</h3>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setCommandMode('driver')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    commandMode === 'driver'
                      ? 'bg-orange-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Full Multi-Pass Driver
                </button>
                <button
                  type="button"
                  onClick={() => setCommandMode('single')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    commandMode === 'single'
                      ? 'bg-orange-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Pass Job
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Generated in real time using your current active settings: dataset <strong className="text-orange-400">{datasetName}</strong> and support threshold <strong className="text-amber-400">{minSupport}</strong>.
            </p>

            {/* Code Terminal Box */}
            <div className="relative rounded-2xl bg-slate-950 border border-white/10 p-4 font-mono text-xs overflow-x-auto text-slate-300">
              <pre className="whitespace-pre-wrap leading-relaxed">{currentCommand}</pre>

              <button
                type="button"
                onClick={() => copyToClipboard(currentCommand, setCopiedCommand)}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-[11px] font-sans font-medium transition"
              >
                {copiedCommand ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <Info className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              Tip: You can paste this command directly into your Hadoop terminal to run on an active cluster.
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: In-Browser Source Code Inspector */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-orange-400" />
              <span>Interactive Source Code Inspector</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect the real Python MapReduce scripts running behind this application
            </p>
          </div>

          {/* Script selector tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveCodeTab('driver')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeCodeTab === 'driver'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              hadoop_apriori.py (Driver)
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab('mapper')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeCodeTab === 'mapper'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              mapper.py (Map Worker)
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab('reducer')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeCodeTab === 'reducer'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              reducer.py (Reduce Worker)
            </button>
          </div>
        </div>

        {/* Script Role Pill */}
        {activeScript && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
            <div>
              <span className="text-slate-400">File: </span>
              <strong className="text-orange-300 font-mono">{activeScript.path}</strong>
              <span className="text-slate-400 ml-3">Role: </span>
              <span className="text-slate-200">{activeScript.role}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(activeScript.code, setCopiedCode)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Code Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Code viewer with custom styling */}
        <div className="rounded-2xl bg-slate-950 border border-white/10 p-5 font-mono text-xs overflow-x-auto max-h-[460px] overflow-y-auto text-slate-200 leading-relaxed">
          <pre>{activeScript?.code || '# Loading code...'}</pre>
        </div>
      </div>
    </div>
  );
}

