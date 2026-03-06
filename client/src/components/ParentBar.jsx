export default function ParentBar({
  tags, selectedTags, onToggleTag, onClearFilters, onAddVideo, onExitParent, onRefresh,
}) {
  return (
    <div className="parent-bar">
      <div className="bar-left">
        <span className="bar-label">Garden</span>
      </div>

      <div className="bar-tags">
        {tags.map(tag => (
          <button
            key={tag.id}
            className={`tag-pill ${selectedTags.includes(tag.id) ? 'active' : ''}`}
            style={{
              borderColor: tag.color,
              backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
              color: selectedTags.includes(tag.id) ? 'white' : tag.color,
            }}
            onClick={() => onToggleTag(tag.id)}
          >
            {tag.name}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button className="btn btn-secondary" onClick={onClearFilters} style={{ fontSize: 12, padding: '4px 10px' }}>
            Clear
          </button>
        )}
      </div>

      <div className="bar-actions">
        <button className="btn btn-primary" onClick={onAddVideo}>
          + Add Video
        </button>
        <button className="btn btn-secondary" onClick={onRefresh}>
          Refresh
        </button>
        <button className="btn btn-kid-mode" onClick={onExitParent}>
          Kid Mode
        </button>
      </div>
    </div>
  );
}
