import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import StickyNote, { StickyNoteProps } from './StickyNote';
import CircleZone from './CircleZone';
import NextActionsModal from './NextActionsModal';
import ZoneSummaryList from './ZoneSummaryList';
import ShareModal from './ShareModal';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { generateIrishName } from '../utils/nameGenerator';
import { supabase } from '../utils/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js'; // Import RealtimeChannel type

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
interface WhiteboardCanvasProps {
  userId?: string | null;
  sharedBoardId?: string | null;
}
interface AccessibleBoard {
    id: string;
    title: string | null;
    content: any | null;
    updated_at: string;
    shared: boolean;
    user_id: string;
}

// --- Constants ---
const LOCAL_BOARDS_DATA_KEY = 'wtfBoardsData';
const SUMMARY_WIDTH_KEY = 'wtfSummaryWidth';

// --- Component ---
const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ userId, sharedBoardId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allBoardTitles, setAllBoardTitles] = useState<{ id: string; title: string; isOwner: boolean }[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(sharedBoardId || null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summaryWidth, setSummaryWidth] = useState<number>(() => {
    const savedWidth = localStorage.getItem(SUMMARY_WIDTH_KEY);
    return savedWidth ? parseInt(savedWidth, 10) : 300;
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  // Ref to store the current notes state for comparison in callback, avoiding stale closures
  const notesRef = useRef<Note[]>(notes);
  useEffect(() => {
      notesRef.current = notes;
  }, [notes]);


  // --- Supabase Data Fetching/Saving ---
  const fetchSpecificBoard = useCallback(async (boardId: string) => {
      setIsLoading(true);
      setLoadError(null);
      console.log(`Fetching specific board (shared or direct): ${boardId}`);
      try {
          const { data: boardData, error } = await supabase.from('boards').select('id, title, content, user_id').eq('id', boardId).maybeSingle();
          if (error) throw new Error(`Database error: ${error.message}`);
          if (boardData) {
              console.log("Fetched specific board data:", boardData);
              const boardMeta = { id: boardData.id, title: boardData.title || boardData.id, isOwner: boardData.user_id === userId };
              setAllBoardTitles([boardMeta]);
              setActiveBoardId(boardData.id);
              const content = boardData.content;
              if (Array.isArray(content)) {
                  const loadedNotes = content.map((note: any) => ({ ...note, dbId: boardData.id, nextActions: note.nextActions || [] }));
                  setNotes(loadedNotes);
                  console.log(`Successfully loaded ${loadedNotes.length} notes for board ${boardData.id}`);
              } else { console.warn(`Board ${boardData.id} content is not an array:`, content); setNotes([]); }
          } else {
              console.warn(`Board ${boardId} not found or access denied by RLS.`);
              setLoadError(`Board not found or access denied. Please check the link or your permissions.`);
              setAllBoardTitles([]); setActiveBoardId(null); setNotes([]);
          }
      } catch (error: any) {
          console.error("Error in fetchSpecificBoard logic:", error);
          setLoadError(`Failed to load board: ${error.message}`);
          setAllBoardTitles([]); setActiveBoardId(null); setNotes([]);
      } finally { setIsLoading(false); }
  }, [userId]);

  const fetchUserBoards = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setLoadError(null);
    console.log("Fetching user's accessible boards via RPC for user:", userId);
    try {
        const { data, error } = await supabase.rpc('get_user_accessible_boards');
        if (error) throw error;
        const accessibleBoards = data as AccessibleBoard[] | null;
        console.log("Accessible boards fetched via RPC:", accessibleBoards);
        if (accessibleBoards && accessibleBoards.length > 0) {
            const titles = accessibleBoards.map(b => ({ id: b.id, title: b.title || b.id, isOwner: b.user_id === userId }));
            titles.sort((a, b) => { if (a.isOwner && !b.isOwner) return -1; if (!a.isOwner && b.isOwner) return 1; return (a.title || '').localeCompare(b.title || ''); });
            setAllBoardTitles(titles);
            const lastActiveId = activeBoardId;
            let boardToLoad = null;
            if (lastActiveId && accessibleBoards.some(b => b.id === lastActiveId)) { boardToLoad = accessibleBoards.find(b => b.id === lastActiveId); }
            else { const firstOwned = accessibleBoards.find(b => b.user_id === userId); boardToLoad = firstOwned || accessibleBoards[0]; }
            if (boardToLoad) {
                setActiveBoardId(boardToLoad.id);
                const content = boardToLoad.content;
                if (Array.isArray(content)) {
                    const loadedNotes = content.map((note: any) => ({ ...note, dbId: boardToLoad.id, nextActions: note.nextActions || [] }));
                    setNotes(loadedNotes);
                    console.log(`Loaded board ${boardToLoad.id} with ${loadedNotes.length} notes.`);
                } else { console.warn(`Board ${boardToLoad.id} content is not an array:`, content); setNotes([]); }
            } else { await handleNewBoard(); }
        } else { await handleNewBoard(); }
    } catch (error: any) {
        console.error("Error during fetchUserBoards process:", error.message);
        setLoadError(`Failed to load boards list: ${error.message}`);
        setAllBoardTitles([]); setActiveBoardId(null); setNotes([]);
    } finally { setIsLoading(false); }
  }, [userId, activeBoardId]);

  const saveBoardToSupabase = useCallback(async () => {
      if (!activeBoardId || (!userId && !sharedBoardId)) return;
      const boardMeta = allBoardTitles.find(b => b.id === activeBoardId);
      const boardTitle = boardMeta?.title || activeBoardId;
      // console.log(`Attempting to save board ${activeBoardId} (${boardTitle})`); // Reduce logging noise
      const notesToSave = notesRef.current.map(({ dbId, ...rest }) => rest); // Use ref for current notes
      try {
          const { error } = await supabase.from('boards').update({ content: notesToSave, updated_at: new Date().toISOString() }).eq('id', activeBoardId);
          if (error) throw error;
          // console.log(`Board ${activeBoardId} saved successfully.`); // Reduce logging noise
      } catch (error: any) { console.error("Error saving board:", error.message); }
  }, [userId, sharedBoardId, activeBoardId, allBoardTitles]); // notes removed, using ref

  const loadDataFromLocalStorage = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    console.log("Loading from local storage (no user/shared board)");
    try {
        const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
        let data: LocalBoardsData = { activeBoardId: null, boards: {} };
        if (savedDataString) { data = JSON.parse(savedDataString); data.boards = data.boards || {}; }
        const boardIds = Object.keys(data.boards);
        const localTitles = boardIds.map(id => ({ id: id, title: id, isOwner: true }));
        setAllBoardTitles(localTitles);
        let currentActiveId = data.activeBoardId;
        if (boardIds.length === 0) { handleNewBoard(); }
        else {
            if (!currentActiveId || !data.boards[currentActiveId]) { currentActiveId = boardIds[0]; data.activeBoardId = currentActiveId; localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data)); }
            setActiveBoardId(currentActiveId);
            const activeNotes = (data.boards[currentActiveId] || []).map(note => ({ ...note, nextActions: note.nextActions || [] }));
            setNotes(activeNotes);
            console.log("Loaded local board:", currentActiveId);
        }
    } catch (error) { console.error("Failed to load or parse local boards data:", error); setLoadError("Failed to load local data."); localStorage.removeItem(LOCAL_BOARDS_DATA_KEY); setAllBoardTitles([]); setActiveBoardId(null); setNotes([]); handleNewBoard(); }
    finally { setIsLoading(false); }
  }, []);

  const saveDataToLocalStorage = useCallback(() => {
    if (!activeBoardId) return;
    // console.log("Saving to local storage:", activeBoardId); // Reduce noise
    try {
        const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
        let data: LocalBoardsData = { activeBoardId: null, boards: {} };
        if (savedDataString) { try { data = JSON.parse(savedDataString); data.boards = data.boards || {}; } catch (error) { console.error("Failed parse on local save (reading existing):", error); data = { activeBoardId: null, boards: {} }; } }
        data.boards[activeBoardId] = notesRef.current; // Use ref
        data.activeBoardId = activeBoardId;
        localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
    } catch (error) { console.error("Failed to save data to local storage:", error); }
  }, [activeBoardId]); // notes removed, using ref

  // --- Effects ---
  useEffect(() => {
    if (sharedBoardId) { fetchSpecificBoard(sharedBoardId); }
    else if (userId) { fetchUserBoards(); }
    else { loadDataFromLocalStorage(); }
  }, [userId, sharedBoardId, fetchSpecificBoard, fetchUserBoards, loadDataFromLocalStorage]);

  // Debounced save effect
  useEffect(() => {
      if (isLoading) return;

      const handler = setTimeout(() => {
          if (userId || sharedBoardId) {
              saveBoardToSupabase();
          } else {
              saveDataToLocalStorage();
          }
      }, 1000); // Debounce saves by 1 second

      return () => {
          clearTimeout(handler); // Clear timeout if notes/board change quickly
      };
  // Removed direct dependency on notes, relying on notesRef inside save functions
  }, [notes, activeBoardId, userId, sharedBoardId, isLoading, saveBoardToSupabase, saveDataToLocalStorage]);


  useEffect(() => { localStorage.setItem(SUMMARY_WIDTH_KEY, summaryWidth.toString()); }, [summaryWidth]);

  // --- Realtime Subscription Effect ---
  useEffect(() => {
      // Only subscribe if we have an active board ID from Supabase (UUID format)
      // and Realtime is supported/enabled.
      if (!activeBoardId || !activeBoardId.includes('-')) { // Basic check for UUID format
          console.log("Realtime: No active Supabase board ID, skipping subscription.");
          return;
      }

      console.log(`Realtime: Setting up subscription for board ${activeBoardId}`);
      const channelName = `board-${activeBoardId}`;
      const channel: RealtimeChannel = supabase.channel(channelName, {
          config: {
              broadcast: {
                  ack: true, // Request acknowledgement from server
              },
          },
      });

      channel
          .on(
              'postgres_changes',
              {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'boards',
                  filter: `id=eq.${activeBoardId}`,
              },
              (payload) => {
                  console.log('Realtime: Received board UPDATE payload:', payload);
                  const updatedBoard = payload.new as AccessibleBoard; // Type assertion

                  if (updatedBoard && updatedBoard.content) {
                      // --- Loop Prevention ---
                      // Compare incoming content with the *current* notes state via ref
                      const currentNotesString = JSON.stringify(notesRef.current.map(({ dbId, ...rest }) => rest)); // Match format saved to DB
                      const incomingNotesString = JSON.stringify(updatedBoard.content);

                      if (currentNotesString !== incomingNotesString) {
                          console.log("Realtime: Incoming content differs, updating local state.");
                          // Ensure incoming content structure matches Note[]
                          const newNotes = (updatedBoard.content as any[] || []).map(note => ({
                              ...note,
                              nextActions: note.nextActions || []
                          }));
                          setNotes(newNotes);
                      } else {
                          console.log("Realtime: Incoming content matches local state, skipping update.");
                      }
                  } else {
                       console.warn("Realtime: Received UPDATE payload without valid content.", payload);
                  }
              }
          )
          .subscribe((status, err) => {
              if (status === 'SUBSCRIBED') {
                  console.log(`Realtime: Successfully subscribed to ${channelName}`);
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                  console.error(`Realtime: Subscription error on ${channelName}:`, status, err);
                  setLoadError(`Realtime connection error: ${err?.message || status}`);
              } else {
                   console.log(`Realtime: Channel status ${channelName}:`, status);
               }
               // Log the error object if present on error/timeout
               if (err) {
                   console.error(`Realtime: Error details for ${channelName}:`, err);
               }
           });

       // Cleanup function
       return () => {
          console.log(`Realtime: Unsubscribing from ${channelName}`);
          supabase.removeChannel(channel).catch(err => console.error("Realtime: Error removing channel", err));
      };
  }, [activeBoardId]); // Depend only on activeBoardId


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
  const handleCloseShareModal = () => { setShowShareModal(false); setShareError(null); };
  const handleAddAction = (noteId: string, actionText: string) => {
    if (!activeBoardId) return;
    const newAction: Action = { id: `action-${Date.now()}-${Math.random()}`, text: actionText, completed: false };
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, nextActions: [...(note.nextActions || []), newAction] } : note));
  };
  const handleToggleAction = (noteId: string, actionId: string) => {
    if (!activeBoardId) return;
    setNotes((prevNotes) => prevNotes.map((note) => note.id === noteId ? { ...note, nextActions: (note.nextActions || []).map((action) => action.id === actionId ? { ...action, completed: !action.completed } : action), } : note));
  };

  const handleNewBoard = useCallback(async () => {
    if (!userId) {
        console.log("Creating new local board (as no user is logged in)...");
        const namePart = generateIrishName(2);
        const numberPart = Math.floor(1000 + Math.random() * 9000);
        const defaultTitle = `${namePart}_${numberPart}`;
        try {
            const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
            let data: LocalBoardsData = { activeBoardId: null, boards: {} };
            if (savedDataString) { data = JSON.parse(savedDataString); data.boards = data.boards || {}; }
            if (data.boards[defaultTitle]) { alert("Generated name collision. Try again."); return; }
            data.boards[defaultTitle] = []; data.activeBoardId = defaultTitle;
            localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
            setAllBoardTitles(prevIds => [...prevIds, { id: defaultTitle, title: defaultTitle, isOwner: true }]);
            setActiveBoardId(defaultTitle); setNotes([]);
        } catch (error) { console.error("Error creating local board:", error); }
        return;
    }
    const namePart = generateIrishName(2);
    const numberPart = Math.floor(1000 + Math.random() * 9000);
    const defaultTitle = `${namePart}_${numberPart}`;
    setIsLoading(true);
    console.log("Creating new board in Supabase...");
    try {
      const { data, error } = await supabase.from('boards').insert({ user_id: userId, title: defaultTitle, content: [], shared: false }).select('id, title').single();
      if (error) throw error;
      if (data) {
        console.log("New board created:", data);
        const newBoardInfo = { id: data.id, title: data.title || data.id, isOwner: true };
        setAllBoardTitles(prev => [...prev, newBoardInfo]);
        setActiveBoardId(data.id); setNotes([]);
      } else { console.error("New board created but no data returned."); }
    } catch (error: any) { console.error("Error creating new board:", error.message); }
    finally { setIsLoading(false); }
  }, [userId]);

  const handleBoardSelectChange = useCallback(async (selectedBoardId: string) => {
    if (!selectedBoardId || selectedBoardId === activeBoardId) return;
    console.log("Switching board to:", selectedBoardId);
    setActiveBoardId(selectedBoardId);
    if (userId || sharedBoardId) {
        setIsLoading(true);
        setLoadError(null);
        try {
            const { data, error } = await supabase.from('boards').select('content').eq('id', selectedBoardId).maybeSingle();
            if (error) throw error;
            if (data) {
                const content = data.content;
                if (Array.isArray(content)) {
                    const loadedNotes = content.map((note: any) => ({ ...note, nextActions: note.nextActions || [] }));
                    setNotes(loadedNotes);
                    console.log("Switched to board:", selectedBoardId);
                } else { console.warn(`Board ${selectedBoardId} content is not an array:`, content); setNotes([]); }
            } else { console.error(`Board ${selectedBoardId} not found or access denied.`); setActiveBoardId(activeBoardId); setLoadError("Selected board not found or access denied."); }
        } catch (error: any) { console.error("Error fetching selected board:", error.message); setActiveBoardId(activeBoardId); setLoadError(`Failed to load selected board: ${error.message}`); }
        finally { setIsLoading(false); }
    } else {
        try {
            const savedDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
            if (savedDataString) {
                const data: LocalBoardsData = JSON.parse(savedDataString);
                if (data.boards && data.boards[selectedBoardId]) {
                    const activeNotes = (data.boards[selectedBoardId] || []).map(note => ({ ...note, nextActions: note.nextActions || [] }));
                    setNotes(activeNotes);
                    console.log("Switched to local board:", selectedBoardId);
                    data.activeBoardId = selectedBoardId;
                    localStorage.setItem(LOCAL_BOARDS_DATA_KEY, JSON.stringify(data));
                } else { console.error(`Local board ${selectedBoardId} not found.`); setActiveBoardId(activeBoardId); }
            }
        } catch (error) { console.error("Failed parse on local select:", error); setActiveBoardId(activeBoardId); }
    }
  }, [activeBoardId, userId, sharedBoardId, allBoardTitles]);

  const handleShareClick = async () => {
      if (!userId || !activeBoardId) { setShareError("Please log in and select a board you own to share."); setShowShareModal(true); return; }
      setShareError(null);
      const boardMeta = allBoardTitles.find(b => b.id === activeBoardId);
      if (!boardMeta?.isOwner) { setShareError("Only the board owner can enable sharing."); setShowShareModal(true); return; }
      console.log(`Sharing board: ${activeBoardId}`);
      try {
          const { error: updateError } = await supabase.from('boards').update({ shared: true }).eq('id', activeBoardId).eq('user_id', userId);
          if (updateError) throw updateError;
          console.log(`Board ${activeBoardId} marked as shared.`);
          setShowShareModal(true);
      } catch (error: any) { console.error("Error marking board as shared:", error.message); setShareError(`Failed to enable sharing: ${error.message}`); setShowShareModal(true); }
  };

  // --- Render Logic ---
  const noteContainerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px', minHeight: '150px', width: '100%', alignItems: 'flex-start', justifyContent: 'center', height: '100%' };
  const currentEditingNote = notes.find(note => note.id === editingNoteId) || null;
  const onResize = (_event: React.SyntheticEvent, data: ResizeCallbackData) => { setSummaryWidth(data.size.width); };
  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { handleAddNote(); } };

  if (isLoading) { return <div className="flex justify-center items-center h-screen">Loading...</div>; }
  if (loadError) { return <div className="flex flex-col justify-center items-center h-screen text-red-600"> <p>Error loading board:</p> <p className="mt-2 text-sm">{loadError}</p> </div>; }

  const isCurrentUserOwner = !!userId && !!activeBoardId && !!allBoardTitles.find(b => b.id === activeBoardId && b.isOwner);

  return (
    <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
         {!sharedBoardId && (
             <div className="flex items-center space-x-2">
                <label htmlFor="board-select-revert" className="text-sm font-medium text-gray-700">Board:</label>
                <select id="board-select-revert" value={activeBoardId || ''} onChange={(e) => handleBoardSelectChange(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" disabled={isLoading}>
                  {allBoardTitles.map(board => ( <option key={board.id} value={board.id}> {board.title}{!board.isOwner ? ' (Shared)' : ''} </option> ))}
                </select>
                <button onClick={handleNewBoard} className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={isLoading || !userId} > New Board </button>
             </div>
         )}
         {sharedBoardId && activeBoardId && ( <div className="text-lg font-medium text-gray-800"> Viewing Board: {allBoardTitles.find(b => b.id === activeBoardId)?.title || activeBoardId} </div> )}
         <div className="flex items-center space-x-2">
            <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyPress={handleInputKeyPress} placeholder="Enter new idea..." className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading || !activeBoardId} />
            <button onClick={handleAddNote} className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50" disabled={isLoading || !activeBoardId || noteInput.trim() === ''} > Add </button>
         </div>
         <div>
             <button onClick={handleShareClick} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={isLoading || !activeBoardId || !isCurrentUserOwner} title={!isCurrentUserOwner && activeBoardId ? "Only the board owner can share" : "Share this board"} > Share </button>
         </div>
      </div>
      {/* Main Content Area */}
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'stretch', overflow: 'hidden', gap: '20px' }}>
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'stretch', gap: '20px', overflowY: 'auto', padding: '10px', border: '1px solid lightgrey', background: '#f0f0f0' }}>
          <CircleZone zoneId="wwtf" onDropNote={handleMoveNote}> <div style={noteContainerStyle}> {notes.filter(note => note.zone === 'wwtf').map(note => ( <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} /> ))} </div> </CircleZone>
          <CircleZone zoneId="wtf" onDropNote={handleMoveNote}> <div style={noteContainerStyle}> {notes.filter(note => note.zone === 'wtf').map(note => ( <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} /> ))} </div> </CircleZone>
          <CircleZone zoneId="clarity" onDropNote={handleMoveNote}> <div style={noteContainerStyle}> {notes.filter(note => note.zone === 'clarity').map(note => ( <StickyNote key={note.id} id={note.id} text={note.text} zone={note.zone} onDoubleClick={handleNoteDoubleClick} hasNextActions={note.nextActions && note.nextActions.length > 0} /> ))} </div> </CircleZone>
        </div>
        <ResizableBox width={summaryWidth} height={Infinity} axis="x" resizeHandles={['w']} handle={<span className="custom-resize-handle" />} minConstraints={[150, Infinity]} maxConstraints={[600, Infinity]} onResize={onResize} style={{ overflow: 'hidden', display: 'flex', position: 'relative', background: 'white' }}>
          <div style={{ width: '100%', height: '100%', overflowY: 'auto', borderLeft: '1px solid #ccc', paddingLeft: '15px', marginLeft: '5px' }}> <ZoneSummaryList notes={notes} onToggleAction={handleToggleAction} /> </div>
        </ResizableBox>
      </div>
      <NextActionsModal note={currentEditingNote} onClose={handleCloseModal} onAddAction={handleAddAction} onToggleAction={handleToggleAction} />
      <ShareModal isOpen={showShareModal} onClose={handleCloseShareModal} boardId={activeBoardId} />
    </div>
  );
};

export default WhiteboardCanvas;