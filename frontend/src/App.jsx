import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SummaryCards from './components/SummaryCards';
import DatasetStudio from './components/DatasetStudio';
import MiningStudio from './components/MiningStudio';
import FrequentItemsetsView from './components/FrequentItemsetsView';
import RulesExplorer from './components/RulesExplorer';
import HadoopArchitectureView from './components/HadoopArchitectureView';
import {
  fetchItems,
  fetchDatasetList,
  fetchDatasetInfo,
  getJobStatus
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dataset');
  const [items, setItems] = useState([]);
  const [datasetList, setDatasetList] = useState([]);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [loadedItems, loadedDatasets] = await Promise.all([
          fetchItems(),
          fetchDatasetList()
        ]);
        setItems(loadedItems);
        setDatasetList(loadedDatasets);

        // Pick default dataset
        const defaultName = loadedDatasets.find((d) => d.name === 'csv_dataset_sample.csv')
          ? 'csv_dataset_sample.csv'
          : loadedDatasets[0]?.name;

        if (defaultName) {
          const info = await fetchDatasetInfo(defaultName);
          setDatasetInfo(info);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const refreshDatasets = async () => {
    try {
      const list = await fetchDatasetList();
      setDatasetList(list);
    } catch (err) {
      console.error('Failed to refresh datasets:', err);
    }
  };

  // Poll for mining job updates
  useEffect(() => {
    if (!activeJobId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const status = await getJobStatus(activeJobId);
        if (!isMounted) return;
        setJobStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Job polling error:', err);
      }
    }, 700);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeJobId]);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col text-slate-100 selection:bg-orange-500 selection:text-white relative">
      {/* Subtle ambient lighting effects */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[350px] bg-orange-600/12 blur-[130px] pointer-events-none rounded-full" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[300px] bg-amber-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentJob={jobStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Metric Summary Cards */}
        <SummaryCards
          datasetInfo={datasetInfo}
          jobStatus={jobStatus}
        />

        {/* Tab 1: Dataset Studio */}
        {activeTab === 'dataset' && (
          <DatasetStudio
            items={items}
            setItems={setItems}
            datasetInfo={datasetInfo}
            setDatasetInfo={setDatasetInfo}
            datasetList={datasetList}
            refreshDatasetList={refreshDatasets}
            onProceedToMining={() => setActiveTab('mining')}
          />
        )}

        {/* Tab 2: Mining Studio */}
        {activeTab === 'mining' && (
          <MiningStudio
            datasetInfo={datasetInfo}
            jobStatus={jobStatus}
            setJobStatus={setJobStatus}
            onMiningStarted={(jobId) => setActiveJobId(jobId)}
            onViewRules={() => setActiveTab('rules')}
          />
        )}

        {/* Tab 3: Rules & Analytics */}
        {activeTab === 'rules' && (
          <div className="space-y-8">
            <RulesExplorer rules={jobStatus?.rules || []} />
            <FrequentItemsetsView
              frequentItemsets={jobStatus?.frequent_itemsets || []}
            />
          </div>
        )}

        {/* Tab 4: Hadoop Architecture & Implementation Showcase */}
        {activeTab === 'hadoop' && (
          <HadoopArchitectureView
            datasetInfo={datasetInfo}
            miningParams={jobStatus?.mining_params}
          />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-white/5 bg-slate-950/80 backdrop-blur-md py-6 text-center text-xs text-slate-400 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-300">
            Python Hadoop MapReduce Market Basket Analysis &bull; Multi-Pass Apriori Mining
          </p>
          <p className="text-slate-400 font-mono text-[11px]">
            Hadoop Streaming (STDIN/STDOUT) &bull; Distributed Cache Pruning
          </p>
        </div>
      </footer>
    </div>
  );
}
