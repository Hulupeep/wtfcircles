import React from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { FaQuestion, FaRegLightbulb, FaCheck, FaClipboardList } from 'react-icons/fa'; // Import FaClipboardList

export interface StickyNoteProps {
  id: string;
  text: string;
  zone: 'wwtf' | 'wtf' | 'clarity';
  onDoubleClick?: (noteId: string) => void;
  hasNextActions?: boolean; // Add prop to indicate if note has actions
}

interface DragItem {
  id: string;
  type: string;
}

const ItemTypes = {
  STICKY_NOTE: 'stickyNote',
};

// Destructure onDoubleClick and hasNextActions from props
const StickyNote: React.FC<StickyNoteProps> = ({ id, text, zone, onDoubleClick, hasNextActions }) => {
  // Revert to simpler useDrag implementation
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.STICKY_NOTE,
    item: { id, type: ItemTypes.STICKY_NOTE },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    // 'begin' is deprecated, use 'item' property above instead.
    // We keep 'end' for logging drop results.
    end: (item: DragItem | undefined, monitor: DragSourceMonitor<DragItem, unknown>) => { // Add item and monitor types
      const didDrop = monitor.didDrop();
      console.log(`[Drag End] Note ID: ${id}, Dropped: ${didDrop}`);
      if (!didDrop) {
        // Handle case where drag ends outside a valid drop target if needed
      }
    },
  }));

  const getNoteStyle = (currentZone: StickyNoteProps['zone']) => {
    switch (currentZone) {
      case 'wwtf':
        return { backgroundColor: '#ADD8E6', icon: <FaQuestion /> }; // Light Blue
      case 'wtf':
        return { backgroundColor: '#FFA500', icon: <FaRegLightbulb /> }; // Orange (Using Lightbulb instead of Thinking/Exclamation)
      case 'clarity':
        return { backgroundColor: '#90EE90', icon: <FaCheck /> }; // Light Green
      default:
        return { backgroundColor: '#f0f0f0', icon: null }; // Default
    }
  };

  const { backgroundColor, icon } = getNoteStyle(zone);

  return (
    <div
      ref={drag as any} // Re-apply 'as any' cast as workaround for type issue
      onDoubleClick={() => onDoubleClick && onDoubleClick(id)} // Correct JS logical AND: &&
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: '10px',
        margin: '5px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'move',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor, // Apply dynamic background color
        minWidth: '100px', // Ensure minimum width
      }}
      className={`sticky-note note-${zone}`} // Add zone-specific class
    >
      {/* Display checklist icon if there are next actions */}
      {hasNextActions && <FaClipboardList style={{ marginRight: '8px', color: '#666' }} />}
      <span>{text}</span>
      <span style={{ marginLeft: 'auto', paddingLeft: '10px' }}>{icon}</span> {/* Use margin auto for spacing */}
    </div>
  );
};

export default StickyNote;