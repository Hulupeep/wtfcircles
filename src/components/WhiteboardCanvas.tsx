import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StickyNote, { StickyNoteProps } from './StickyNote';
import CircleZone from './CircleZone';
import NextActionsModal from './NextActionsModal';
import ZoneSummaryList from './ZoneSummaryList';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { generateIrishName } from '../utils/nameGenerator';
import { supabase, Board as SupabaseBoardData } from '../utils/supabaseClient'; // Import Supabase client and type

// --- Types ---
interface Action { id: string; text: string; completed: boolean; }
// Make Note compatible with SupabaseBoardData structure where possible
interface Note extends StickyNoteProps {
  nextActions: Action[];
  // Supabase fields (optional as they might not exist in local state initially)
  dbId?: string; // Corresponds to Supabase 'id'
  title?: string | null; // Corresponds to Supabase 'title'
}
type Zone = 'wwtf' | 'wtf' | 'clarity';

// Type for data stored in local storage (remains similar)
interface LocalBoardsData {
    activeBoardId: string | null;
    boards: { [boardId: string]: Note[] }; // boardId here is the locally generated name like 'IrishName_1234'
}

// Props for the component
interface WhiteboardCanvasProps {
  userId?: string | null; // User ID from Supabase auth, optional
  isOffline: boolean;     // Flag indicating if user chose offline mode
}

// --- Constants ---
const LOCAL_BOARDS_DATA_KEY = 'wtfBoardsData'; // Key for local storage
const SUMMARY_WIDTH_KEY = 'wtfSummaryWidth';

