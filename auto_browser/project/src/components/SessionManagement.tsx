import React from 'react';
import { Database, Save, Trash2, Download, RefreshCcw, FileText } from 'lucide-react';

export function SessionManagement() {
  return (
    <div className="card max-w-4xl mx-auto backdrop-blur-md bg-black/80 border border-genfuze-green/60 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-7 h-7 text-genfuze-green" />
        <h2 className="text-2xl font-bold text-genfuze-green">Session Management</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Session Name:
          </label>
          <input
            type="text"
            placeholder="Enter session name (e.g., 'Blog Analysis 1')"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-genfuze-green focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Load Previous Session:
          </label>
          <select className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-genfuze-green focus:border-transparent transition-all">
            <option value="">Select a session to load...</option>
            <option value="session1">Blog Analysis 1 (2024-01-15)</option>
            <option value="session2">Content Review 2 (2024-01-14)</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-genfuze-green hover:bg-green-400 text-black font-semibold rounded-lg transition-all">
          <Save className="w-4 h-4" />
          Save Current Session
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
          Delete Selected Session
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all">
          <RefreshCcw className="w-4 h-4" />
          Clear All Sessions
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all">
          <Download className="w-4 h-4" />
          Export All Sessions
        </button>
      </div>
      
      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <span className="font-medium text-blue-300">Session management features allow you to save, load, and manage your Q&A generation sessions.</span>
      </div>
    </div>
  );
}