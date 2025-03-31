import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams } from 'react-router-dom'; // Import useParams
import WhiteboardCanvas from './components/WhiteboardCanvas';
import { supabase } from './utils/supabaseClient';
import { User } from '@supabase/supabase-js';
import './index.css';

// Type for data stored in local storage
interface LocalBoardsData {
    activeBoardId: string | null;
    boards: { [boardId: string]: any[] };
}
const LOCAL_BOARDS_DATA_KEY = 'wtfBoardsData';

// --- AuthModal Component (Moved Outside App) ---
interface AuthModalProps {
    email: string;
    setEmail: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    saveLocalBoardsOnSignup: boolean;
    setSaveLocalBoardsOnSignup: (value: boolean) => void;
    handleLogin: (event: React.FormEvent) => Promise<void>;
    handleSignup: (event: React.FormEvent) => Promise<void>;
    authLoading: boolean;
    error: string | null;
    closeModal: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
    email, setEmail, password, setPassword,
    saveLocalBoardsOnSignup, setSaveLocalBoardsOnSignup,
    handleLogin, handleSignup, authLoading, error, closeModal
}) => {
    // ... (AuthModal implementation remains the same) ...
     return (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
             <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto relative w-full sm:w-auto">
                 {/* Close button */}
                 <button
                     onClick={closeModal}
                     className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
                     aria-label="Close"
                 >
                     &times; {/* HTML entity for X */}
                 </button>

                 <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login / Sign Up</h2>

                 {/* Combined Form */}
                 <form onSubmit={(e) => e.preventDefault()} className="space-y-4"> {/* Prevent default submit */}
                     {/* Email Input */}
                     <div>
                         <label className="block text-sm font-medium text-gray-700">Email:</label>
                         <input
                             type="email"
                             value={email}
                             onChange={(e) => setEmail(e.target.value)}
                             required
                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                             placeholder="your@email.com"
                         />
                     </div>
                     {/* Password Input */}
                     <div>
                         <label className="block text-sm font-medium text-gray-700">Password:</label>
                         <input
                             type="password"
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             required
                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                             placeholder="Enter password"
                         />
                     </div>

                     {/* Signup Checkbox */}
                     <div className="flex items-center pt-2">
                         <input
                             id="save-local-boards"
                             name="save-local-boards"
                             type="checkbox"
                             checked={saveLocalBoardsOnSignup}
                             onChange={(e) => setSaveLocalBoardsOnSignup(e.target.checked)}
                             className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                         />
                         <label htmlFor="save-local-boards" className="ml-2 block text-sm text-gray-900">
                             Save existing local boards on Sign Up
                         </label>
                     </div>

                     {/* Error Display */}
                     {error && <p className="text-red-500 text-sm text-center pt-1">{error}</p>}

                     {/* Action Buttons */}
                     <div className="flex space-x-4 pt-4">
                         <button
                             type="button" // Changed from submit
                             onClick={handleLogin}
                             disabled={authLoading}
                             className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                         >
                             {authLoading ? '...' : 'Login'}
                         </button>
                         <button
                             type="button" // Changed from submit
                             onClick={handleSignup}
                             disabled={authLoading}
                             className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                         >
                             {authLoading ? '...' : 'Sign Up'}
                         </button>
                     </div>
                 </form>
             </div>
         </div>
     );
};


