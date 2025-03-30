import React, { useRef } from 'react'; // Import useRef
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { FaQuestion, FaRegLightbulb, FaCheck, FaClipboardList } from 'react-icons/fa';

export interface StickyNoteProps {
  id: string;
  text: string;
  zone: 'wwtf' | 'wtf' | 'clarity';
  onDoubleClick?: (noteId: string) => void;
  hasNextActions?: boolean;
}

interface DragItem {
  id: string;
  type: string;
}

const ItemTypes = {
  STICKY_NOTE: 'stickyNote',
};

const StickyNote: React.FC<StickyNoteProps> = ({ id, text, zone, onDoubleClick, hasNextActions }) => {
  console.log(`[Render] StickyNote ID: ${id}, Zone: ${zone}`);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.STICKY_NOTE,
    item: { id, type: ItemTypes.STICKY_NOTE },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor<DragItem, unknown>) => {
      const didDrop = monitor.didDrop();
      console.log(`[Drag End] Note ID: ${id}, Dropped: ${didDrop}`);
      if (!didDrop) {
        // Handle case where drag ends outside a valid drop target if needed
      }
    },
  }));

  // 1. Create a ref for the draggable element
  const divRef = useRef<HTMLDivElement>(null);

  // 3. Connect the drag source functionality to the ref
  drag(divRef);

  const getNoteStyle = (currentZone: StickyNoteProps['zone']) => {
    switch (currentZone) {
      case 'wwtf':
        return { backgroundColor: '#ADD8E6', icon: <FaQuestion /> };
      case 'wtf':
        return { backgroundColor: '#FFA500', icon: <FaRegLightbulb /> };
      case 'clarity':
        return { backgroundColor: '#90EE90', icon: <FaCheck /> };
      default:
        return { backgroundColor: '#f0f0f0', icon: null };
    }
  };

  const { backgroundColor, icon } = getNoteStyle(zone);

  return (
    // 2. Assign the created ref to the div element
    <div
      ref={divRef} // Use the created ref
      onDoubleClick={() => onDoubleClick && onDoubleClick(id)}
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
        backgroundColor,
        minWidth: '100px',
      }}
      className={`sticky-note note-${zone}`}
    >
      {hasNextActions && <FaClipboardList style={{ marginRight: '8px', color: '#666' }} />}
      <span>{text}</span>
      <span style={{ marginLeft: 'auto', paddingLeft: '10px' }}>{icon}</span>
    </div>
  );
};

export default StickyNote;