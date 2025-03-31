import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Import router components
import App from './App.tsx';
import './index.css'; // Ensure global styles are imported
// Removed DndProvider from here, it should wrap specific components or App itself if needed globally

// Use createRoot for React 18+ concurrent features
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    // <React.StrictMode> // Keep commented out for now
      <BrowserRouter>
        <Routes>
          {/* Route for the main app (home) */}
          <Route path="/" element={<App />} />
          {/* Route for accessing a specific shared board */}
          {/* We'll create the SharedBoardPage component next */}
          <Route path="/board/:boardId" element={<App />} />
          {/* Add other routes here if needed, e.g., a dedicated login page */}
        </Routes>
      </BrowserRouter>
    // </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Ensure your index.html has an element with id='root'.");
}
