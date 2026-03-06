import { useRef, useCallback } from 'react';
import VideoCard from './VideoCard';

export default function VideoGrid({
  videos, isParentMode, tags, onPlay, onDelete, onUpdateTags, onParentActivate,
}) {
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  const handleActivatorTap = useCallback(() => {
    tapCount.current++;
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      clearTimeout(tapTimer.current);
      onParentActivate();
      return;
    }
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1500);
  }, [onParentActivate]);

  return (
    <div className="grid-container">
      {!isParentMode && (
        <>
          <div className="grid-header">
            <h1>Garden</h1>
          </div>
          <div
            className="parent-activator"
            onClick={handleActivatorTap}
            title=""
          />
        </>
      )}

      <div className="video-grid">
        {videos.length === 0 && (
          <div className="empty-state">
            <h2>No videos yet</h2>
            <p>{isParentMode ? 'Click "Add Video" to get started!' : 'Ask a parent to add some videos.'}</p>
          </div>
        )}
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            isParentMode={isParentMode}
            allTags={tags}
            onPlay={() => onPlay(video)}
            onDelete={() => onDelete(video.id)}
            onUpdateTags={(tagIds) => onUpdateTags(video.id, tagIds)}
          />
        ))}
      </div>
    </div>
  );
}
