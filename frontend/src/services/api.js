const API_BASE = '/api';

export async function fetchItems() {
  const res = await fetch(`${API_BASE}/dataset/items`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addItem(item) {
  const res = await fetch(`${API_BASE}/dataset/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteItem(item) {
  const res = await fetch(`${API_BASE}/dataset/items/${encodeURIComponent(item)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDatasetList() {
  const res = await fetch(`${API_BASE}/dataset/list`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDatasetInfo(name) {
  const res = await fetch(`${API_BASE}/dataset/info?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateDataset(rows) {
  const res = await fetch(`${API_BASE}/dataset/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows: parseInt(rows, 10) }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadDataset(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/dataset/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function runMining(params) {
  const res = await fetch(`${API_BASE}/mining/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getJobStatus(jobId) {
  const res = await fetch(`${API_BASE}/mining/status/${jobId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getJobRules(jobId) {
  const res = await fetch(`${API_BASE}/mining/rules/${jobId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchHadoopInfo() {
  const res = await fetch(`${API_BASE}/hadoop/info`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


