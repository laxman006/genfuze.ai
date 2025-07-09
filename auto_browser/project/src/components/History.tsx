import React, { useState } from 'react';
import { SessionData } from '../types';
import { Filter, Calendar, Cpu, Link, ChevronDown, X, Search, Brain } from 'lucide-react';
import { apiService } from '../services/apiService';
import { RelevantQuestionsModal } from './RelevantQuestionsModal';

interface HistoryProps {
  questionSessions: SessionData[];
  answerSessions: SessionData[];
  onClose: () => void;
  questionProvider?: string;
  questionModel?: string;
}

interface RelevantQuestion {
  question: string;
  originalProvider: string;
  originalModel: string;
  sessionName: string;
  sessionTimestamp: string;
  relevanceScore: number;
  relevanceReasoning: string;
  sourceUrls?: string[];
  blogUrl?: string;
  similarityGroup?: string;
}

export function History({ questionSessions, answerSessions, onClose, questionProvider, questionModel }: HistoryProps) {
  const [tab, setTab] = useState<'question' | 'answer'>('question');
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [filter, setFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [llmProviderFilter, setLlmProviderFilter] = useState('');
  const [llmModelFilter, setLlmModelFilter] = useState('');
  const [blogLinkFilter, setBlogLinkFilter] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Relevant questions state
  const [showRelevantQuestions, setShowRelevantQuestions] = useState(false);
  const [relevantQuestions, setRelevantQuestions] = useState<RelevantQuestion[]>([]);
  const [isCheckingRelevance, setIsCheckingRelevance] = useState(false);
  const [relevanceMessage, setRelevanceMessage] = useState('');
  const [totalChecked, setTotalChecked] = useState(0);
  const [showRelevantQuestionsModal, setShowRelevantQuestionsModal] = useState(false);

  const sessions = tab === 'question' ? questionSessions : answerSessions;
  
  // Get unique providers and models for filter dropdowns
  const uniqueProviders = Array.from(new Set(
    sessions
      .map(s => tab === 'question' ? s.questionProvider : s.answerProvider)
      .filter(Boolean)
  )).sort();

  const uniqueModels = Array.from(new Set(
    sessions
      .map(s => tab === 'question' ? s.questionModel : s.answerModel)
      .filter(Boolean)
  )).sort();

  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.timestamp);
    const dateStr = sessionDate.toLocaleString();
    
    // Text filter (date/time)
    if (filter && !dateStr.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    
    // Date range filter
    if (fromDate) {
      const fromDateTime = new Date(fromDate);
      if (sessionDate < fromDateTime) {
        return false;
      }
    }
    
    if (toDate) {
      const toDateTime = new Date(toDate + 'T23:59:59'); // End of day
      if (sessionDate > toDateTime) {
        return false;
      }
    }

    // LLM Provider filter
    const provider = tab === 'question' ? session.questionProvider : session.answerProvider;
    if (llmProviderFilter && provider !== llmProviderFilter) {
      return false;
    }

    // LLM Model filter
    const model = tab === 'question' ? session.questionModel : session.answerModel;
    if (llmModelFilter && model !== llmModelFilter) {
      return false;
    }

    // Blog link filter
    if (blogLinkFilter) {
      const hasMatchingUrl = session.sourceUrls?.some(url => 
        url.toLowerCase().includes(blogLinkFilter.toLowerCase())
      ) || session.blogUrl?.toLowerCase().includes(blogLinkFilter.toLowerCase());
      
      if (!hasMatchingUrl) {
        return false;
      }
    }
    
    return true;
  });

  // Check if URL filter is applied
  const isUrlFilterApplied = blogLinkFilter.trim() !== '';
  const currentFilteredUrl = blogLinkFilter || 
    (filteredSessions.length > 0 ? 
      (filteredSessions[0].blogUrl || filteredSessions[0].sourceUrls?.[0]) : '');

  // Check if we can show the relevant questions button
  const canShowRelevantQuestionsButton = tab === 'question' && 
    filteredSessions.length > 0 && 
    questionProvider && questionModel;

  const clearFilters = () => {
    setFilter('');
    setFromDate('');
    setToDate('');
    setLlmProviderFilter('');
    setLlmModelFilter('');
    setBlogLinkFilter('');
    setActiveFilter(null);
    setShowRelevantQuestions(false);
    setRelevantQuestions([]);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (fromDate || toDate) count++;
    if (llmProviderFilter) count++;
    if (llmModelFilter) count++;
    if (blogLinkFilter) count++;
    if (filter) count++;
    return count;
  };

  const handleCheckRelevantQuestions = async () => {
    if (!questionProvider || !questionModel) {
      console.error('Question provider or model is not provided');
      setRelevanceMessage('Relevant questions feature is not available');
      return;
    }

    if (!currentFilteredUrl) {
      console.error('No URL available for relevance check');
      setRelevanceMessage('No URL available for relevance check. Please apply a URL filter or ensure sessions have source URLs.');
      return;
    }

    if (filteredSessions.length === 0) {
      console.error('No sessions available for relevance check');
      setRelevanceMessage('No sessions available for relevance check');
      return;
    }

    try {
      setIsCheckingRelevance(true);
      setRelevanceMessage('Analyzing questions for relevance...');
      setShowRelevantQuestionsModal(true);

      // Get source URLs from the filtered sessions
      const sourceUrls = filteredSessions
        .flatMap(session => session.sourceUrls || [])
        .filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates

      // Use a sample question from the filtered sessions as reference
      const sampleQuestion = filteredSessions
        .flatMap(session => session.qaData || [])
        .find(qa => qa.question)?.question || '';

      // Call the API service to check for relevant questions
      const result = await apiService.checkQuestionRelevance(
        sourceUrls.length > 0 ? sourceUrls : undefined,
        currentFilteredUrl,
        sampleQuestion,
        questionProvider,
        questionModel
      );
      
      // Update the relevant questions state with the result
      if (result.success && result.relevantQuestions) {
        setRelevantQuestions(result.relevantQuestions);
        setRelevanceMessage(result.message || `Found ${result.relevantQuestions.length} relevant questions from ${result.totalChecked} total questions checked`);
        setTotalChecked(result.totalChecked);
      } else {
        setRelevantQuestions([]);
        setRelevanceMessage('No relevant questions found');
        setTotalChecked(0);
      }
      
    } catch (error) {
      console.error('Error checking relevant questions:', error);
      setRelevanceMessage(`Failed to check for relevant questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setRelevantQuestions([]);
      setTotalChecked(0);
    } finally {
      setIsCheckingRelevance(false);
    }
  };

  const addRelevantQuestion = (questionText: string) => {
    // This function can be used to add relevant questions to the current session
    // For now, we'll just show a message
    console.log('Adding relevant question:', questionText);
    // You can implement this functionality later if needed
  };

  const renderFilterContent = () => {
    switch (activeFilter) {
      case 'date':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Date Range Filter</h4>
              <button
                onClick={() => setActiveFilter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="px-2 py-1 border rounded text-xs flex-1"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="px-2 py-1 border rounded text-xs flex-1"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        );
      
      case 'provider':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">LLM Provider Filter</h4>
              <button
                onClick={() => setActiveFilter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <select
              value={llmProviderFilter}
              onChange={e => setLlmProviderFilter(e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="">All Providers</option>
              {uniqueProviders.map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>
        );
      
      case 'model':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">LLM Model Filter</h4>
              <button
                onClick={() => setActiveFilter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <select
              value={llmModelFilter}
              onChange={e => setLlmModelFilter(e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="">All Models</option>
              {uniqueModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        );
      
      case 'url':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Source URL Filter</h4>
              <button
                onClick={() => setActiveFilter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={blogLinkFilter}
              onChange={e => setBlogLinkFilter(e.target.value)}
              placeholder="Filter by URL..."
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            ✕
          </button>
          <div className="flex gap-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${tab === 'question' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => { setTab('question'); setSelectedSession(null); }}
            >
              Question History
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${tab === 'answer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => { setTab('answer'); setSelectedSession(null); }}
            >
              Answer History
            </button>
          </div>
          
          {!selectedSession ? (
            <div>
              <h2 className="text-lg font-bold mb-4">{tab === 'question' ? 'Question Generation Sessions' : 'Answer Generation Sessions'}</h2>
              
              {/* Filter Dropdown */}
              <div className="mb-4">
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center justify-between px-4 py-2 border rounded-lg text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                      {getActiveFiltersCount() > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {getActiveFiltersCount()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[200px]">
                      <div className="p-3">
                        {activeFilter ? (
                          renderFilterContent()
                        ) : (
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-800 mb-3">Select Filter Type</h4>
                            <button
                              onClick={() => setActiveFilter('date')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded text-sm"
                            >
                              <Calendar className="w-4 h-4" />
                              Date Range
                              {(fromDate || toDate) && <span className="ml-auto text-blue-600">●</span>}
                            </button>
                            <button
                              onClick={() => setActiveFilter('provider')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded text-sm"
                            >
                              <Cpu className="w-4 h-4" />
                              LLM Provider
                              {llmProviderFilter && <span className="ml-auto text-blue-600">●</span>}
                            </button>
                            <button
                              onClick={() => setActiveFilter('model')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded text-sm"
                            >
                              <Cpu className="w-4 h-4" />
                              LLM Model
                              {llmModelFilter && <span className="ml-auto text-blue-600">●</span>}
                            </button>
                            <button
                              onClick={() => setActiveFilter('url')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded text-sm"
                            >
                              <Link className="w-4 h-4" />
                              Source URL
                              {blogLinkFilter && <span className="ml-auto text-blue-600">●</span>}
                            </button>
                            {getActiveFiltersCount() > 0 && (
                              <button
                                onClick={clearFilters}
                                className="w-full mt-2 px-3 py-2 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100"
                              >
                                Clear All Filters
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* View Relevant Questions Button - Only show when URL filter is applied */}
              {canShowRelevantQuestionsButton && (
                <div className="mb-4">
                  <button
                    onClick={handleCheckRelevantQuestions}
                    disabled={isCheckingRelevance}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Brain className="w-4 h-4" />
                    {isCheckingRelevance ? 'Analyzing...' : 'View Relevant Questions'}
                  </button>
                  <p className="text-xs text-gray-600 mt-1">
                    {isUrlFilterApplied 
                      ? 'View relevant questions from other LLM providers for this URL'
                      : `View relevant questions from other LLM providers for ${filteredSessions.length} session(s)`
                    }
                  </p>
                </div>
              )}

              <input
                type="text"
                placeholder="Filter by date/time..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="mb-3 px-3 py-2 border rounded w-full text-sm"
              />
              <div className="max-h-80 overflow-y-auto divide-y">
                {filteredSessions.length === 0 && (
                  <div className="text-gray-500 text-center py-8">No sessions found.</div>
                )}
                {filteredSessions.map(session => (
                  <div
                    key={session.id}
                    className="py-3 px-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div>
                      <div className="font-semibold text-blue-700">{session.name}</div>
                      <div className="text-xs text-gray-500">{new Date(session.timestamp).toLocaleString()}</div>
                      {session.blogUrl && (
                        <div className="text-xs mt-1">
                          <a href={session.blogUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Blog Link</a>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 text-right">
                      Total Cost: ${session.statistics.totalCost}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <button
                className="mb-4 text-blue-600 hover:underline text-sm"
                onClick={() => setSelectedSession(null)}
              >
                ← Back to {tab === 'question' ? 'Question' : 'Answer'} History
              </button>
              <h2 className="text-lg font-bold mb-2">{selectedSession.name}</h2>
              <div className="text-xs text-gray-500 mb-2">
                {new Date(selectedSession.timestamp).toLocaleString()} &bull; {selectedSession.model}
                {selectedSession.questionProvider && (
                  <span className="ml-2">
                    &bull; Provider: {selectedSession.questionProvider}
                    {selectedSession.questionModel && ` (${selectedSession.questionModel})`}
                  </span>
                )}
                {selectedSession.answerProvider && selectedSession.type === 'answer' && (
                  <span className="ml-2">
                    &bull; Answer Provider: {selectedSession.answerProvider}
                    {selectedSession.answerModel && ` (${selectedSession.answerModel})`}
                  </span>
                )}
              </div>
              
              {/* Source Information */}
              {selectedSession.sourceUrls && selectedSession.sourceUrls.length > 0 && (
                <div className="mb-2">
                  <span className="font-semibold">Source URLs:</span>
                  <div className="mt-1 space-y-1">
                    {selectedSession.sourceUrls.map((url, index) => (
                      <div key={index} className="text-xs">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                  {selectedSession.crawlMode && (
                    <div className="text-xs text-gray-600 mt-1">
                      Crawl Mode: {selectedSession.crawlMode === 'website' ? 'Website Crawl' : 'Single Page'}
                    </div>
                  )}
                  {selectedSession.crawledPages && selectedSession.crawledPages.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      Crawled Pages: {selectedSession.crawledPages.length}
                    </div>
                  )}
                </div>
              )}
              
              {/* QA Data */}
              <div className="space-y-3">
                {selectedSession.qaData.map((qa, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="font-semibold text-gray-800 mb-2">Q{index + 1}: {qa.question}</div>
                    {qa.answer && (
                      <div className="text-gray-600 mb-2">
                        <strong>A:</strong> {qa.answer}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 space-x-4">
                      {qa.accuracy && <span>Accuracy: {qa.accuracy}%</span>}
                      {qa.sentiment && <span>Sentiment: {qa.sentiment}</span>}
                      {qa.cost && <span>Cost: ${qa.cost}</span>}
                      {typeof qa.geoScore === 'number' && <span>GEO Score: {qa.geoScore}</span>}
                      {typeof qa.citationLikelihood === 'number' && <span>Citation: {qa.citationLikelihood}%</span>}
                    </div>
                    {/* GEO Score Breakdown */}
                    {qa.geoBreakdown && (
                      <div className="mt-2 text-xs text-gray-600 bg-yellow-50 border border-yellow-100 rounded p-2">
                        <div><strong>GEO Breakdown:</strong></div>
                        <div>Accuracy: {qa.geoBreakdown.accuracy}</div>
                        <div>Coverage: {qa.geoBreakdown.coverage}</div>
                        <div>Structure: {qa.geoBreakdown.structure}</div>
                        <div>Schema: {qa.geoBreakdown.schema ? 'Yes' : 'No'}</div>
                        <div>Accessibility: {qa.geoBreakdown.access ? 'Yes' : 'No'}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Relevant Questions Modal */}
      <RelevantQuestionsModal
        isOpen={showRelevantQuestionsModal}
        onClose={() => setShowRelevantQuestionsModal(false)}
        relevantQuestions={relevantQuestions}
        totalChecked={totalChecked}
        message={relevanceMessage}
        isLoading={isCheckingRelevance}
        onAddQuestion={addRelevantQuestion}
      />
    </>
  );
} 