import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Target, FileText, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { GEOFanoutAnalysis, FanoutQuery, AttributionAnalysis } from '../types';

interface GEOFanoutDensityProps {
  analysis?: GEOFanoutAnalysis;
  showDetails?: boolean;
}

export function GEOFanoutDensity({ analysis, showDetails = false }: GEOFanoutDensityProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [expandedQuery, setExpandedQuery] = useState<number | null>(null);

  if (!analysis || !analysis.success) {
    return null;
  }

  const { summary, densityMetrics, fanoutQueries, attributionAnalysis } = analysis;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very_high': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttributionIcon = (isFromContent: boolean) => {
    return isFromContent ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getAttributionStatus = (isFromContent: boolean) => {
    return isFromContent ? 'FROM CONTENT' : 'EXTERNAL';
  };

  const getAttributionColor = (isFromContent: boolean) => {
    return isFromContent ? 'text-green-700' : 'text-red-700';
  };

  return (
    <div className="mt-4 border border-gray-200 rounded-lg bg-white">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">GEO Fanout Density Analysis</h4>
            <p className="text-sm text-gray-600">
              {summary.totalFanoutQueries} sub-queries • {summary.contentAttributedAnswers} from content • {summary.externalAnswers} external
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              summary.fanoutDensity > 0.8 ? 'bg-green-100 text-green-800' :
              summary.fanoutDensity > 0.6 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {(summary.fanoutDensity * 100).toFixed(1)}% Density
            </div>
            {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summary.totalFanoutQueries}</div>
              <div className="text-sm text-gray-600">Total Sub-Queries</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.contentAttributedAnswers}</div>
              <div className="text-sm text-gray-600">From Content</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.externalAnswers}</div>
              <div className="text-sm text-gray-600">External</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{(summary.averageAttributionScore * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Avg Attribution</div>
            </div>
          </div>

          {/* Quality Distribution */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Quality Distribution
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(densityMetrics.qualityDistribution).map(([quality, count]) => (
                <div key={quality} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm font-medium capitalize">{quality.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fanout Queries and Attribution */}
          <div className="space-y-3">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Fanout Queries & Attribution Analysis
            </h5>
            
            {fanoutQueries.map((query, index) => {
              const attribution = attributionAnalysis[index];
              return (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedQuery(expandedQuery === index ? null : index)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getAttributionIcon(attribution?.isFromContent || false)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800">{query.query}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(query.priority)}`}>
                            {query.priority}
                          </span>
                          <span className="text-xs text-gray-500">({query.aspect})</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`font-medium ${getAttributionColor(attribution?.isFromContent || false)}`}>
                            {getAttributionStatus(attribution?.isFromContent || false)}
                          </span>
                          {attribution && (
                            <>
                              <span className="text-gray-600">
                                {(attribution.attributionScore * 100).toFixed(1)}% similarity
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getConfidenceColor(attribution.confidence)}`}>
                                {attribution.confidence.replace('_', ' ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedQuery === index ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </div>
                  
                  {expandedQuery === index && attribution && (
                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Reasoning:</span>
                          <span className="text-gray-600 ml-2">{attribution.reasoning}</span>
                        </div>
                        
                        {attribution.contentSnippets.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Supporting Content Snippets:</div>
                            <div className="space-y-2">
                              {attribution.contentSnippets.map((snippet, snippetIndex) => (
                                <div key={snippetIndex} className="text-sm bg-white p-2 rounded border">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-600">
                                      Snippet {snippetIndex + 1}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {(snippet.similarity * 100).toFixed(1)}% match
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-xs leading-relaxed">
                                    "{snippet.text.substring(0, 200)}..."
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aspect Coverage Analysis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-semibold text-gray-800 mb-3">Aspect Coverage Analysis</h5>
            <div className="space-y-2">
              {Object.entries(densityMetrics.aspectCoverage).map(([aspect, coverage]) => {
                const coverageRatio = coverage.total > 0 ? coverage.fromContent / coverage.total : 0;
                return (
                  <div key={aspect} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium capitalize">{aspect.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {coverage.fromContent}/{coverage.total}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        coverageRatio > 0.8 ? 'bg-green-100 text-green-800' :
                        coverageRatio > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(coverageRatio * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights */}
          {summary.fanoutDensity < 0.5 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h6 className="font-semibold text-yellow-800">Low Fanout Density Detected</h6>
                  <p className="text-sm text-yellow-700 mt-1">
                    Many answers are coming from external knowledge rather than your content. 
                    Consider expanding your content to cover more aspects of this topic.
                  </p>
                </div>
              </div>
            </div>
          )}

          {summary.fanoutDensity > 0.9 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h6 className="font-semibold text-green-800">Excellent Fanout Density</h6>
                  <p className="text-sm text-green-700 mt-1">
                    Most answers are derived from your content. Your content provides comprehensive coverage for this topic.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 