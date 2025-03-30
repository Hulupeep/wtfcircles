import React, { useState } from 'react';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa'; // Icons for dropdown

// Re-use types from WhiteboardCanvas if possible, or redefine here
interface Action {
  id: string;
  text: string;
  completed: boolean;
}
interface NoteSummary {
  id: string;
  text: string;
  zone: 'wwtf' | 'wtf' | 'clarity';
  nextActions: Action[];
}

interface ZoneSummaryListProps {
  notes: NoteSummary[];
  onToggleAction: (noteId: string, actionId: string) => void; // To toggle from the list
}

const ZoneSummaryItem: React.FC<{ note: NoteSummary; onToggleAction: (noteId: string, actionId: string) => void }> = ({ note, onToggleAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActions = note.nextActions && note.nextActions.length > 0;

  return (
    <div style={styles.itemContainer}>
      <div style={styles.itemHeader} onClick={() => hasActions && setIsExpanded(!isExpanded)}>
        <span>{note.text}</span>
        {hasActions && (
          <span style={styles.expandIcon}>
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
          </span>
        )}
      </div>
      {isExpanded && hasActions && (
        <ul style={styles.actionList}>
          {note.nextActions.map(action => (
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
      )}
    </div>
  );
};


const ZoneSummaryList: React.FC<ZoneSummaryListProps> = ({ notes, onToggleAction }) => {
  const zones: ('wwtf' | 'wtf' | 'clarity')[] = ['wwtf', 'wtf', 'clarity'];

  return (
    <div style={styles.listContainer}>
      <h2>Summary</h2>
      {zones.map(zoneId => {
        const notesInZone = notes.filter(note => note.zone === zoneId);
        return (
          <div key={zoneId} style={styles.zoneSection}>
            <h4 style={styles.zoneTitle}>{zoneId.toUpperCase()} ({notesInZone.length})</h4>
            {notesInZone.length > 0 ? (
              notesInZone.map(note => (
                <ZoneSummaryItem key={note.id} note={note} onToggleAction={onToggleAction} />
              ))
            ) : (
              <p style={styles.emptyMessage}>No items in this zone.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Basic inline styles for the summary list
const styles: { [key: string]: React.CSSProperties } = {
  listContainer: {
    borderLeft: '1px solid #eee',
    paddingLeft: '20px',
    marginLeft: '20px',
    minWidth: '250px', // Give it some width
    maxWidth: '350px',
  },
  zoneSection: {
    marginBottom: '20px',
  },
  zoneTitle: {
    borderBottom: '1px solid #eee',
    paddingBottom: '5px',
    marginBottom: '10px',
    color: '#333',
  },
  itemContainer: {
    border: '1px solid #f0f0f0',
    borderRadius: '4px',
    marginBottom: '8px',
    backgroundColor: '#fff',
  },
  itemHeader: {
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    userSelect: 'none', // Prevent text selection on click
  },
  expandIcon: {
    color: '#888',
  },
  actionList: {
    listStyle: 'none',
    padding: '0 12px 12px 30px', // Indent actions
    margin: 0,
    borderTop: '1px solid #f0f0f0',
    backgroundColor: '#fafafa',
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 0',
    fontSize: '0.9em',
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
  },
  completedText: {
    textDecoration: 'line-through',
    color: '#aaa',
  },
  emptyMessage: {
    fontSize: '0.9em',
    color: '#888',
    fontStyle: 'italic',
  }
};


export default ZoneSummaryList;