import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import WhiteboardCanvas from './components/WhiteboardCanvas';
import './index.css'; // Import global styles

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      {/* Revert to simpler structure */}
      <div className="App">
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>WTF Circles Whiteboard</h1>
        <WhiteboardCanvas />
      </div>
    </DndProvider>
  );
}

export default App;
