const API = '/api';

export function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function fetchVideos() {
  const res = await fetch(`${API}/videos`);
  if (!res.ok) throw new Error('Failed to fetch videos');
  return res.json();
}

export async function addVideo(url, tagIds = []) {
  const res = await fetch(`${API}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, tags: tagIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add video');
  return data;
}

export async function deleteVideo(id) {
  const res = await fetch(`${API}/videos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete video');
}

export async function updateVideoTags(videoId, tagIds) {
  const res = await fetch(`${API}/videos/${videoId}/tags`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: tagIds }),
  });
  if (!res.ok) throw new Error('Failed to update tags');
  return res.json();
}

export async function fetchTags() {
  const res = await fetch(`${API}/tags`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export async function createTag(name, color) {
  const res = await fetch(`${API}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create tag');
  return data;
}

export async function deleteTag(id) {
  const res = await fetch(`${API}/tags/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete tag');
}
