import React from 'react';
import { Database, Save, Trash2, Download, RefreshCcw } from 'lucide-react';

interface SessionManagementProps {
  sessionName: string;
  setSessionName: (name: string) => void;
  savedSessions: Array<{ id: string; name: string; timestamp: string }>;
  onLoadSession: (sessionId: string) => void;
  onSaveSession: () => void;
  onDeleteSession: () => void;
  onClearAllSessions: () => void;
  onExportAllSessions: () => void;
  statusMessage: string;
  statusType: 'info' | 'success' | 'error';
  selectedSessionId: string;
  setSelectedSessionId: (id: string) => void;
}

export function SessionManagement({
  sessionName,
  setSessionName,
  savedSessions,
  onLoadSession,
  onSaveSession,
  onDeleteSession,
  onClearAllSessions,
  onExportAllSessions,
  statusMessage,
  statusType,
  selectedSessionId,
  setSelectedSessionId
}: SessionManagementProps) {
  const getStatusBgColor = () => {
    switch (statusType) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
          <Database className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Session Management</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Name:
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Enter session name (e.g., 'Blog Analysis 1')"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Load Previous Session:
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => {
              setSelectedSessionId(e.target.value);
              if (e.target.value) {
                onLoadSession(e.target.value);
              }
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Select a session to load...</option>
            {savedSessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.name} ({new Date(session.timestamp).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={onSaveSession}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Current Session
        </button>
        
        <button
          onClick={onDeleteSession}
          disabled={!selectedSessionId}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Selected Session
        </button>
        
        <button
          onClick={onClearAllSessions}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Clear All Sessions
        </button>
        
        <button
          onClick={onExportAllSessions}
          disabled={savedSessions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export All Sessions
        </button>
      </div>
      
      {statusMessage && (
        <div className={`p-4 rounded-lg border ${getStatusBgColor()}`}>
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}
    </div>
  );
}