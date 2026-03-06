import { useState } from 'react';
import { extractYouTubeId } from '../api';

export default function AddVideo({ tags, onAdd, onClose }) {
  const [url, setUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const youtubeId = extractYouTubeId(url);
  const thumbnailUrl = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : null;

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeId) return;
    setLoading(true);
    setError('');
    try {
      await onAdd(url, selectedTags);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add Video</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>YouTube URL</label>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              autoFocus
            />
          </div>

          {thumbnailUrl && (
            <div className="preview">
              <img src={thumbnailUrl} alt="Preview" />
            </div>
          )}

          <div className="form-group">
            <label>Tags (optional)</label>
            <div className="tag-selector">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-pill ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                  style={{
                    borderColor: tag.color,
                    backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                    color: selectedTags.includes(tag.id) ? 'white' : tag.color,
                  }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!youtubeId || loading}
            >
              {loading ? 'Adding...' : 'Add to Garden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
