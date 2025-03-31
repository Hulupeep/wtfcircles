import React, { useState } from 'react';

interface ShareModalProps {
  boardId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ boardId, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !boardId) return null;

  // Construct the shareable URL (adjust domain as needed)
  const shareUrl = `${window.location.origin}/board/${boardId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Failed to copy link. Please copy it manually.');
      });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300 ease-out">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto relative w-full sm:w-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Share Board</h3>

        <p className="text-sm text-gray-600 mb-3">Anyone with this link can view and edit this board.</p>

        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50"
            aria-label="Shareable link"
          />
          <button
            onClick={handleCopyLink}
            className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        <div className="text-right mt-5">
           <button
             onClick={onClose}
             className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
           >
             Done
           </button>
         </div>
      </div>
      {/* Add simple fade-in animation */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Add keyframes directly or ensure Tailwind config includes them if using Tailwind animations

export default ShareModal;