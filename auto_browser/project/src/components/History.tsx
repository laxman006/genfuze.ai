import React from 'react';
import { History as HistoryIcon, Download, Filter, Search } from 'lucide-react';
import { QAItem } from '../types';

interface HistoryProps {
  qaItems: QAItem[];
  onExport: (content: string, filename: string, mimeType: string) => void;
}

export function History({ qaItems, onExport }: HistoryProps) {
  const handleExport = () => {
    const csvContent = qaItems.map((item, index) => 
      `${index + 1},"${item.question}","${item.answer}","${item.accuracy}","${item.sentiment}",${item.inputTokens},${item.outputTokens},${item.totalTokens}`
    ).join('\n');
    
    const header = 'ID,Question,Answer,Accuracy,Sentiment,Input Tokens,Output Tokens,Total Tokens\n';
    onExport(header + csvContent, 'qa-history.csv', 'text/csv');
  };

  return (
    <div className="card backdrop-blur-md bg-black/80 border border-genfuze-green/60 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HistoryIcon className="w-7 h-7 text-genfuze-green" />
          <h2 className="text-2xl font-bold text-genfuze-green">Q&A History</h2>
        </div>
        
        <button
          onClick={handleExport}
          disabled={qaItems.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-genfuze-green hover:bg-green-400 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {qaItems.length === 0 ? (
        <div className="text-center py-12">
          <HistoryIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Q&A History</h3>
          <p className="text-gray-500">Generate some questions and answers to see them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {qaItems.map((item, index) => (
            <div key={index} className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Q{index + 1}: {item.question}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.accuracy === 'High' ? 'bg-green-900/50 text-green-300' :
                    item.accuracy === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                    'bg-red-900/50 text-red-300'
                  }`}>
                    {item.accuracy}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.sentiment === 'Positive' ? 'bg-green-900/50 text-green-300' :
                    item.sentiment === 'Negative' ? 'bg-red-900/50 text-red-300' :
                    'bg-gray-900/50 text-gray-300'
                  }`}>
                    {item.sentiment}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                <p className="text-gray-300 leading-relaxed">{item.answer}</p>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <span>Input: {item.inputTokens} tokens</span>
                  <span>Output: {item.outputTokens} tokens</span>
                  <span>Total: {item.totalTokens} tokens</span>
                </div>
                {item.cost && (
                  <span className="text-genfuze-green font-medium">
                    Cost: ${item.cost.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 