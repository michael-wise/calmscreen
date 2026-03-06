const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

// Serve frontend build in production
const staticPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(staticPath));

function extractYouTubeId(url) {
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

async function getVideoTags(videoId) {
  return db.all(
    'SELECT t.id, t.name, t.color FROM tags t JOIN video_tags vt ON t.id = vt.tag_id WHERE vt.video_id = $1',
    [videoId]
  );
}

// GET /api/videos
app.get('/api/videos', async (req, res) => {
  try {
    const { tag } = req.query;
    let videos;
    if (tag) {
      videos = await db.all(
        `SELECT DISTINCT v.* FROM videos v
         JOIN video_tags vt ON v.id = vt.video_id
         JOIN tags t ON vt.tag_id = t.id
         WHERE t.name = $1
         ORDER BY v.added_at DESC`,
        [tag]
      );
    } else {
      videos = await db.all('SELECT * FROM videos ORDER BY added_at DESC');
    }
    const result = [];
    for (const v of videos) {
      result.push({ ...v, tags: await getVideoTags(v.id) });
    }
    res.json(result);
  } catch (err) {
    console.error('GET /api/videos error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/videos
app.post('/api/videos', async (req, res) => {
  const { url, tags } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const youtubeId = extractYouTubeId(url);
  if (!youtubeId) return res.status(400).json({ error: 'Invalid YouTube URL' });

  const existing = await db.get('SELECT id FROM videos WHERE youtube_id = $1', [youtubeId]);
  if (existing) return res.status(409).json({ error: 'Video already exists', id: existing.id });

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error('Could not fetch video info');
    const data = await response.json();

    const title = data.title || 'Untitled';
    const channelName = data.author_name || '';
    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    const result = await db.run(
      'INSERT INTO videos (youtube_id, title, channel_name, thumbnail_url) VALUES ($1, $2, $3, $4) RETURNING id',
      [youtubeId, title, channelName, thumbnailUrl]
    );
    const videoId = result.rows[0].id;

    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await db.run('INSERT INTO video_tags (video_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [videoId, tagId]);
      }
    }

    const video = await db.get('SELECT * FROM videos WHERE id = $1', [videoId]);
    res.status(201).json({ ...video, tags: await getVideoTags(videoId) });
  } catch (err) {
    console.error('POST /api/videos error:', err);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

// DELETE /api/videos/:id
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM videos WHERE id = $1', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/videos error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/videos/:id/tags
app.put('/api/videos/:id/tags', async (req, res) => {
  const { tags } = req.body;
  const videoId = req.params.id;
  try {
    const video = await db.get('SELECT id FROM videos WHERE id = $1', [videoId]);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    await db.run('DELETE FROM video_tags WHERE video_id = $1', [videoId]);
    for (const tagId of (tags || [])) {
      await db.run('INSERT INTO video_tags (video_id, tag_id) VALUES ($1, $2)', [videoId, tagId]);
    }
    res.json(await getVideoTags(videoId));
  } catch (err) {
    console.error('PUT /api/videos/:id/tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tags
app.get('/api/tags', async (_req, res) => {
  try {
    res.json(await db.all('SELECT * FROM tags ORDER BY name'));
  } catch (err) {
    console.error('GET /api/tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tags
app.post('/api/tags', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const result = await db.run(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING id',
      [name, color || '#6366f1']
    );
    const tag = await db.get('SELECT * FROM tags WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(tag);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Tag already exists' });
    }
    console.error('POST /api/tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id
app.delete('/api/tags/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM tags WHERE id = $1', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Tag not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SPA catch-all (must be after API routes)
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Initialize DB then start server
db.init().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CalmScreen running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
