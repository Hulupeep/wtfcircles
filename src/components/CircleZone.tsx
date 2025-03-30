import React from 'react';
import { useDrop, ConnectDropTarget, DropTargetMonitor } from 'react-dnd'; // Import DropTargetMonitor

interface CircleZoneProps {
  zoneId: 'wwtf' | 'wtf' | 'clarity';
  onDropNote: (noteId: string, targetZone: 'wwtf' | 'wtf' | 'clarity') => void;
  children?: React.ReactNode; // To allow nesting or placing notes inside visually
}

interface DragItem {
  id: string;
  type: string; // Should match ItemTypes.STICKY_NOTE from StickyNote.tsx
}

const ItemTypes = {
  STICKY_NOTE: 'stickyNote', // Ensure this matches the type in StickyNote.tsx
};

const CircleZone: React.FC<CircleZoneProps> = ({ zoneId, onDropNote, children }) => {
  const [{ isOver, canDrop }, drop]: [{ isOver: boolean; canDrop: boolean }, ConnectDropTarget] = useDrop(() => ({
    accept: ItemTypes.STICKY_NOTE,
    drop: (item: DragItem, monitor: DropTargetMonitor<DragItem, unknown>) => { // Add monitor type
      console.log(`[Drop] Note ID: ${item.id} dropped on Zone: ${zoneId}`);
      onDropNote(item.id, zoneId);
    },
    hover: (item: DragItem, monitor: DropTargetMonitor<DragItem, unknown>) => { // Add hover handler with types
      if (monitor.isOver({ shallow: true })) { // Log only when directly over this zone
        // console.log(`[Hover] Note ID: ${item.id} hovering over Zone: ${zoneId}`); // Optional: Can be noisy
      }
    },
    collect: (monitor: DropTargetMonitor<DragItem, unknown>) => ({ // Add monitor type
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const getZoneStyle = () => {
    let baseStyle: React.CSSProperties = {
      // Use longhand border properties to avoid conflicts
      borderWidth: '2px',
      borderStyle: 'dashed',
      borderColor: 'gray', // Default border color
      borderRadius: '50%', // Make it circular
      padding: '20px', // Add some padding
      // margin: '10px auto', // Remove this duplicate margin
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative', // Needed for potential absolute positioning of notes or nested circles
      minHeight: '100px', // Ensure minimum height
      minWidth: '100px', // Ensure minimum width
      transition: 'background-color 0.2s ease', // Smooth background transition
      // Make the zone fill its container by default
      width: '100%',
      height: '100%',
      // Remove fixed margin: auto, let parent control alignment/spacing
      margin: 0,
    };

    // Remove fixed size adjustments based on zoneId
    // Size will be controlled by the parent container in WhiteboardCanvas

    // Highlight when a draggable item is over the zone
    if (isOver && canDrop) {
      baseStyle.backgroundColor = 'rgba(0, 255, 0, 0.1)'; // Light green highlight
      baseStyle.borderColor = 'green';
    } else if (canDrop) {
      // Optional: Slight highlight even if not directly over, but draggable is active
      // baseStyle.backgroundColor = 'rgba(0, 0, 255, 0.05)';
    }

    return baseStyle;
  };

  return (
    <div ref={drop as any} style={getZoneStyle()} className={`circle-zone zone-${zoneId}`}> {/* Re-apply 'as any' cast */}
      {/* Display zone name */}
      <div style={{
        position: 'absolute',
        top: '10px', // Position at the top inside the circle
        left: '50%',
        transform: 'translateX(-50%)', // Center horizontally
        opacity: 0.6,
        fontWeight: 'bold',
        fontSize: '0.9em',
        color: '#555',
        pointerEvents: 'none' // Prevent label from interfering with drop
      }}>
        {zoneId.toUpperCase()}
      </div>
      {children}
    </div>
  );
};

export default CircleZone;