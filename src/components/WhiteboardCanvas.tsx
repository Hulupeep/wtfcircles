import React, { useState, useEffect, useCallback } from 'react';
import StickyNote, { StickyNoteProps } from './StickyNote';
import CircleZone from './CircleZone';
import NextActionsModal from './NextActionsModal';
import ZoneSummaryList from './ZoneSummaryList';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { generateIrishName } from '../utils/nameGenerator';
import { supabase } from '../utils/supabaseClient';

// --- Types ---
interface Action { id: string; text: string; completed: boolean; }
interface Note extends StickyNoteProps {
  nextActions: Action[];
  dbId?: string;
  title?: string | null;
}
type Zone = 'wwtf' | 'wtf' | 'clarity';
interface LocalBoardsData {
    activeBoardId: string | null;
    boards: { [boardId: string]: Note[] };
}
// Props for the component - Removed isOffline
interface WhiteboardCanvasProps {
  userId?: string | null;
}

// --- Constants ---
const LOCAL_BOARDS_DATA_KEY = 'wtfBoardsData';
const SUMMARY_WIDTH_KEY = 'wtfSummaryWidth';

// --- Component ---
// Removed isOffline from signature
const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ userId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allBoardTitles, setAllBoardTitles] = useState<{ id: string; title: string }[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryWidth, setSummaryWidth] = useState<number>(() => {
    const savedWidth = localStorage.getItem(SUMMARY_WIDTH_KEY);
    return savedWidth ? parseInt(savedWidth, 10) : 300;
  });

  // --- Supabase Data Fetching/Saving ---
  const fetchBoardsFromSupabase = useCallback(async () => {
    // This function inherently only runs if userId is present due to the useEffect dependency
    if (!userId) return;
    setIsLoading(true);
    console.log("Fetching boards for user:", userId);
    try {
      const { data: boardsData, error } = await supabase
        .from('boards')
        .select('id, title, content, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      console.log("Fetched boards:", boardsData);

      if (boardsData && boardsData.length > 0) {
        const titles = boardsData.map(b => ({ id: b.id, title: b.title || b.id }));
        setAllBoardTitles(titles);
        const currentActiveIsValid = activeBoardId && boardsData.some(b => b.id === activeBoardId);
        const boardToLoad = currentActiveIsValid ? boardsData.find(b => b.id === activeBoardId) : boardsData[0];

        if (boardToLoad) {
            setActiveBoardId(boardToLoad.id);
            const loadedNotes = (boardToLoad.content || []).map((note: any) => ({
                ...note,
                dbId: boardToLoad.id,
                nextActions: note.nextActions || []
            }));
            setNotes(loadedNotes);
            console.log("Loaded board:", boardToLoad.id, loadedNotes);
        } else {
             setActiveBoardId(null);
             setNotes([]);
             console.log("No valid board found to load.");
        }
      } else {
        console.log("No boards found, creating initial board.");
        // Call handleNewBoard, ensuring it uses the current userId context
        await handleNewBoard(); // Make sure handleNewBoard is aware of userId
      }
    } catch (error: any) {
      console.error("Error fetching boards:", error.message);
      setAllBoardTitles([]);
      setActiveBoardId(null);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
    // Pass handleNewBoard as dependency if it uses state/props from this scope
  }, [userId, activeBoardId]); // Removed handleNewBoard from here, handle in its own useCallback


  const saveBoardToSupabase = useCallback(async () => {
      // Guard clause now only checks userId and activeBoardId
      if (!userId || !activeBoardId) return;
      const currentBoardMeta = allBoardTitles.find(b => b.id === activeBoardId);
      const boardTitle = currentBoardMeta?.title || activeBoardId;

      console.log(`Saving board ${activeBoardId} (${boardTitle}) to Supabase for user ${userId}`);
      const notesToSave = notes.map(({ dbId, ...rest }) => rest);

      try {
          const { error } = await supabase
              .from('boards')
              .upsert({
                  id: activeBoardId,
                  user_id: userId,
                  title: boardTitle,
                  content: notesToSave,
                  updated_at: new Date().toISOString()
              }, { onConflict: 'id' });

          if (error) throw error;
          console.log(`Board ${activeBoardId} saved successfully.`);
      } catch (error: any) {
          console.error("Error saving board:", error.message);
      }
      // Removed isOffline from dependency array
  }, [userId, activeBoardId, notes, allBoardTitles]);


  // --- Local Storage Data Handling ---
  const loadDataFromLocalStorage = useCallback(() => {
    // This function now only runs when userId is null (based on useEffect logic)
    setIsLoading(true);
    console.log("Loading from local storage");
    const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
    let data: LocalBoardsData = { activeBoardId: null, boards: {} };
    if (savedDataString) {
      try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; }
      catch (error) { console.error("Failed to parse local boards data:", error); data = { activeBoardId: null, boards: {} }; }
    }

    const boardIds = Object.keys(data.boards);
    const localTitles = boardIds.map(id => ({ id: id, title: id }));
    setAllBoardTitles(localTitles);

    let currentActiveId = data.activeBoardId;
    if (boardIds.length === 0) {
      console.log("No local boards, creating initial local board.");
      // Call handleNewBoard, ensuring it knows it's in offline context
      handleNewBoard(); // handleNewBoard needs to check userId internally
    } else {
      if (!currentActiveId || !data.boards[currentActiveId]) {
        currentActiveId = boardIds[0]; data.activeBoardId = currentActiveId;
        localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
      }
      setActiveBoardId(currentActiveId);
      const activeNotes = (data.boards[currentActiveId] || []).map(note => ({ ...note, nextActions: note.nextActions || [] }));
      setNotes(activeNotes);
      console.log("Loaded local board:", currentActiveId, activeNotes);
    }
    setIsLoading(false);
    // Pass handleNewBoard as dependency if needed
  }, []); // Removed handleNewBoard from here


  const saveDataToLocalStorage = useCallback(() => {
    // Guard clause now only checks activeBoardId (assumes !userId context from useEffect)
    if (!activeBoardId) return;
    console.log("Saving to local storage:", activeBoardId);
    const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
    let data: LocalBoardsData = { activeBoardId: null, boards: {} };
    if (savedDataString) { try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; } catch (error) { console.error("Failed parse on local save:", error); return; } }

    data.boards[activeBoardId] = notes;
    data.activeBoardId = activeBoardId;
    localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
    // Removed isOffline from dependency array
  }, [notes, activeBoardId]);


  // --- Effects ---
  // Initial data load effect - Runs when userId changes (login/logout)
  useEffect(() => {
    if (userId) {
      console.log("User detected, fetching from Supabase...");
      fetchBoardsFromSupabase();
    } else {
      console.log("No user detected, loading from local storage...");
      loadDataFromLocalStorage();
    }
  }, [userId, fetchBoardsFromSupabase, loadDataFromLocalStorage]); // Depends only on userId and the load functions

  // Save data effect - Saves whenever notes or active board change
  useEffect(() => {
    if (isLoading) return;
    if (userId) {
      saveBoardToSupabase();
    } else {
      saveDataToLocalStorage();
    }
  }, [notes, activeBoardId, userId, isLoading, saveBoardToSupabase, saveDataToLocalStorage]); // Depends on data, userId, and save functions

  // Save summary width
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

  // handleNewBoard now checks userId internally
  const handleNewBoard = useCallback(async () => {
    const namePart = generateIrishName(2);
    const numberPart = Math.floor(1000 + Math.random() * 9000);
    const defaultTitle = `${namePart}_${numberPart}`;

    if (userId) { // Check if user is logged in
      setIsLoading(true);
      console.log("Creating new board in Supabase...");
      try {
        const { data, error } = await supabase
          .from('boards')
          .insert({ user_id: userId, title: defaultTitle, content: [] })
          .select('id, title')
          .single();
        if (error) throw error;
        if (data) {
          console.log("New board created:", data);
          const newBoardInfo = { id: data.id, title: data.title || data.id };
          setAllBoardTitles(prev => [...prev, newBoardInfo]);
          setActiveBoardId(data.id);
          setNotes([]);
        } else { console.error("New board created but no data returned."); }
      } catch (error: any) { console.error("Error creating new board:", error.message); }
      finally { setIsLoading(false); }
    } else { // Offline mode
      console.log("Creating new local board:", defaultTitle);
      const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
      let data: LocalBoardsData = { activeBoardId: null, boards: {} };
      if (savedDataString) { try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; } catch (e) { /* ignore */ } }
      if (data.boards[defaultTitle]) { alert("Generated name collision. Try again."); return; }
      data.boards[defaultTitle] = [];
      data.activeBoardId = defaultTitle;
      localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
      setAllBoardTitles(prevIds => [...prevIds, { id: defaultTitle, title: defaultTitle }]);
      setActiveBoardId(defaultTitle);
      setNotes([]);
    }
    // Removed isOffline from dependency array
  }, [userId]);

  // handleBoardSelectChange now checks userId internally
  const handleBoardSelectChange = useCallback(async (selectedBoardId: string) => {
    if (!selectedBoardId || selectedBoardId === activeBoardId) return;
    console.log("Switching board to:", selectedBoardId);
    setActiveBoardId(selectedBoardId);

    if (userId) { // Check if user is logged in
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('boards')
          .select('content')
          .eq('id', selectedBoardId)
          .eq('user_id', userId)
          .single();
        if (error) throw error;
        if (data) {
          const loadedNotes = (data.content || []).map((note: any) => ({ ...note, nextActions: note.nextActions || [] }));
          setNotes(loadedNotes);
          console.log("Switched to Supabase board:", selectedBoardId, loadedNotes);
        } else {
          console.error(`Board ${selectedBoardId} not found or not accessible.`);
          setActiveBoardId(activeBoardId);
        }
      } catch (error: any) { console.error("Error fetching selected board:", error.message); setActiveBoardId(activeBoardId); }
      finally { setIsLoading(false); }
    } else { // Offline mode
      const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
      if (savedDataString) {
        try {
          const data: LocalBoardsData = JSON.parse(savedDataString);
          if (data.boards && data.boards[selectedBoardId]) {
            const activeNotes = (data.boards[selectedBoardId] || []).map(note => ({ ...note, nextActions: note.nextActions || [] }));
            setNotes(activeNotes);
            console.log("Switched to local board:", selectedBoardId, activeNotes);
            data.activeBoardId = selectedBoardId;
            localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
          } else { console.error(`Local board ${selectedBoardId} not found.`); setActiveBoardId(activeBoardId); }
        } catch (error) { console.error("Failed parse on local select:", error); setActiveBoardId(activeBoardId); }
      }
    }
    // Removed isOffline from dependency array
  }, [activeBoardId, userId]);


  // --- Render Logic ---
  const noteContainerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px', minHeight: '150px', width: '100%', alignItems: 'flex-start', justifyContent: 'center', height: '100%' };
  const currentEditingNote = notes.find(note => note.id === editingNoteId) || null;
  const onResize = (_event: React.SyntheticEvent, data: ResizeCallbackData) => { setSummaryWidth(data.size.width); };
  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { handleAddNote(); } };

  // Simplified loading check
  if (isLoading) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
         <div>
            <label htmlFor="board-select-revert" style={{ marginRight: '5px' }}>Board:</label>
            <select id="board-select-revert" value={activeBoardId || ''} onChange={(e) => handleBoardSelectChange(e.target.value)} style={{ padding: '8px', marginRight: '10px' }} disabled={isLoading}>
              {allBoardTitles.map(board => <option key={board.id} value={board.id}>{board.title}</option>)}
            </select>
            <button onClick={handleNewBoard} style={{ padding: '8px 12px' }} disabled={isLoading}>New Board</button>
         </div>
         <div style={{ textAlign: 'center' }}>
            <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyPress={handleInputKeyPress} placeholder="Enter new idea..." style={{ marginRight: '10px', padding: '8px' }} disabled={isLoading || !activeBoardId} />
            <button onClick={handleAddNote} style={{ padding: '8px 12px' }} disabled={isLoading || !activeBoardId || noteInput.trim() === ''}>Add</button>
         </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'stretch', overflow: 'hidden', gap: '20px' }}>
        {/* Whiteboard Area */}
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'stretch', gap: '20px', overflowY: 'auto', padding: '10px', border: '1px solid lightgrey', background: '#f0f0f0' }}>
          {/* Zones */}
          <CircleZone zoneId="wwtf" onDropNote={handleMoveNote}>
            <div style={noteContainerStyle}>
              {notes.filter(note => note.zone === 'wwtf').map(note => ( <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} /> ))}
            </div>
          </CircleZone>
          <CircleZone zoneId="wtf" onDropNote={handleMoveNote}>
             <div style={noteContainerStyle}>
                {notes.filter(note => note.zone === 'wtf').map(note => ( <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} /> ))}
             </div>
          </CircleZone>
          <CircleZone zoneId="clarity" onDropNote={handleMoveNote}>
             <div style={noteContainerStyle}>
                {notes.filter(note => note.zone === 'clarity').map(note => ( <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} /> ))}
             </div>
          </CircleZone>
        </div>
        {/* Resizable Summary List Area */}
        <ResizableBox width={summaryWidth} height={Infinity} axis="x" resizeHandles={['w']} handle={<span className="custom-resize-handle" />} minConstraints={[150, Infinity]} maxConstraints={[600, Infinity]} onResize={onResize} style={{ overflow: 'hidden', display: 'flex', position: 'relative', background: 'white' }}>
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