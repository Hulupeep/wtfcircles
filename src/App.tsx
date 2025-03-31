import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import WhiteboardCanvas from './components/WhiteboardCanvas';
import { supabase, Board as SupabaseBoardData } from './utils/supabaseClient'; // Import supabase client and type
import { Session, User } from '@supabase/supabase-js'; // Import Session type
import './index.css'; // Import global styles

// Type for data stored in local storage
interface LocalBoardsData {
    activeBoardId: string | null;
    boards: { [boardId: string]: any[] }; // Using any[] for notes temporarily
}
const LOCAL_BOARDS_DATA_KEY = 'wtfBoardsData'; // Key for local storage

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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null); // Store user separately
  const [loading, setLoading] = useState(true); // Loading initial session/data
  const [authLoading, setAuthLoading] = useState(false); // Specific loading for auth actions
  const [error, setError] = useState<string | null>(null);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveLocalBoardsOnSignup, setSaveLocalBoardsOnSignup] = useState(true); // State for checkbox

  // Migration State
  const [migrationLoading, setMigrationLoading] = useState(false);

  // Fetch session on mount and listen for auth changes
  useEffect(() => {
    setLoading(true);
    // Check initial session state
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        const initialUser = session?.user ?? null;
        setUser(initialUser);
        console.log("Initial session check:", session);

        // Trigger auto-merge check if logged in initially and local data exists
        if (initialUser) {
            checkAndPrepareMerge(initialUser);
        }

        setLoading(false);
    }).catch(err => {
        console.error("Error getting initial session:", err);
        setError("Could not retrieve session information.");
        setLoading(false);
    });

    // Listener for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed:", _event, session);
        const currentUser = session?.user ?? null;
        const previousUser = user; // Capture previous user state before updating

        setSession(session);
        setUser(currentUser);
        setError(null); // Clear errors on auth change

        // --- Auto-Merge Logic on Login ---
        if (!previousUser && currentUser) {
            checkAndPrepareMerge(currentUser);
        }
        // --- End Auto-Merge Logic ---

        // Close auth modal on successful login/signup
        if (currentUser) {
            setShowAuthModal(false);
            // Clear form fields after successful auth
            setEmail('');
            setPassword('');
        }
    });

    // Cleanup listener on unmount
    return () => subscription.unsubscribe();
  }, []); // Run only once on mount

  // Helper function to check local storage and trigger merge if needed
  const checkAndPrepareMerge = (loggedInUser: User) => {
      console.log("User logged in, checking for local data...");
      const localDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
      if (localDataString) {
          try {
              const localData: LocalBoardsData = JSON.parse(localDataString);
              if (localData.boards && Object.keys(localData.boards).length > 0) {
                  console.log("Local data found, initiating auto-merge:", localData);
                  handleMergeData(localData, loggedInUser);
              } else {
                  console.log("Local data key found, but no boards to migrate.");
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


  // --- Auth Handlers ---
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); // Still prevent default if called via form submit somehow
    setError(null);
    setAuthLoading(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      // Session/User state updated by listener
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault(); // Still prevent default
    setError(null);
    setAuthLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      alert('Signup successful! Please check your email to verify your account if required.');

      const newUser = signUpData.user;
      if (saveLocalBoardsOnSignup && newUser) {
          console.log("Signup successful with user session, checking local data for immediate merge...");
          const localDataString = localStorage.getItem(LOCAL_BOARDS_DATA_KEY);
          if (localDataString) {
              try {
                  const localData: LocalBoardsData = JSON.parse(localDataString);
                  if (localData.boards && Object.keys(localData.boards).length > 0) {
                      console.log("Local data found, initiating merge after signup:", localData);
                      await handleMergeData(localData, newUser); // Await merge here
                  } else {
                      localStorage.removeItem(LOCAL_BOARDS_DATA_KEY);
                  }
              } catch (e) {
                  console.error("Failed to parse local data for signup merge:", e);
                  localStorage.removeItem(LOCAL_BOARDS_DATA_KEY);
              }
          }
      } else if (saveLocalBoardsOnSignup && !newUser) {
          console.log("Signup successful, but user needs verification. Merge will happen on first login.");
      } else if (!saveLocalBoardsOnSignup) {
          console.log("Signup successful, user opted out of saving local boards. Clearing local data.");
          localStorage.removeItem(LOCAL_BOARDS_DATA_KEY);
      }
      // Modal closing is handled by listener if user becomes non-null
      // If verification needed, modal stays open until closed manually or user logs in later

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
        console.log("Fetching existing board titles...");
        const { data: existingBoards, error: fetchError } = await supabase
            .from('boards')
            .select('title')
            .eq('user_id', currentLoggedInUser.id);

        if (fetchError) throw fetchError;

        const existingTitles = new Set(existingBoards?.map(b => b.title) || []);
        console.log("Existing titles:", existingTitles);

        const boardsToInsert = Object.entries(localData.boards)
            .filter(([localId, _notes]) => !existingTitles.has(localId))
            .map(([localId, notes]) => ({
                user_id: currentLoggedInUser.id,
                title: localId,
                content: notes
            }));

        if (boardsToInsert.length > 0) {
            console.log("Boards to insert after filtering:", boardsToInsert);
            const { error: insertError } = await supabase
                .from('boards')
                .insert(boardsToInsert);
            if (insertError) throw insertError;
            console.log(`${boardsToInsert.length} new boards merged successfully.`);
        } else {
            console.log("No new boards to merge after checking duplicates.");
        }

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
                closeModal={() => {
                    setShowAuthModal(false);
                    setError(null); // Clear errors on manual close
                }}
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
               {/* Show Sign in/Up link only if NOT logged in */}
               {!user && (
                  <button
                      onClick={() => {
                          setError(null); // Clear previous errors when opening modal
                          setShowAuthModal(true);
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                      Save your boards: Sign in/Up
                  </button>
               )}
               {user && (
                 <button
                   onClick={handleLogout}
                   disabled={authLoading || migrationLoading} // Disable logout during auth/migration
                   className="py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                 >
                   {authLoading ? '...' : 'Logout'}
                 </button>
               )}
            </div>
          </div>
           {/* Display migration errors below header if not showing modal */}
           {error && error.startsWith('Auto-merge failed:') && !showAuthModal && (
                <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
           )}
           {migrationLoading && !showAuthModal && (
                <p className="text-blue-500 text-sm mb-2 text-center">Merging local boards...</p>
           )}
          {/* Pass user ID. WhiteboardCanvas determines its own offline status */}
          <WhiteboardCanvas userId={user?.id} isOffline={!user} />
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