// --- App Component ---
function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveLocalBoardsOnSignup, setSaveLocalBoardsOnSignup] = useState(true);

  // Migration State
  const [migrationLoading, setMigrationLoading] = useState(false);

  // Get boardId from URL params if present
  const { boardId: sharedBoardIdFromUrl } = useParams<{ boardId?: string }>();

  // Fetch session on mount and listen for auth changes
  useEffect(() => {
    setLoading(true);
    console.log("Running initial session check..."); // Added log
    supabase.auth.getSession().then(({ data: { session } }) => {
        const initialUser = session?.user ?? null;
        setUser(initialUser); // Set user state based ONLY on getSession result
        console.log("Initial session check complete. Session:", session);
        console.log("Initial user state set to:", initialUser); // Added log
        if (initialUser && !sharedBoardIdFromUrl) {
            checkAndPrepareMerge(initialUser);
        }
        setLoading(false);
    }).catch(err => {
        console.error("Error getting initial session:", err);
        setError("Could not retrieve session information.");
        setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed:", _event, session);
        const currentUser = session?.user ?? null;
        const previousUser = user;

        setUser(currentUser);
        setError(null);

        // --- Auto-Merge Logic on Login ---
        if (!previousUser && currentUser) {
            // Check if we are on a shared board URL
            if (sharedBoardIdFromUrl) {
                // Add entry to shared_boards table
                addSharedBoardEntry(currentUser, sharedBoardIdFromUrl);
            } else {
                // Not on a shared board URL, check for local data to merge
                checkAndPrepareMerge(currentUser);
            }
        }
        // --- End Auto-Merge Logic ---

        if (currentUser) {
            setShowAuthModal(false);
            setEmail('');
            setPassword('');
        }
    });

    return () => subscription.unsubscribe();
  }, [sharedBoardIdFromUrl]); // Re-run if the sharedBoardIdFromUrl changes (though unlikely in App)

  // Helper function to check local storage and trigger merge if needed
  const checkAndPrepareMerge = (loggedInUser: User) => {
      console.log("User logged in (not on shared URL), checking for local data...");
      const localDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
      if (localDataString) {
          try {
              const localData: LocalBoardsData = JSON.parse(localDataString);
              if (localData.boards && Object.keys(localData.boards).length > 0) {
                  console.log("Local data found, initiating auto-merge:", localData);
                  handleMergeData(localData, loggedInUser);
              } else {
                  localStorage.removeItem(LOCAL_BOARDS_DATA_KEY);
              }
          } catch (e) {
              console.error("Failed to parse local data for migration check:", e);
              localStorage.removeItem(LOCAL_BOARDS_DATA_KEY);
          }
      } else {
           console.log("No local data found to migrate.");
      }
  };

  // Function to add entry to shared_boards table
  const addSharedBoardEntry = async (currentUser: User, boardId: string) => {
      console.log(`User logged in on shared board ${boardId}. Adding to shared_boards...`);
      try {
          // Check if entry already exists first (optional, constraint handles it too)
          const { data: existing, error: checkError } = await supabase
              .from('shared_boards')
              .select('id')
              .eq('user_id', currentUser.id)
              .eq('board_id', boardId)
              .maybeSingle(); // Use maybeSingle to not error if no row found

          if (checkError) {
              console.error("Error checking existing shared_boards entry:", checkError);
              // Decide how to handle - maybe proceed with insert anyway?
          }

          if (!existing) {
              const { error: insertError } = await supabase
                  .from('shared_boards')
                  .insert({ user_id: currentUser.id, board_id: boardId, role: 'editor' }); // Default role

              if (insertError) {
                  // Handle potential errors like RLS violation or constraint violation
                  console.error("Error inserting into shared_boards:", insertError);
                  setError(`Failed to add shared board access: ${insertError.message}`);
              } else {
                  console.log(`Successfully added user ${currentUser.id} access to board ${boardId}`);
                  // Optionally clear local storage if desired after associating shared board
                  // localStorage.removeItem(LOCAL_BOARDS_DATA_KEY);
              }
          } else {
              console.log("User already has access entry for this shared board.");
          }
      } catch (error: any) {
          console.error("Failed to add shared board entry:", error);
          setError(`Failed to process shared board access: ${error.message}`);
      }
  };


  // --- Auth Handlers ---
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setAuthLoading(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      // Listener handles state update and merge/share logic
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setAuthLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      alert('Signup successful! Please check your email to verify your account if required.');

      const newUser = signUpData.user;
      // If signup auto-logs in AND checkbox is checked AND we are NOT on a shared board URL
      if (saveLocalBoardsOnSignup && newUser && !sharedBoardIdFromUrl) {
          console.log("Signup successful with user session, checking local data for immediate merge...");
          const localDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
          if (localDataString) {
              try {
                  const localData: LocalBoardsData = JSON.parse(localDataString);
                  if (localData.boards && Object.keys(localData.boards).length > 0) {
                      await handleMergeData(localData, newUser);
                  } else { localStorage.removeItem(LOCAL_BOARDS_DATA_KEY); }
              } catch (e) { console.error("Failed to parse local data for signup merge:", e); localStorage.removeItem(LOCAL_BOARDS_DATA_KEY); }
          }
      } else if (saveLocalBoardsOnSignup && newUser && sharedBoardIdFromUrl) {
          // If signup auto-logs in AND checkbox checked AND on shared URL, add shared entry
          console.log("Signup successful with user session on shared board, adding shared entry...");
          await addSharedBoardEntry(newUser, sharedBoardIdFromUrl);
      } else if (saveLocalBoardsOnSignup && !newUser) {
          console.log("Signup successful, but user needs verification. Merge/Share will happen on first login.");
      } else if (!saveLocalBoardsOnSignup) {
          console.log("Signup successful, user opted out of saving local boards. Clearing local data.");
          localStorage.removeItem(LOCAL_BOARDS_DATA_KEY);
      }
      // Listener handles modal closing if user becomes non-null

    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setAuthLoading(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // --- Migration Handler (Revised for Auto-Merge & Dupe Check) ---
  const handleMergeData = useCallback(async (localData: LocalBoardsData, currentLoggedInUser: User) => {
    if (!localData || !currentLoggedInUser) return;
    setMigrationLoading(true);
    setError(null);
    console.log("Starting auto-merge process...");
    try {
        // 1. Fetch existing OWNED board titles for the current user to check for duplicates
        // Explicitly query for user_id here to avoid triggering complex RLS involving shared_boards during merge check.
        console.log("Fetching existing OWNED board titles for duplicate check...");
        const { data: existingBoards, error: fetchError } = await supabase
            .from('boards')
            .select('title')
            .eq('user_id', currentLoggedInUser.id); // Explicitly check ownership for this query
        if (fetchError) {
             console.error("Error fetching existing owned boards for merge check:", fetchError);
             throw fetchError; // Re-throw to be caught by outer catch
        }
        const existingTitles = new Set(existingBoards?.map(b => b.title) || []);
        console.log("Existing titles:", existingTitles);
        const boardsToInsert = Object.entries(localData.boards)
            .filter(([localId, _notes]) => !existingTitles.has(localId))
            .map(([localId, notes]) => ({ user_id: currentLoggedInUser.id, title: localId, content: notes }));
        if (boardsToInsert.length > 0) {
            console.log("Boards to insert after filtering:", boardsToInsert);
            const { error: insertError } = await supabase.from('boards').insert(boardsToInsert);
            if (insertError) throw insertError;
            console.log(`${boardsToInsert.length} new boards merged successfully.`);
        } else { console.log("No new boards to merge after checking duplicates."); }
        console.log("Clearing local data after merge attempt.");
        localStorage.removeItem(LOCAL_BOARDS_DATA_KEY);
    } catch (error: any) {
        console.error("Auto-merge failed:", error);
        setError(`Auto-merge failed: ${error.message}. Local data remains.`);
    } finally {
        setMigrationLoading(false);
    }
  }, []);


  // --- Render Logic ---
  if (loading) {
      return <div className="flex justify-center items-center h-screen">Initializing...</div>;
  }

  return (
    // Need DndProvider here as it was removed from main.tsx
    <DndProvider backend={HTML5Backend}>
      <div className="App p-4 min-h-screen bg-gray-100">

        {/* Conditionally render Auth Modal */}
        {showAuthModal && (
            <AuthModal
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                saveLocalBoardsOnSignup={saveLocalBoardsOnSignup}
                setSaveLocalBoardsOnSignup={setSaveLocalBoardsOnSignup}
                handleLogin={handleLogin}
                handleSignup={handleSignup}
                authLoading={authLoading}
                error={error}
                closeModal={() => { setShowAuthModal(false); setError(null); }}
            />
        )}

        {/* Always render Whiteboard container */}
        <div>
          <div className="flex justify-between items-center mb-4 px-2 py-1 bg-white shadow rounded">
            {/* Title and Subtitle */}
            <div className="flex items-baseline space-x-2">
               <h1 className="text-xl font-semibold text-gray-800">WTF Circles</h1>
               <span className="text-sm text-gray-500 italic">Clarity for when you're clueless</span>
            </div>
            {/* Auth Controls Area */}
            <div className="flex items-center space-x-3">
               {user && <span className="text-sm text-gray-600 hidden sm:inline">Logged in as: {user.email}</span>}
               {!user && (
                  <button
                      onClick={() => { setError(null); setShowAuthModal(true); }}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                      Save your boards: Sign in/Up
                  </button>
               )}
               {user && (
                 <button
                   onClick={handleLogout}
                   disabled={authLoading || migrationLoading}
                   className="py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                 >
                   {authLoading ? '...' : 'Logout'}
                 </button>
               )}
            </div>
          </div>
           {error && error.startsWith('Auto-merge failed:') && !showAuthModal && (
                <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
           )}
           {migrationLoading && !showAuthModal && (
                <p className="text-blue-500 text-sm mb-2 text-center">Merging local boards...</p>
           )}
          {/* Pass user ID AND sharedBoardIdFromUrl */}
          <WhiteboardCanvas userId={user?.id} sharedBoardId={sharedBoardIdFromUrl} />
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
