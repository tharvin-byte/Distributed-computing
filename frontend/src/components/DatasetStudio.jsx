import React, { useState } from 'react';
import { Plus, Trash2, Upload, Sparkles, RefreshCw, FileText, Check, ArrowRight, Database } from 'lucide-react';
import { addItem, deleteItem, generateDataset, uploadDataset, fetchDatasetInfo } from '../services/api';

export default function DatasetStudio({
  items,
  setItems,
  datasetInfo,
  setDatasetInfo,
  datasetList,
  refreshDatasetList,
  onProceedToMining
}) {
  const [newItemName, setNewItemName] = useState('');
  const [generateRows, setGenerateRows] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const updated = await addItem(newItemName.trim());
      setItems(updated);
      setNewItemName('');
    } catch (err) {
      alert(`Error adding item: ${err.message}`);
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      const updated = await deleteItem(item);
      setItems(updated);
    } catch (err) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const info = await generateDataset(generateRows);
      setDatasetInfo(info);
      await refreshDatasetList();
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadMessage(null);
    try {
      const info = await uploadDataset(file);
      setDatasetInfo(info);
      await refreshDatasetList();
      setUploadMessage({ type: 'success', text: `Uploaded "${file.name}" successfully!` });
    } catch (err) {
      setUploadMessage({ type: 'error', text: `Upload failed: ${err.message}` });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSelectDataset = async (name) => {
    try {
      const info = await fetchDatasetInfo(name);
      setDatasetInfo(info);
    } catch (err) {
      alert(`Could not load dataset info: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Grid: Item Catalog & Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Master Store Item Catalog */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-7 backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Store Item Catalog</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Master inventory items used by the generator to synthesize transactions
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono">
              {items.length} items
            </span>
          </div>

          {/* Add Item Input Form */}
          <form onSubmit={handleAddItem} className="flex gap-2.5">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. coffee, avocado, milk..."
              className="flex-1 bg-slate-950 border border-white/10 text-white placeholder-slate-400 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition shadow-inner"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-orange-600/30 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Item Badges List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Inventory Items:
            </span>
            <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
              {items.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 border border-white/10 text-slate-100 text-xs font-medium rounded-xl hover:border-orange-400/40 transition group shadow-sm"
                >
                  <span className="capitalize">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    className="text-slate-400 hover:text-red-400 transition"
                    title={`Remove ${item}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-slate-400 py-4 italic">
                  No items in catalog. Add items above to populate the inventory.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Dataset Generator & Upload */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-7 backdrop-blur-xl shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Generate or Upload Dataset</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Create variable-length retail baskets or upload your own files
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>

            {/* Slider Row */}
            <div className="space-y-3 mb-6 p-4 rounded-2xl bg-slate-950/60 border border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-semibold">Synthetic Baskets to Generate</span>
                <span className="px-2.5 py-1 rounded-md bg-orange-500/20 text-orange-300 font-mono font-bold text-sm border border-orange-500/30">
                  {generateRows.toLocaleString()} baskets
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={generateRows}
                onChange={(e) => setGenerateRows(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || items.length === 0}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-orange-600/25 cursor-pointer active:scale-[0.99]"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating Baskets...' : 'Generate Synthetic Dataset'}</span>
              </button>
            </div>

            {/* Upload Box */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Or Upload Custom CSV / JSON:
              </span>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="csv-file-upload"
                />
                <label
                  htmlFor="csv-file-upload"
                  className="flex items-center justify-center gap-2.5 p-4 border-2 border-dashed border-white/15 hover:border-orange-400 bg-slate-950/60 rounded-2xl cursor-pointer text-xs font-medium text-slate-300 hover:text-white transition"
                >
                  <Upload className="w-4 h-4 text-orange-400" />
                  <span>{isUploading ? 'Uploading & parsing file...' : 'Drop CSV / JSON file or click to browse'}</span>
                </label>
              </div>
              {uploadMessage && (
                <p className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                  uploadMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  {uploadMessage.text}
                </p>
              )}
            </div>
          </div>

          {/* Active dataset selector */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Active Dataset:</span>
            <select
              value={datasetInfo?.dataset_name || ''}
              onChange={(e) => handleSelectDataset(e.target.value)}
              className="bg-slate-950 border border-white/15 text-slate-100 font-semibold px-3 py-1.5 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {datasetList.map((ds) => (
                <option key={ds.name} value={ds.name}>
                  {ds.name} ({ds.total_transactions.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Card: Transaction Preview Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Transaction Preview: <span className="text-orange-400 font-mono">{datasetInfo?.dataset_name}</span>
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Showing first {datasetInfo?.sample_transactions?.length || 0} sample baskets out of{' '}
              <strong className="text-white font-mono">{datasetInfo?.total_transactions?.toLocaleString() || 0}</strong> total transactions
            </p>
          </div>

          <button
            type="button"
            onClick={onProceedToMining}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-orange-600/25 cursor-pointer active:scale-95"
          >
            <span>Configure & Mine Rules</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* High-Contrast Striped Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 border-b border-white/10 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3 w-24">Basket #</th>
                <th className="px-5 py-3 w-28">Item Count</th>
                <th className="px-5 py-3">Purchased Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900/60 font-medium">
              {datasetInfo?.sample_transactions?.map((tx, idx) => (
                <tr key={idx} className="hover:bg-white/[0.04] transition">
                  <td className="px-5 py-3 font-mono text-orange-400 font-bold">
                    #{idx + 1}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-slate-200 font-mono">
                      {tx.length} items
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {tx.map((item, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-400/20 text-orange-200 text-xs font-semibold capitalize"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {(!datasetInfo?.sample_transactions || datasetInfo.sample_transactions.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                    No transactions to display. Generate or select a dataset above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
