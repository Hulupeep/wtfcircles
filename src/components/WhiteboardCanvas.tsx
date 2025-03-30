import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StickyNote, { StickyNoteProps } from './StickyNote';
import CircleZone from './CircleZone';
import NextActionsModal from './NextActionsModal';
import ZoneSummaryList from './ZoneSummaryList';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { generateIrishName } from '../utils/nameGenerator';

// --- Types ---
interface Action { id: string; text: string; completed: boolean; }
interface Note extends StickyNoteProps { nextActions: Action[]; }
type Zone = 'wwtf' | 'wtf' | 'clarity';
interface BoardsData { activeBoardId: string | null; boards: { [boardId: string]: Note[]; }; }

// --- Constants ---
const BOARDS_DATA_KEY = 'wtfBoardsData';
const SUMMARY_WIDTH_KEY = 'wtfSummaryWidth';

// --- Component ---
const WhiteboardCanvas: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allBoardIds, setAllBoardIds] = useState<string[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [summaryWidth, setSummaryWidth] = useState<number>(() => {
    const savedWidth = localStorage.getItem(SUMMARY_WIDTH_KEY);
    return savedWidth ? parseInt(savedWidth, 10) : 300;
  });
  // Removed diagnostic state

  // --- Effects ---
  useEffect(() => {
    const savedDataString = localStorage.getItem(BOARDS_DATA_KEY);
    let data: BoardsData = { activeBoardId: null, boards: {} };
    if (savedDataString) {
      try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; }
      catch (error) { console.error("Failed to parse boards data:", error); data = { activeBoardId: null, boards: {} }; }
    }
    const boardIds = Object.keys(data.boards);
    setAllBoardIds(boardIds);
    let currentActiveId = data.activeBoardId;
    if (boardIds.length === 0) {
      const namePart = generateIrishName(2);
      const numberPart = Math.floor(1000 + Math.random() * 9000);
      const newBoardId = `${namePart}_${numberPart}`;
      data.boards[newBoardId] = []; data.activeBoardId = newBoardId;
      setAllBoardIds([newBoardId]); setActiveBoardId(newBoardId); setNotes([]);
      localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data));
    } else {
      if (!currentActiveId || !data.boards[currentActiveId]) {
        currentActiveId = boardIds[0]; data.activeBoardId = currentActiveId;
        localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data));
      }
      setActiveBoardId(currentActiveId);
      const activeNotes = (data.boards[currentActiveId] || []).map(note => ({ ...note, nextActions: note.nextActions || [] }));
      setNotes(activeNotes);
    }
  }, []);

  useEffect(() => {
    if (activeBoardId) {
      const savedDataString = localStorage.getItem(BOARDS_DATA_KEY);
      let data: BoardsData = { activeBoardId: null, boards: {} };
      if (savedDataString) { try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; } catch (error) { console.error("Failed parse on save:", error); return; } }
      data.boards[activeBoardId] = notes; data.activeBoardId = activeBoardId;
      localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data));
    }
  }, [notes, activeBoardId]);

  useEffect(() => { localStorage.setItem(SUMMARY_WIDTH_KEY, summaryWidth.toString()); }, [summaryWidth]);

  // --- Handlers ---
  const handleAddNote = () => {
    if (noteInput.trim() === '' || !activeBoardId) return;
    const newNote: Note = { id: `note-${Date.now()}-${Math.random()}`, text: noteInput, zone: 'wwtf', nextActions: [] };
    setNotes((prevNotes) => [...prevNotes, newNote]); setNoteInput('');
  };
  const handleMoveNote = useCallback((noteId: string, targetZone: Zone) => {
    if (!activeBoardId) return;
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, zone: targetZone } : note));
    // Removed diagnostic forceRender
  }, [activeBoardId]);
  const handleNoteDoubleClick = (noteId: string) => { setEditingNoteId(noteId); };
  const handleCloseModal = () => { setEditingNoteId(null); };
  const handleAddAction = (noteId: string, actionText: string) => {
    if (!activeBoardId) return;
    const newAction: Action = { id: `action-${Date.now()}-${Math.random()}`, text: actionText, completed: false };
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, nextActions: [...(note.nextActions || []), newAction] } : note));
  };
  const handleToggleAction = (noteId: string, actionId: string) => {
    if (!activeBoardId) return;
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, nextActions: (note.nextActions || []).map((action) => action.id === actionId ? { ...action, completed: !action.completed } : action), } : note));
  };
  const handleNewBoard = () => {
    const namePart = generateIrishName(2);
    const numberPart = Math.floor(1000 + Math.random() * 9000);
    const newBoardId = `${namePart}_${numberPart}`;
    const savedDataString = localStorage.getItem(BOARDS_DATA_KEY);
    let data: BoardsData = { activeBoardId: null, boards: {} };
    if (savedDataString) { try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; } catch (e) { /* ignore */ } }
    if (data.boards[newBoardId]) { alert("Generated name collision. Try again."); return; }
    data.boards[newBoardId] = []; data.activeBoardId = newBoardId;
    localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data));
    setAllBoardIds(prevIds => [...prevIds, newBoardId]); setActiveBoardId(newBoardId); setNotes([]);
  };
  const handleBoardSelectChange = (selectedBoardId: string) => {
    if (!selectedBoardId || selectedBoardId === activeBoardId) return;
    const savedDataString = localStorage.getItem(BOARDS_DATA_KEY);
    if (savedDataString) {
      try {
        const data: BoardsData = JSON.parse(savedDataString);
        if (data.boards && data.boards[selectedBoardId]) {
          setActiveBoardId(selectedBoardId);
          setNotes((data.boards[selectedBoardId] || []).map(note => ({ ...note, nextActions: note.nextActions || [] })));
          data.activeBoardId = selectedBoardId;
          localStorage.setItem(BOARDS_DATA_KEY, JSON.stringify(data));
        } else { console.error(`Board ${selectedBoardId} not found.`); }
      } catch (error) { console.error("Failed parse on select:", error); }
    }
  };

  // Removed useMemo definitions

  const noteContainerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px', minHeight: '150px', width: '100%', alignItems: 'flex-start', justifyContent: 'center', height: '100%' };
  const currentEditingNote = notes.find(note => note.id === editingNoteId) || null;
  const onResize = (event: React.SyntheticEvent, data: ResizeCallbackData) => { setSummaryWidth(data.size.width); };
  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { handleAddNote(); } };

  return (
    <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
         <div>
            <label htmlFor="board-select-revert" style={{ marginRight: '5px' }}>Board:</label>
            <select id="board-select-revert" value={activeBoardId || ''} onChange={(e) => handleBoardSelectChange(e.target.value)} style={{ padding: '8px', marginRight: '10px' }}>
              {allBoardIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
            <button onClick={handleNewBoard} style={{ padding: '8px 12px' }}>New Board</button>
         </div>
         <div style={{ textAlign: 'center' }}>
            <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyPress={handleInputKeyPress} placeholder="Enter new idea..." style={{ marginRight: '10px', padding: '8px' }} />
            <button onClick={handleAddNote} style={{ padding: '8px 12px' }}>Add Note</button>
         </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'stretch', overflow: 'hidden', gap: '20px' }}>

        {/* Whiteboard Area */}
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'stretch', gap: '20px', overflowY: 'auto', padding: '10px', border: '1px solid lightgrey' }}>
          {/* WWTF Zone */}
          <CircleZone zoneId="wwtf" onDropNote={handleMoveNote}>
            <div style={noteContainerStyle}>
              {/* Filter notes directly in map */}
              {notes.filter(note => note.zone === 'wwtf').map(note => (
                 <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} />
              ))}
            </div>
          </CircleZone>
          {/* WTF Zone */}
          <CircleZone zoneId="wtf" onDropNote={handleMoveNote}>
             <div style={noteContainerStyle}>
                {/* Filter notes directly in map */}
                {notes.filter(note => note.zone === 'wtf').map(note => (
                   <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} />
                ))}
             </div>
          </CircleZone>
          {/* Clarity Zone */}
          <CircleZone zoneId="clarity" onDropNote={handleMoveNote}>
             <div style={noteContainerStyle}>
                {/* Filter notes directly in map */}
                {notes.filter(note => note.zone === 'clarity').map(note => (
                   <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} />
                ))}
             </div>
          </CircleZone>
        </div>

        {/* Resizable Summary List Area */}
        <ResizableBox width={summaryWidth} height={Infinity} axis="x" resizeHandles={['w']} handle={<span className="custom-resize-handle" />} minConstraints={[150, Infinity]} maxConstraints={[600, Infinity]} onResize={onResize} style={{ overflow: 'hidden', display: 'flex', position: 'relative' }}>
          <div style={{ width: '100%', height: '100%', overflowY: 'auto', borderLeft: '1px solid #ccc', paddingLeft: '15px', marginLeft: '5px' }}>
            <ZoneSummaryList notes={notes} onToggleAction={handleToggleAction} />
          </div>
        </ResizableBox>
      </div>

      {/* Modal */}
      <NextActionsModal note={currentEditingNote} onClose={handleCloseModal} onAddAction={handleAddAction} onToggleAction={handleToggleAction} />
    </div>
  );
};

export default WhiteboardCanvas;