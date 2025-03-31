// Removed unused React import
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Ensure global styles are imported
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Use createRoot for React 18+ concurrent features
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    // <React.StrictMode> // Temporarily removed for debugging dnd
      <DndProvider backend={HTML5Backend}>
        <App />
      </DndProvider>
    // </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Ensure your index.html has an element with id='root'.");
}
