import React, { useRef } from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';

interface CircleZoneProps {
  zoneId: 'wwtf' | 'wtf' | 'clarity';
  onDropNote: (noteId: string, targetZone: 'wwtf' | 'wtf' | 'clarity') => void;
  children?: React.ReactNode;
}

interface DragItem {
  id: string;
  type: string;
}

const ItemTypes = {
  STICKY_NOTE: 'stickyNote',
};

const CircleZone: React.FC<CircleZoneProps> = ({ zoneId, onDropNote, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.STICKY_NOTE,
    drop: (item: DragItem, monitor: DropTargetMonitor<DragItem, unknown>) => {
      // Ensure drop only happens on the intended target, not nested ones potentially
      if (monitor.didDrop()) {
        return;
      }
      console.log(`[Drop] Note ID: ${item.id} dropped on Zone: ${zoneId}`);
      onDropNote(item.id, zoneId);
    },
    // Removed unused 'item' parameter from hover handler
    hover: (_item: DragItem, monitor: DropTargetMonitor<DragItem, unknown>) => {
      if (monitor.isOver({ shallow: true })) {
        // console.log(`[Hover] Note ID: ${_item.id} hovering over Zone: ${zoneId}`); // Use _item if needed
      }
    },
    collect: (monitor: DropTargetMonitor<DragItem, unknown>) => ({
      isOver: !!monitor.isOver({ shallow: true }), // Use shallow for more precise hover detection
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const divRef = useRef<HTMLDivElement>(null);
  drop(divRef); // Connect drop target to the inner div ref

  // Style for the outer circle visual
  const outerCircleStyle: React.CSSProperties = {
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: (isOver && canDrop) ? 'green' : 'gray', // Highlight border on hover
    borderRadius: '50%',
    padding: '5px', // Minimal padding for the border effect
    display: 'flex', // Use flex to center the inner container
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
    margin: 0,
    // Remove background color transition from outer, apply to inner
  };

  // Style for the inner container (actual drop target)
  const innerContainerStyle: React.CSSProperties = {
    width: 'calc(100% - 10px)', // Adjust width to account for outer padding
    height: 'calc(100% - 10px)', // Adjust height
    borderRadius: '50%', // Keep inner container circular if needed, or remove if content should fill
    padding: '15px', // Padding for content inside the drop zone
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'auto', // Allow scrolling if content overflows
    transition: 'background-color 0.2s ease',
    backgroundColor: (isOver && canDrop) ? 'rgba(0, 255, 0, 0.1)' : 'transparent', // Highlight background on hover
  };


  return (
    // Outer div is just for the dashed circle border
    <div style={outerCircleStyle} className={`circle-zone-outer zone-${zoneId}`}>
       {/* Zone Label */}
       <div style={{
         position: 'absolute',
         top: '10px',
         left: '50%',
         transform: 'translateX(-50%)',
         opacity: 0.6,
         fontWeight: 'bold',
         fontSize: '0.9em',
         color: '#555',
         pointerEvents: 'none',
         zIndex: 1 // Ensure label is above inner background highlight
       }}>
         {zoneId.toUpperCase()}
       </div>
       {/* Inner div is the actual drop target and content container */}
       <div ref={divRef} style={innerContainerStyle}>
         {children}
       </div>
    </div>
  );
};

export default CircleZone;