import React from 'react';
import { TrendingUp, Target, FileText, BarChart3 } from 'lucide-react';

interface VectorSimilarityProps {
  questionSimilarity?: number;
  answerSimilarity?: number;
  contentSimilarity?: number;
  questionConfidence?: string;
  answerConfidence?: string;
  contentConfidence?: string;
  showDetails?: boolean;
}

export function VectorSimilarity({
  questionSimilarity,
  answerSimilarity,
  contentSimilarity,
  questionConfidence,
  answerConfidence,
  contentConfidence,
  showDetails = false
}: VectorSimilarityProps) {
  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'Very High': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Very Low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSimilarityColor = (similarity?: number) => {
    if (!similarity) return 'bg-gray-100 text-gray-800';
    if (similarity >= 0.9) return 'bg-emerald-100 text-emerald-800';
    if (similarity >= 0.8) return 'bg-green-100 text-green-800';
    if (similarity >= 0.7) return 'bg-blue-100 text-blue-800';
    if (similarity >= 0.6) return 'bg-yellow-100 text-yellow-800';
    if (similarity >= 0.5) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getSimilarityIcon = (similarity?: number) => {
    if (!similarity) return 'text-gray-400';
    if (similarity >= 0.8) return 'text-emerald-500';
    if (similarity >= 0.6) return 'text-blue-500';
    return 'text-orange-500';
  };

  if (!questionSimilarity && !answerSimilarity && !contentSimilarity) {
    return null;
  }

  return (
    <div className="card max-w-xl mx-auto mb-8 backdrop-blur-md bg-black/80 border border-genfuze-green/60 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-6 h-6 text-genfuze-green" />
        <h2 className="text-xl font-bold text-genfuze-green">Vector Similarity</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Question Similarity */}
        {questionSimilarity !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
            <Target className={`w-4 h-4 ${getSimilarityIcon(questionSimilarity)}`} />
            <div className="flex-1">
              <div className="text-xs text-gray-600">Question Similarity</div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSimilarityColor(questionSimilarity)}`}>
                  {(questionSimilarity * 100).toFixed(1)}%
                </span>
                {questionConfidence && (
                  <span className={`px-2 py-1 rounded text-xs border ${getConfidenceColor(questionConfidence)}`}>
                    {questionConfidence}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Answer Similarity */}
        {answerSimilarity !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
            <FileText className={`w-4 h-4 ${getSimilarityIcon(answerSimilarity)}`} />
            <div className="flex-1">
              <div className="text-xs text-gray-600">Answer Similarity</div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSimilarityColor(answerSimilarity)}`}>
                  {(answerSimilarity * 100).toFixed(1)}%
                </span>
                {answerConfidence && (
                  <span className={`px-2 py-1 rounded text-xs border ${getConfidenceColor(answerConfidence)}`}>
                    {answerConfidence}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Similarity */}
        {contentSimilarity !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
            <TrendingUp className={`w-4 h-4 ${getSimilarityIcon(contentSimilarity)}`} />
            <div className="flex-1">
              <div className="text-xs text-gray-600">Content Match</div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSimilarityColor(contentSimilarity)}`}>
                  {(contentSimilarity * 100).toFixed(1)}%
                </span>
                {contentConfidence && (
                  <span className={`px-2 py-1 rounded text-xs border ${getConfidenceColor(contentConfidence)}`}>
                    {contentConfidence}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Explanation */}
      {showDetails && (
        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
          <h6 className="font-medium text-gray-700 mb-2">Similarity Explanation:</h6>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Question Similarity:</strong> How similar this question is to others in your database</div>
            <div><strong>Answer Similarity:</strong> How similar this answer is to other answers for similar questions</div>
            <div><strong>Content Match:</strong> How well this answer matches the original source content</div>
            <div className="mt-2 text-xs">
              <span className="text-emerald-600">🟢 80%+</span> Excellent match | 
              <span className="text-blue-600">🔵 60-79%</span> Good match | 
              <span className="text-orange-600">🟠 Below 60%</span> Needs review
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 