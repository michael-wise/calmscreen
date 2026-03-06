import { useState, useRef } from 'react';
import YouTube from 'react-youtube';

export default function VideoPlayer({ video, onBack, isKidMode }) {
  const [hideControls, setHideControls] = useState(false);
  const playerRef = useRef(null);

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      playsinline: 1,
      disablekb: isKidMode ? 1 : 0,
      fs: isKidMode ? 0 : 1,
    },
  };

  return (
    <div
      className={`player-overlay ${hideControls ? 'hide-controls' : ''}`}
      onClick={() => !isKidMode && setHideControls(!hideControls)}
    >
      <div className="player-header" onClick={e => e.stopPropagation()}>
        <button className="back-button" onClick={onBack}>
          &#8592;
        </button>
        <span className="player-title">{video.title}</span>
      </div>

      <div className="player-body" onClick={e => e.stopPropagation()}>
        <YouTube
          videoId={video.youtube_id}
          opts={opts}
          onEnd={onBack}
          onReady={(e) => { playerRef.current = e.target; }}
          style={{ width: '100%', height: '100%' }}
          iframeClassName="youtube-iframe"
        />
        {isKidMode && (
          <>
            <div className="kid-overlay-main" />
            <div className="kid-overlay-controls-block" />
          </>
        )}
      </div>
    </div>
  );
}
