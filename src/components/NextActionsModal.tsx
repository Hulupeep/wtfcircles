import React, { useState, useEffect } from 'react';

interface Action {
  id: string;
  text: string;
  completed: boolean;
}

interface NoteData {
  id: string;
  text: string;
  nextActions: Action[];
}

interface NextActionsModalProps {
  note: NoteData | null; // The note being edited, or null if modal is closed
  onClose: () => void;
  onAddAction: (noteId: string, actionText: string) => void;
  onToggleAction: (noteId: string, actionId: string) => void;
}

const NextActionsModal: React.FC<NextActionsModalProps> = ({
  note,
  onClose,
  onAddAction,
  onToggleAction,
}) => {
  const [newActionText, setNewActionText] = useState('');

  useEffect(() => {
    // Reset input when the note changes (modal opens for a different note)
    setNewActionText('');
  }, [note]);

  if (!note) {
    return null; // Don't render anything if no note is selected
  }

  const handleAddClick = () => {
    if (newActionText.trim() === '') return;
    onAddAction(note.id, newActionText);
    setNewActionText(''); // Clear input after adding
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAddClick();
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>
          &times;
        </button>
        <h3>Next Actions for: "{note.text}"</h3>
        <p style={styles.prompt}>What is the very next action to help understand this?</p>

        {/* Action List */}
        <ul style={styles.actionList}>
          {note.nextActions.map((action) => (
            <li key={action.id} style={styles.actionItem}>
              <input
                type="checkbox"
                checked={action.completed}
                onChange={() => onToggleAction(note.id, action.id)}
                style={styles.checkbox}
              />
              <span style={action.completed ? styles.completedText : {}}>
                {action.text}
              </span>
            </li>
          ))}
        </ul>

        {/* Add New Action Input */}
        <div style={styles.addActionContainer}>
          <input
            type="text"
            value={newActionText}
            onChange={(e) => setNewActionText(e.target.value)}
            onKeyPress={handleKeyPress} // Add action on Enter key
            placeholder="Add next action..."
            style={styles.input}
          />
          <button onClick={handleAddClick} style={styles.addButton}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// Basic inline styles for the modal
const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensure it's above other content
  },
  modal: {
    backgroundColor: '#fff',
    padding: '20px 30px',
    borderRadius: '8px',
    minWidth: '300px',
    maxWidth: '500px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#888',
  },
  prompt: {
    fontStyle: 'italic',
    color: '#555',
    marginBottom: '15px',
  },
  actionList: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '20px',
    maxHeight: '200px', // Limit height and allow scrolling if needed
    overflowY: 'auto',
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  checkbox: {
    marginRight: '10px',
    cursor: 'pointer',
  },
  completedText: {
    textDecoration: 'line-through',
    color: '#aaa',
  },
  addActionContainer: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flexGrow: 1,
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  addButton: {
    padding: '8px 15px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default NextActionsModal;