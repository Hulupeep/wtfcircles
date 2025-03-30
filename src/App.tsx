import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import WhiteboardCanvas from './components/WhiteboardCanvas';
import './index.css'; // Import global styles

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      {/* Use className from index.css for flex layout */}
      <div className="App">
        {/* Header */}
        <h1 style={{ textAlign: 'center', padding: '15px 0', flexShrink: 0 /* Prevent header from shrinking */ }}>WTF Circles Whiteboard</h1>
        {/* Main content area - make WhiteboardCanvas grow */}
        <div style={{ flexGrow: 1, overflow: 'hidden' /* Prevent overflow issues */ }}>
           <WhiteboardCanvas />
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
