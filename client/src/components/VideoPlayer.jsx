import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';

export default function VideoPlayer({ video, otherVideos, onBack, onSwitchVideo, isKidMode }) {
  const [hideControls, setHideControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const playerRef = useRef(null);
  const overlayTimer = useRef(null);

  useEffect(() => {
    if (isPaused) {
      clearTimeout(overlayTimer.current);
      setShowOverlay(true);
    } else {
      overlayTimer.current = setTimeout(() => setShowOverlay(false), 500);
    }
    return () => clearTimeout(overlayTimer.current);
  }, [isPaused]);

  const togglePlayPause = () => {
    const player = playerRef.current;
    if (!player) return;
    if (isPaused) player.playVideo();
    else player.pauseVideo();
  };

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
          onStateChange={(e) => setIsPaused(e.data === 2)}
          onReady={(e) => { playerRef.current = e.target; }}
          style={{ width: '100%', height: '100%' }}
          iframeClassName="youtube-iframe"
        />
        {isKidMode && (
          <>
            <div
              className={`kid-overlay-top ${showOverlay ? 'paused' : ''}`}
              onClick={togglePlayPause}
            >
              {showOverlay && (
                <>
                  <div className="pause-play-btn" />
                  {otherVideos.length > 0 && (
                    <div className="kid-video-bar">
                      {otherVideos.slice(0, 8).map(v => (
                        <div
                          key={v.id}
                          className="kid-video-bar-thumb"
                          onClick={(e) => { e.stopPropagation(); onSwitchVideo(v); }}
                        >
                          <img src={v.thumbnail_url} alt={v.title} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="kid-overlay-controls-block" />
          </>
        )}
      </div>
    </div>
  );
}
