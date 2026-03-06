import { useState } from 'react';

export default function VideoCard({ video, isParentMode, allTags, onPlay, onDelete, onUpdateTags }) {
  const [showTagEditor, setShowTagEditor] = useState(false);
  const videoTagIds = video.tags.map(t => t.id);

  const toggleTag = (tagId) => {
    const newIds = videoTagIds.includes(tagId)
      ? videoTagIds.filter(id => id !== tagId)
      : [...videoTagIds, tagId];
    onUpdateTags(newIds);
  };

  return (
    <div className="video-card" onClick={!showTagEditor ? onPlay : undefined}>
      <div className="thumbnail-wrap">
        <img src={video.thumbnail_url} alt={video.title} loading="lazy" />
        <div className="play-overlay">
          <div className="play-icon" />
        </div>
      </div>

      <div className="card-body">
        <div className="card-title">{video.title}</div>

        {isParentMode && (
          <>
            <div className="card-channel">{video.channel_name}</div>

            <div className="card-tags">
              {video.tags.map(tag => (
                <span
                  key={tag.id}
                  className="tag-pill small"
                  style={{ borderColor: tag.color, backgroundColor: tag.color, color: 'white' }}
                >
                  {tag.name}
                </span>
              ))}
            </div>

            <div className="card-actions" onClick={e => e.stopPropagation()}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowTagEditor(!showTagEditor)}
              >
                Tags
              </button>
              <button className="btn btn-danger" onClick={onDelete}>
                Remove
              </button>
            </div>

            {showTagEditor && (
              <>
                <div className="tag-editor-backdrop" onClick={() => setShowTagEditor(false)} />
                <div className="tag-editor" onClick={e => e.stopPropagation()}>
                  {allTags.map(tag => (
                    <button
                      key={tag.id}
                      className={`tag-pill ${videoTagIds.includes(tag.id) ? 'active' : ''}`}
                      style={{
                        borderColor: tag.color,
                        backgroundColor: videoTagIds.includes(tag.id) ? tag.color : 'transparent',
                        color: videoTagIds.includes(tag.id) ? 'white' : tag.color,
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
