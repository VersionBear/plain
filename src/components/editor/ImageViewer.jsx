import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function ImageViewer({ src, alt, caption, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef(null);
  const imageRef = useRef(null);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Wheel zoom when cursor over image
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
    },
    [],
  );

  // Pan with mouse drag
  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0 || zoom <= 1) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [zoom, position],
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Click overlay (not image) to close
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  // Double-click image to reset zoom
  const handleImageDoubleClick = useCallback(() => {
    resetZoom();
  }, [resetZoom]);

  return (
    <div
      ref={overlayRef}
      className="image-viewer-overlay"
      onClick={handleOverlayClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Close button */}
      <button
        type="button"
        className="image-viewer-close-btn"
        onClick={onClose}
        title="Close (Esc)"
        aria-label="Close image viewer"
      >
        <X size={24} />
      </button>

      {/* Zoom controls */}
      <div className="image-viewer-controls">
        <button
          type="button"
          className="image-viewer-zoom-btn"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} />
        </button>

        <button
          type="button"
          className="image-viewer-zoom-label"
          onClick={resetZoom}
          title="Reset zoom"
          aria-label="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          className="image-viewer-zoom-btn"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Image */}
      <div className="image-viewer-container">
        <img
          ref={imageRef}
          src={src}
          alt={alt || caption || 'Image'}
          className="image-viewer-image"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          onDoubleClick={handleImageDoubleClick}
          draggable={false}
        />
      </div>

      {/* Caption */}
      {caption ? (
        <div className="image-viewer-caption">{caption}</div>
      ) : null}
    </div>
  );
}

export default ImageViewer;
