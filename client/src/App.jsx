import { useState, useEffect, useCallback } from 'react';
import { fetchVideos, fetchTags, addVideo, deleteVideo, updateVideoTags } from './api';
import VideoGrid from './components/VideoGrid';
import VideoPlayer from './components/VideoPlayer';
import AddVideo from './components/AddVideo';
import ParentBar from './components/ParentBar';

export default function App() {
  const [videos, setVideos] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isParentMode, setIsParentMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showAddVideo, setShowAddVideo] = useState(false);

  const loadData = useCallback(async () => {
    const [v, t] = await Promise.all([fetchVideos(), fetchTags()]);
    setVideos(v);
    setTags(t);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddVideo = async (url, tagIds) => {
    const video = await addVideo(url, tagIds);
    setVideos(prev => [video, ...prev]);
    setShowAddVideo(false);
  };

  const handleDeleteVideo = async (id) => {
    await deleteVideo(id);
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleUpdateTags = async (videoId, tagIds) => {
    const updatedTags = await updateVideoTags(videoId, tagIds);
    setVideos(prev => prev.map(v =>
      v.id === videoId ? { ...v, tags: updatedTags } : v
    ));
  };

  const toggleTagFilter = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const filteredVideos = selectedTags.length > 0
    ? videos.filter(v => v.tags.some(t => selectedTags.includes(t.id)))
    : videos;

  if (currentVideo) {
    return (
      <VideoPlayer
        video={currentVideo}
        onBack={() => setCurrentVideo(null)}
        isKidMode={!isParentMode}
      />
    );
  }

  return (
    <div className={`app ${isParentMode ? 'parent-mode' : 'kid-mode'}`}>
      {isParentMode && (
        <ParentBar
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={toggleTagFilter}
          onClearFilters={() => setSelectedTags([])}
          onAddVideo={() => setShowAddVideo(true)}
          onExitParent={() => setIsParentMode(false)}
          onRefresh={loadData}
        />
      )}

      <VideoGrid
        videos={filteredVideos}
        isParentMode={isParentMode}
        tags={tags}
        onPlay={setCurrentVideo}
        onDelete={handleDeleteVideo}
        onUpdateTags={handleUpdateTags}
        onParentActivate={() => setIsParentMode(true)}
      />

      {showAddVideo && (
        <AddVideo
          tags={tags}
          onAdd={handleAddVideo}
          onClose={() => setShowAddVideo(false)}
        />
      )}
    </div>
  );
}