// --- Component ---
const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ userId, isOffline }) => {
  const [notes, setNotes] = useState<Note[]>([]); // Notes for the currently active board
  const [allBoardTitles, setAllBoardTitles] = useState<{ id: string; title: string }[]>([]); // Store {dbId, title} for online, {localId, localId} for offline
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null); // Can be Supabase UUID or local name
  const [noteInput, setNoteInput] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null); // Uses note.id (local note id)
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [summaryWidth, setSummaryWidth] = useState<number>(() => {
    const savedWidth = localStorage.getItem(SUMMARY_WIDTH_KEY);
    return savedWidth ? parseInt(savedWidth, 10) : 300;
  });

  // --- Supabase Data Fetching/Saving ---

  const fetchBoardsFromSupabase = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    console.log("Fetching boards for user:", userId);
    try {
      const { data: boardsData, error } = await supabase
        .from('boards')
        .select('id, title, content, updated_at') // Select necessary fields
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }); // Get most recent first

      if (error) throw error;

      console.log("Fetched boards:", boardsData);

      if (boardsData && boardsData.length > 0) {
        const titles = boardsData.map(b => ({ id: b.id, title: b.title || b.id })); // Use ID if title is null
        setAllBoardTitles(titles);
        // Try to keep the previously active board if it exists, otherwise load the first one
        const currentActiveIsValid = activeBoardId && boardsData.some(b => b.id === activeBoardId);
        const boardToLoad = currentActiveIsValid ? boardsData.find(b => b.id === activeBoardId) : boardsData[0];

        if (boardToLoad) {
            setActiveBoardId(boardToLoad.id);
            // Ensure content is parsed correctly and nextActions is initialized
            const loadedNotes = (boardToLoad.content || []).map((note: any) => ({
                ...note,
                dbId: boardToLoad.id, // Store the db board id with the note if needed
                nextActions: note.nextActions || []
            }));
            setNotes(loadedNotes);
            console.log("Loaded board:", boardToLoad.id, loadedNotes);
        } else {
            // This case shouldn't happen if boardsData is not empty, but handle defensively
             setActiveBoardId(null);
             setNotes([]);
             console.log("No valid board found to load.");
        }

      } else {
        // No boards found for the user, create a new one
        console.log("No boards found, creating initial board.");
        handleNewBoard(); // This will now create one in Supabase
      }
    } catch (error: any) {
      console.error("Error fetching boards:", error.message);
      // Handle error (e.g., show message to user)
      // Fallback to local? Or show error state? For now, just log.
      setAllBoardTitles([]);
      setActiveBoardId(null);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, activeBoardId]); // Depend on userId and activeBoardId to refetch if needed


  const saveBoardToSupabase = useCallback(async () => {
      if (!userId || !activeBoardId || isOffline) return;
      // Find the title corresponding to the activeBoardId
      const currentBoardMeta = allBoardTitles.find(b => b.id === activeBoardId);
      const boardTitle = currentBoardMeta?.title || activeBoardId; // Fallback to ID if title missing

      console.log(`Saving board ${activeBoardId} (${boardTitle}) to Supabase for user ${userId}`);

      // Prepare notes for saving (remove temporary fields if any)
      const notesToSave = notes.map(({ dbId, ...rest }) => rest); // Exclude dbId from content

      try {
          const { error } = await supabase
              .from('boards')
              .upsert({
                  id: activeBoardId, // The UUID of the board
                  user_id: userId,
                  title: boardTitle,
                  content: notesToSave, // Save the current notes array
                  updated_at: new Date().toISOString() // Explicitly set update time
              }, { onConflict: 'id' }); // Use 'id' for upsert conflict resolution

          if (error) throw error;
          console.log(`Board ${activeBoardId} saved successfully.`);
      } catch (error: any) {
          console.error("Error saving board:", error.message);
          // Handle error (e.g., show message, retry logic)
      }
  }, [userId, activeBoardId, notes, isOffline, allBoardTitles]);


  // --- Local Storage Data Handling ---

  const loadDataFromLocalStorage = useCallback(() => {
    setIsLoading(true);
    console.log("Loading from local storage");
    const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
    let data: LocalBoardsData = { activeBoardId: null, boards: {} };
    if (savedDataString) {
      try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; }
      catch (error) { console.error("Failed to parse local boards data:", error); data = { activeBoardId: null, boards: {} }; }
    }

    const boardIds = Object.keys(data.boards);
    const localTitles = boardIds.map(id => ({ id: id, title: id })); // Use local ID as title for offline
    setAllBoardTitles(localTitles);

    let currentActiveId = data.activeBoardId;
    if (boardIds.length === 0) {
      console.log("No local boards, creating initial local board.");
      const namePart = generateIrishName(2);
      const numberPart = Math.floor(1000 + Math.random() * 9000);
      const newBoardId = `${namePart}_${numberPart}`;
      data.boards[newBoardId] = []; data.activeBoardId = newBoardId;
      setAllBoardTitles([{ id: newBoardId, title: newBoardId }]);
      setActiveBoardId(newBoardId);
      setNotes([]);
      localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
    } else {
      if (!currentActiveId || !data.boards[currentActiveId]) {
        currentActiveId = boardIds[0]; data.activeBoardId = currentActiveId;
        localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data)); // Save corrected active ID
      }
      setActiveBoardId(currentActiveId);
      const activeNotes = (data.boards[currentActiveId] || []).map(note => ({ ...note, nextActions: note.nextActions || [] }));
      setNotes(activeNotes);
      console.log("Loaded local board:", currentActiveId, activeNotes);
    }
    setIsLoading(false);
  }, []);

  const saveDataToLocalStorage = useCallback(() => {
    if (!isOffline || !activeBoardId) return; // Only save locally if offline and board exists
    console.log("Saving to local storage:", activeBoardId);
    const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
    let data: LocalBoardsData = { activeBoardId: null, boards: {} };
    if (savedDataString) { try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; } catch (error) { console.error("Failed parse on local save:", error); return; } }

    data.boards[activeBoardId] = notes; // Save current notes under the active local board ID
    data.activeBoardId = activeBoardId;
    localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
  }, [notes, activeBoardId, isOffline]);


  // --- Effects ---

  // Initial data load effect
  useEffect(() => {
    if (!isOffline && userId) {
      fetchBoardsFromSupabase();
    } else if (isOffline) {
      loadDataFromLocalStorage();
    } else {
      // Not offline, but no userId (user logged out or not yet logged in)
      // For now, treat as offline until login occurs
      loadDataFromLocalStorage();
      // Consider prompting user to log in or continue offline here
    }
  }, [userId, isOffline, fetchBoardsFromSupabase, loadDataFromLocalStorage]); // Rerun if user logs in/out or switches mode

  // Save data effect (debounced save could be added here)
  useEffect(() => {
    if (isLoading) return; // Don't save while initially loading

    if (!isOffline && userId) {
      saveBoardToSupabase();
    } else if (isOffline) {
      saveDataToLocalStorage();
    }
  }, [notes, activeBoardId, userId, isOffline, isLoading, saveBoardToSupabase, saveDataToLocalStorage]); // Save when notes/board changes

  // Save summary width
  useEffect(() => { localStorage.setItem(SUMMARY_WIDTH_KEY, summaryWidth.toString()); }, [summaryWidth]);

  // --- Handlers ---
  const handleAddNote = () => {
    if (noteInput.trim() === '' || !activeBoardId) return;
    // Note: The 'id' here is the *local* note identifier within the board's content array.
    // Supabase uses its own 'id' for the board row itself.
    const newNote: Note = { id: `note-${Date.now()}-${Math.random()}`, text: noteInput, zone: 'wwtf', nextActions: [] };
    setNotes((prevNotes) => [...prevNotes, newNote]); setNoteInput('');
    // Saving is handled by the useEffect hook
  };

  const handleMoveNote = useCallback((noteId: string, targetZone: Zone) => {
    if (!activeBoardId) return;
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, zone: targetZone } : note));
    // Saving is handled by the useEffect hook
  }, [activeBoardId]);

  const handleNoteDoubleClick = (noteId: string) => { setEditingNoteId(noteId); };
  const handleCloseModal = () => { setEditingNoteId(null); };

  const handleAddAction = (noteId: string, actionText: string) => {
    if (!activeBoardId) return;
    const newAction: Action = { id: `action-${Date.now()}-${Math.random()}`, text: actionText, completed: false };
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, nextActions: [...(note.nextActions || []), newAction] } : note));
    // Saving is handled by the useEffect hook
  };

  const handleToggleAction = (noteId: string, actionId: string) => {
    if (!activeBoardId) return;
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, nextActions: (note.nextActions || []).map((action) => action.id === actionId ? { ...action, completed: !action.completed } : action), } : note));
    // Saving is handled by the useEffect hook
  };

  const handleNewBoard = useCallback(async () => {
    const namePart = generateIrishName(2);
    const numberPart = Math.floor(1000 + Math.random() * 9000);
    const defaultTitle = `${namePart}_${numberPart}`; // Used as title if online, ID if offline

    if (!isOffline && userId) {
      // Create new board in Supabase
      setIsLoading(true);
      console.log("Creating new board in Supabase...");
      try {
        const { data, error } = await supabase
          .from('boards')
          .insert({ user_id: userId, title: defaultTitle, content: [] }) // Insert empty board
          .select('id, title') // Select the new board's ID and title
          .single(); // Expecting a single row back

        if (error) throw error;

        if (data) {
          console.log("New board created:", data);
          const newBoardInfo = { id: data.id, title: data.title || data.id };
          setAllBoardTitles(prev => [...prev, newBoardInfo]);
          setActiveBoardId(data.id);
          setNotes([]); // Start with empty notes for the new board
        } else {
           console.error("New board created but no data returned.");
           // Handle error state
        }
      } catch (error: any) {
        console.error("Error creating new board:", error.message);
        // Handle error (e.g., show message)
      } finally {
        setIsLoading(false);
      }
    } else {
      // Create new board locally (Offline mode)
      console.log("Creating new local board:", defaultTitle);
      const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
      let data: LocalBoardsData = { activeBoardId: null, boards: {} };
      if (savedDataString) { try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; } catch (e) { /* ignore */ } }

      if (data.boards[defaultTitle]) { alert("Generated name collision. Try again."); return; } // Check local collision

      data.boards[defaultTitle] = []; // Add new empty board locally
      data.activeBoardId = defaultTitle;
      localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data)); // Save updated local data

      setAllBoardTitles(prevIds => [...prevIds, { id: defaultTitle, title: defaultTitle }]);
      setActiveBoardId(defaultTitle);
      setNotes([]);
    }
  }, [userId, isOffline]);

  const handleBoardSelectChange = useCallback(async (selectedBoardId: string) => {
    if (!selectedBoardId || selectedBoardId === activeBoardId) return;
    console.log("Switching board to:", selectedBoardId);
    setActiveBoardId(selectedBoardId); // Optimistically set active board

    if (!isOffline && userId) {
      // Fetch the selected board's content from Supabase
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('boards')
          .select('content')
          .eq('id', selectedBoardId)
          .eq('user_id', userId) // Ensure user owns the board
          .single();

        if (error) throw error;

        if (data) {
          const loadedNotes = (data.content || []).map((note: any) => ({
            ...note,
            nextActions: note.nextActions || []
          }));
          setNotes(loadedNotes);
          console.log("Switched to Supabase board:", selectedBoardId, loadedNotes);
          // No need to save activeBoardId to Supabase, only content changes trigger saves
        } else {
          console.error(`Board ${selectedBoardId} not found or not accessible.`);
          // Handle error - maybe revert selection?
          setActiveBoardId(activeBoardId); // Revert optimistic set
        }
      } catch (error: any) {
        console.error("Error fetching selected board:", error.message);
        setActiveBoardId(activeBoardId); // Revert optimistic set
      } finally {
        setIsLoading(false);
      }
    } else {
      // Load from local storage (Offline mode)
      const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
      if (savedDataString) {
        try {
          const data: LocalBoardsData = JSON.parse(savedDataString);
          if (data.boards && data.boards[selectedBoardId]) {
            const activeNotes = (data.boards[selectedBoardId] || []).map(note => ({ ...note, nextActions: note.nextActions || [] }));
            setNotes(activeNotes);
            console.log("Switched to local board:", selectedBoardId, activeNotes);
            // Save the newly selected active board ID locally
            data.activeBoardId = selectedBoardId;
            localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
          } else {
            console.error(`Local board ${selectedBoardId} not found.`);
            setActiveBoardId(activeBoardId); // Revert optimistic set
          }
        } catch (error) {
          console.error("Failed parse on local select:", error);
          setActiveBoardId(activeBoardId); // Revert optimistic set
        }
      }
    }
  }, [activeBoardId, userId, isOffline]);


  // --- Render Logic ---
  const noteContainerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px', minHeight: '150px', width: '100%', alignItems: 'flex-start', justifyContent: 'center', height: '100%' };
  const currentEditingNote = notes.find(note => note.id === editingNoteId) || null;
  const onResize = (event: React.SyntheticEvent, data: ResizeCallbackData) => { setSummaryWidth(data.size.width); };
  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { handleAddNote(); } };

  if (isLoading && !isOffline && userId) {
      return <div className="flex justify-center items-center h-screen">Loading boards...</div>;
  }
   if (isLoading && isOffline) {
       return <div className="flex justify-center items-center h-screen">Loading local data...</div>;
   }
   // Add case for isLoading && !userId? Or handled by App.tsx showing login?

  return (
    <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', /* Adjust based on App header height */ overflow: 'hidden' }}>
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
            {/* Changed button text */}
            <button onClick={handleAddNote} style={{ padding: '8px 12px' }} disabled={isLoading || !activeBoardId || noteInput.trim() === ''}>Add</button>
         </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'stretch', overflow: 'hidden', gap: '20px' }}>

        {/* Whiteboard Area */}
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'stretch', gap: '20px', overflowY: 'auto', padding: '10px', border: '1px solid lightgrey', background: '#f0f0f0' /* Added background */ }}>
          {/* WWTF Zone */}
          <CircleZone zoneId="wwtf" onDropNote={handleMoveNote}>
            <div style={noteContainerStyle}>
              {notes.filter(note => note.zone === 'wwtf').map(note => (
                 <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} />
              ))}
            </div>
          </CircleZone>
          {/* WTF Zone */}
          <CircleZone zoneId="wtf" onDropNote={handleMoveNote}>
             <div style={noteContainerStyle}>
                {notes.filter(note => note.zone === 'wtf').map(note => (
                   <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} />
                ))}
             </div>
          </CircleZone>
          {/* Clarity Zone */}
          <CircleZone zoneId="clarity" onDropNote={handleMoveNote}>
             <div style={noteContainerStyle}>
                {notes.filter(note => note.zone === 'clarity').map(note => (
                   <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} />
                ))}
             </div>
          </CircleZone>
        </div>

        {/* Resizable Summary List Area */}
        <ResizableBox width={summaryWidth} height={Infinity} axis="x" resizeHandles={['w']} handle={<span className="custom-resize-handle" />} minConstraints={[150, Infinity]} maxConstraints={[600, Infinity]} onResize={onResize} style={{ overflow: 'hidden', display: 'flex', position: 'relative', background: 'white' /* Added background */ }}>
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