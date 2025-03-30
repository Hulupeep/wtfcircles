import React, { useState, useEffect, useCallback } from 'react';
import StickyNote, { StickyNoteProps } from './StickyNote';
import CircleZone from './CircleZone';
import NextActionsModal from './NextActionsModal';
import ZoneSummaryList from './ZoneSummaryList';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { generateIrishName } from '../utils/nameGenerator'; // Import the name generator

// --- Types ---
// --- Types ---
interface Action { id: string; text: string; completed: boolean; }
interface Note extends StickyNoteProps { nextActions: Action[]; }
type Zone = 'wwtf' | 'wtf' | 'clarity';

// Structure for storing all boards data
interface BoardsData {
  activeBoardId: string | null;
  boards: {
    [boardId: string]: Note[]; // Map boardId to its notes array
  };
}

// --- Constants ---
const BOARDS_DATA_KEY = 'wtfBoardsData'; // Main key for all board data
const SUMMARY_WIDTH_KEY = 'wtfSummaryWidth';

// --- Component ---
const WhiteboardCanvas: React.FC = () => {
  // State for the notes of the *currently active* board
  const [notes, setNotes] = useState<Note[]>([]);
  // State for all available board IDs (names)
  const [allBoardIds, setAllBoardIds] = useState<string[]>([]);
  // State for the currently active board ID
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  const [noteInput, setNoteInput] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [summaryWidth, setSummaryWidth] = useState<number>(() => {
    const savedWidth = localStorage.getItem(SUMMARY_WIDTH_KEY);
    return savedWidth ? parseInt(savedWidth, 10) : 300;
  });

  // --- Effects ---

  // Load initial data (boards, active board, notes for active board)
  useEffect(() => {
    const savedDataString = localStorage.getItem(BOARDS_DATA_KEY);
    let data: BoardsData = { activeBoardId: null, boards: {} };
    let initialBoardCreated = false;

    if (savedDataString) {
      try {
        data = JSON.parse(savedDataString);
        // Ensure boards object exists
        data.boards = data.boards || {};
      } catch (error) {
        console.error("Failed to parse boards data:", error);
        data = { activeBoardId: null, boards: {} }; // Reset on error
      }
    }

    const boardIds = Object.keys(data.boards);
    setAllBoardIds(boardIds);

    let currentActiveId = data.activeBoardId;

    // If no boards exist, create the first one
    if (boardIds.length === 0) {
      console.log("No existing boards found, creating initial board.");
      // Simulate name generation (replace with actual script call if possible)
      const newBoardId = `Board-${Date.now()}`;
      console.log("Generated initial board ID:", newBoardId);
      data.boards[newBoardId] = []; // Add empty board
      data.activeBoardId = newBoardId;
      setAllBoardIds([newBoardId]);
      setActiveBoardId(newBoardId);
      setNotes([]); // Start with empty notes for the new board
      localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data)); // Save immediately
      initialBoardCreated = true;
    } else {
      // If there's no active ID set, or the saved one is invalid, pick the first board
      if (!currentActiveId || !data.boards[currentActiveId]) {
        currentActiveId = boardIds[0];
        data.activeBoardId = currentActiveId; // Update activeId in loaded data
        localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data)); // Save the corrected activeId
      }
      setActiveBoardId(currentActiveId);
      // Load notes for the active board, ensuring nextActions exists
      const activeNotes = (data.boards[currentActiveId] || []).map(note => ({
        ...note,
        nextActions: note.nextActions || []
      }));
      setNotes(activeNotes);
    }

  }, []); // Run only on initial mount

  // Save notes whenever they change *for the active board*
  useEffect(() => {
    // Only save if there's an active board and it's not the initial creation phase
    if (activeBoardId) {
      const savedDataString = localStorage.getItem(BOARDS_DATA_KEY);
      let data: BoardsData = { activeBoardId: null, boards: {} };
      if (savedDataString) {
        try {
          data = JSON.parse(savedDataString);
          data.boards = data.boards || {};
        } catch (error) {
          console.error("Failed to parse boards data during save:", error);
          // Avoid overwriting if parse fails, maybe log or alert
          return;
        }
      }
      // Update the notes for the currently active board
      data.boards[activeBoardId] = notes;
      data.activeBoardId = activeBoardId; // Ensure active ID is also saved
      localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data));
      console.log(`Saved notes for board: ${activeBoardId}`);
    }
  }, [notes, activeBoardId]); // Depend on notes and activeBoardId

  // Save summary width
  useEffect(() => { localStorage.setItem(SUMMARY_WIDTH_KEY, summaryWidth.toString()); }, [summaryWidth]);

  // --- Handlers ---

  // Add a new note to the *active* board
  const handleAddNote = () => {
    if (noteInput.trim() === '' || !activeBoardId) return; // Need an active board
    const newNote: Note = { id: `note-${Date.now()}-${Math.random()}`, text: noteInput, zone: 'wwtf', nextActions: [] };
    // This will trigger the save useEffect because 'notes' changes
    setNotes((prevNotes) => [...prevNotes, newNote]);
    setNoteInput('');
  };

  // Move a note within the *active* board
  const handleMoveNote = useCallback((noteId: string, targetZone: Zone) => {
    if (!activeBoardId) return;
    console.log(`Moving note ${noteId} to ${targetZone} on board ${activeBoardId}`);
    // This will trigger the save useEffect
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, zone: targetZone } : note));
  }, [activeBoardId]); // Depend on activeBoardId

  // Handle double-click
  const handleNoteDoubleClick = (noteId: string) => { setEditingNoteId(noteId); };
  // Close modal
  const handleCloseModal = () => { setEditingNoteId(null); };

  // Add action to a note on the *active* board
  const handleAddAction = (noteId: string, actionText: string) => {
    if (!activeBoardId) return;
    const newAction: Action = { id: `action-${Date.now()}-${Math.random()}`, text: actionText, completed: false };
    // This will trigger the save useEffect
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, nextActions: [...(note.nextActions || []), newAction] } : note));
  };

  // Toggle action on the *active* board
  const handleToggleAction = (noteId: string, actionId: string) => {
    if (!activeBoardId) return;
    // This will trigger the save useEffect
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, nextActions: (note.nextActions || []).map((action) => action.id === actionId ? { ...action, completed: !action.completed } : action), } : note));
  };

  // Create a new board
  const handleNewBoard = () => {
    // Use the imported name generator for 2 words
    const namePart = generateIrishName(2);
    // Generate a 4-digit random number (1000-9999)
    const numberPart = Math.floor(1000 + Math.random() * 9000);
    const newBoardId = `${namePart}_${numberPart}`; // Combine them
    console.log("Creating new board with generated ID:", newBoardId);

    // Update state and local storage
    const savedDataString = localStorage.getItem(BOARDS_DATA_KEY);
    let data: BoardsData = { activeBoardId: null, boards: {} };
    if (savedDataString) {
      try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; } catch (e) { /* ignore */ }
    }

    if (data.boards[newBoardId]) {
      alert("Generated board name already exists (collision unlikely but possible). Please try again.");
      return;
    }

    data.boards[newBoardId] = []; // Add empty notes array for the new board
    data.activeBoardId = newBoardId; // Set the new board as active

    localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data)); // Save updated data

    // Update React state
    setAllBoardIds(prevIds => [...prevIds, newBoardId]);
    setActiveBoardId(newBoardId);
    setNotes([]); // Clear notes for the new board
  };

  // Handle board selection change
  const handleBoardSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBoardId = event.target.value;
    if (!selectedBoardId || selectedBoardId === activeBoardId) return;

    const savedDataString = localStorage.getItem(BOARDS_DATA_KEY);
    if (savedDataString) {
      try {
        const data: BoardsData = JSON.parse(savedDataString);
        if (data.boards && data.boards[selectedBoardId]) {
          // Update active board ID in state and local storage
          setActiveBoardId(selectedBoardId);
          setNotes((data.boards[selectedBoardId] || []).map(note => ({ ...note, nextActions: note.nextActions || [] }))); // Load notes

          data.activeBoardId = selectedBoardId;
          localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data)); // Save the new active ID
        } else {
          console.error(`Board with ID ${selectedBoardId} not found in storage.`);
        }
      } catch (error) {
        console.error("Failed to parse boards data on select:", error);
      }
    }
  };


  // Render notes helper
  const renderNotesForZone = (zoneId: Zone) => {
    return notes.filter((note) => note.zone === zoneId).map((note) => (
      <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} />
    ));
  };

  // Styles for note container
  const noteContainerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px', minHeight: '50px', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' };

  // Find note for modal
  const currentEditingNote = notes.find(note => note.id === editingNoteId) || null;

  // Handle resize event
  const onResize = (event: React.SyntheticEvent, data: ResizeCallbackData) => { setSummaryWidth(data.size.width); };

  // Add key press handler for the main input
  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { handleAddNote(); } };

  return (
    <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Bar: Board Selector, Input Area, New Board Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0, padding: '0 20px' /* Add padding */ }}>
         {/* Board Selector Dropdown (Left) */}
         <div style={{ flex: 1 /* Take up space */ }}>
            <label htmlFor="board-select" style={{ marginRight: '5px' }}>Board:</label>
            <select id="board-select" value={activeBoardId || ''} onChange={handleBoardSelect} style={{ padding: '8px' }}>
              {allBoardIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
            <button onClick={handleNewBoard} style={{ padding: '8px 12px', marginLeft: '10px' }}>New Board</button>
         </div>

         {/* Input Area (Center) */}
         {/* Use flex properties to center this middle group */}
         <div style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyPress={handleInputKeyPress} placeholder="Enter new idea..." style={{ marginRight: '10px', padding: '8px' }} />
            <button onClick={handleAddNote} style={{ padding: '8px 12px' }}>Add Note (to WWTF)</button>
         </div>
      </div>


      {/* Main Content Area */}
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'stretch', overflow: 'hidden' }}>

        {/* Whiteboard Area */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', padding: '10px' }}>
            {/* Top Row: WWTF and WTF */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'stretch', gap: '20px', minHeight: '300px' }}>
                 <div style={{ flex: 1, display: 'flex' }}>
                     <CircleZone zoneId="wwtf" onDropNote={handleMoveNote}><div style={noteContainerStyle}>{renderNotesForZone('wwtf')}</div></CircleZone>
                 </div>
                 <div style={{ flex: 1, display: 'flex' }}>
                     <CircleZone zoneId="wtf" onDropNote={handleMoveNote}><div style={noteContainerStyle}>{renderNotesForZone('wtf')}</div></CircleZone>
                 </div>
            </div>
            {/* Bottom Row: Clarity */}
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                 <div style={{ width: '250px', height: '200px' }}>
                     <CircleZone zoneId="clarity" onDropNote={handleMoveNote}><div style={noteContainerStyle}>{renderNotesForZone('clarity')}</div></CircleZone>
                 </div>
             </div>
        </div>

        {/* Resizable Summary List Area */}
        <ResizableBox width={summaryWidth} height={Infinity} axis="x" resizeHandles={['w']} handle={<span className="custom-resize-handle" />} minConstraints={[150, Infinity]} maxConstraints={[600, Infinity]} onResize={onResize} style={{ overflow: 'hidden', display: 'flex', position: 'relative' }}>
          <div style={{ width: '100%', height: '100%', overflowY: 'auto', borderLeft: '1px solid #ccc', paddingLeft: '15px', marginLeft: '5px' }}>
            {/* Pass notes for the *active* board to the summary */}
            <ZoneSummaryList notes={notes} onToggleAction={handleToggleAction} />
          </div>
        </ResizableBox>

      </div>

      {/* Render the Modal conditionally */}
      <NextActionsModal note={currentEditingNote} onClose={handleCloseModal} onAddAction={handleAddAction} onToggleAction={handleToggleAction} />
    </div>
  );
};

export default WhiteboardCanvas;