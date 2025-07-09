import { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { Configuration } from './components/Configuration';
import { ContentInput } from './components/ContentInput';
import { QuestionSelection } from './components/QuestionSelection';
import { ProgressSection } from './components/ProgressSection';
import { Results } from './components/Results';
import { SessionManagement } from './components/SessionManagement';
import { Statistics } from './components/Statistics';
import { Login } from './components/Login';
import { UserProfile } from './components/UserProfile';
import { useLocalStorage } from './hooks/useLocalStorage';
import { analyzeSentiment, calculateConfidenceStats } from './utils/analysis';
import { downloadFile } from './utils/fileUtils';
import { QAItem, GeneratedQuestion, SessionData } from './types';
import { RelevantQuestionsModal } from './components/RelevantQuestionsModal';
import { apiService } from './services/apiService';
import { useAuth } from './contexts/AuthContext';
import { calculateCost } from './utils/pricing';
import { History } from './components/History';
import { calculateAndUpdateVectorSimilarities } from './utils/vectorSimilarity';
// import { calculateAndUpdateGEOFanoutDensity } from './utils/geoFanoutDensity';

const SESSIONS_KEY = 'llm_qa_sessions';
const CURRENT_SESSION_KEY = 'llm_qa_current_session';

// Utility for concurrency-limited Promise.all
async function mapWithConcurrencyLimit<T, R>(items: T[], limit: number, asyncFn: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function next() {
    if (i >= items.length) return;
    const idx = i++;
    results[idx] = await asyncFn(items[idx], idx);
    await next();
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, next);
  await Promise.all(workers);
  return results;
}

function AppContent() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  
  // Debug logging
  console.log('Auth state:', { isAuthenticated, isLoading, user });
  
  // Configuration state - multi-LLM providers
  const [questionProvider, setQuestionProvider] = useState('');
  const [answerProvider, setAnswerProvider] = useState('');
  const [questionModel, setQuestionModel] = useState('');
  const [answerModel, setAnswerModel] = useState('');
  const [answerMode, setAnswerMode] = useState<'api' | 'web'>('api');
  
  // Content state
  const [blogContent, setBlogContent] = useState('');
  const [blogUrl, setBlogUrl] = useState('');
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [crawlMode, setCrawlMode] = useState<'single' | 'website'>('single');
  const [crawledPages, setCrawledPages] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  
  // Generation state
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [qaData, setQAData] = useState<QAItem[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  
  // Progress state
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Ready to start...');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  
  // Token tracking
  const [totalInputTokens, setTotalInputTokens] = useState(0);
  const [totalOutputTokens, setTotalOutputTokens] = useState(0);
  
  // Session management
  const [sessionName, setSessionName] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionStatus, setSessionStatus] = useState('');
  const [sessionStatusType, setSessionStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [allSessions, setAllSessions] = useLocalStorage<Record<string, SessionData>>(SESSIONS_KEY, {});
  const [questionSessions, setQuestionSessions] = useState<SessionData[]>([]);
  const [answerSessions, setAnswerSessions] = useState<SessionData[]>([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [, setIsLoadingFilteredSessions] = useState(false);

  // Relevant questions state
  const [showRelevantQuestionsModal, setShowRelevantQuestionsModal] = useState(false);
  const [relevantQuestions, setRelevantQuestions] = useState<any[]>([]);
  const [isCheckingRelevance, setIsCheckingRelevance] = useState(false);
  const [relevanceMessage, setRelevanceMessage] = useState('');
  const [totalChecked, setTotalChecked] = useState(0);

  // Recovery on component mount - ALWAYS CALL THIS HOOK
  useEffect(() => {
    const recoveredData = localStorage.getItem(CURRENT_SESSION_KEY);
    if (recoveredData) {
      try {
        const parsed = JSON.parse(recoveredData);
        if (parsed.qaData && parsed.qaData.length > 0) {
          const shouldRecover = window.confirm('Found unsaved work from previous session. Would you like to recover it?');
          if (shouldRecover) {
            setQAData(parsed.qaData);
            setTotalInputTokens(parsed.totalInputTokens || 0);
            setTotalOutputTokens(parsed.totalOutputTokens || 0);
            setCurrentSessionId(parsed.id);
            setSessionName(parsed.name || '');
            
            // Handle backward compatibility for API keys and models
            if (parsed.questionProvider && parsed.answerProvider) {
              // New structure with providers
              setQuestionProvider(parsed.questionProvider);
              setAnswerProvider(parsed.answerProvider);
              setQuestionModel(parsed.questionModel || '');
              setAnswerModel(parsed.answerModel || '');
            } else if (parsed.questionApiKey && parsed.answerApiKey) {
              // Old structure with separate API keys
              setQuestionProvider('gemini'); // Default to gemini for old sessions
              setAnswerProvider('gemini');
              setQuestionModel(parsed.questionModel || 'gemini-1.5-flash');
              setAnswerModel(parsed.answerModel || 'gemini-1.5-flash');
            } else {
              // Very old structure with single API key - use for both
              setQuestionProvider('gemini');
              setAnswerProvider('gemini');
              setQuestionModel(parsed.model || 'gemini-1.5-flash');
              setAnswerModel(parsed.model || 'gemini-1.5-flash');
            }
            
            setBlogContent(parsed.blogContent || '');
            setBlogUrl(parsed.blogUrl || '');
            setSourceUrls(parsed.sourceUrls || []);
            setCrawlMode(parsed.crawlMode || 'single');
            setCrawledPages(parsed.crawledPages || []);
            showSessionStatus('Previous session recovered successfully!', 'success');
          }
        }
      } catch (error) {
        console.error('Error recovering session:', error);
      }
    }
  }, []);

  // Check backend connectivity and load sessions on mount - ALWAYS CALL THIS HOOK
  useEffect(() => {
    const checkBackendAndLoadSessions = async () => {
      try {
        console.log('Checking backend connectivity...');
        // Check if backend is available
        const healthResponse = await apiService.healthCheck();
        console.log('Backend health check successful:', healthResponse);
        setBackendConnected(true);
        
        // Only load sessions if user is authenticated
        if (isAuthenticated) {
          // Load sessions from backend
          await loadSessionsFromBackend();
          
          // Migrate localStorage data if not already done
          if (!migrationCompleted && Object.keys(allSessions).length > 0) {
            await migrateLocalStorageToBackend();
          }
        }
      } catch (error) {
        console.warn('Backend not available, using localStorage:', error);
        setBackendConnected(false);
        // Fallback to localStorage only if authenticated
        if (isAuthenticated) {
          try {
            const sessionsArr: SessionData[] = Object.values(allSessions);
            setQuestionSessions(sessionsArr.filter(s => s.type === 'question'));
            setAnswerSessions(sessionsArr.filter(s => s.type === 'answer'));
          } catch (localStorageError) {
            console.error('Failed to load from localStorage:', localStorageError);
            setQuestionSessions([]);
            setAnswerSessions([]);
          }
        }
      }
    };

    // Only run this once on mount
    checkBackendAndLoadSessions();
  }, [isAuthenticated]); // Add isAuthenticated as dependency

  const showSessionStatus = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setSessionStatus(message);
    setSessionStatusType(type);
  };

  const showStatus = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setStatus(message);
    setStatusType(type);
  };

  const loadSessionsFromBackend = async () => {
    try {
      console.log('Loading sessions from backend...');
      setIsLoadingFilteredSessions(true);
      
      const [questionResponse, answerResponse] = await Promise.all([
        apiService.getSessionsByType('question'),
        apiService.getSessionsByType('answer')
      ]);

      console.log('Sessions loaded from backend:', { 
        questions: questionResponse.sessions.length, 
        answers: answerResponse.sessions.length 
      });

      setQuestionSessions(questionResponse.sessions);
      setAnswerSessions(answerResponse.sessions);
    } catch (error) {
      console.error('Error loading sessions from backend:', error);
      showSessionStatus('Failed to load sessions from backend, using localStorage fallback', 'error');
      // Fallback to localStorage
      try {
        const allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
        const sessionsArr: SessionData[] = Object.values(allSessions);
        setQuestionSessions(sessionsArr.filter(s => s.type === 'question'));
        setAnswerSessions(sessionsArr.filter(s => s.type === 'answer'));
      } catch (localStorageError) {
        console.error('Failed to load from localStorage as well:', localStorageError);
        setQuestionSessions([]);
        setAnswerSessions([]);
      }
    } finally {
      setIsLoadingFilteredSessions(false);
    }
  };

  const checkRelevantQuestions = async () => {
    if (!sourceUrls && !blogUrl) {
      showStatus('No source URLs or blog URL available to check for relevant questions', 'error');
      return;
    }

    if (!questionProvider || !questionModel) {
      showStatus('Please select a question provider and model first', 'error');
      return;
    }

    try {
      setIsCheckingRelevance(true);
      setShowRelevantQuestionsModal(true);
      setRelevanceMessage('Checking for relevant questions from other LLM providers...');

      const result = await apiService.checkQuestionRelevance(
        sourceUrls,
        blogUrl,
        generatedQuestions[0]?.question || '', // Use first question as reference
        questionProvider,
        questionModel
      );

      setRelevantQuestions(result.relevantQuestions);
      setRelevanceMessage(result.message);
      setTotalChecked(result.totalChecked);

      if (result.relevantQuestions.length === 0) {
        showStatus('No relevant questions found from other LLM providers', 'info');
      } else {
        showStatus(`Found ${result.relevantQuestions.length} relevant questions from other LLM providers`, 'success');
      }
    } catch (error) {
      console.error('Error checking relevant questions:', error);
      const errorMessage = (error as Error).message || 'Unknown error occurred';
      showStatus(`Failed to check for relevant questions: ${errorMessage}`, 'error');
      setRelevanceMessage(`Failed to check for relevant questions: ${errorMessage}`);
      setRelevantQuestions([]);
      setTotalChecked(0);
    } finally {
      setIsCheckingRelevance(false);
    }
  };

  const addRelevantQuestion = (questionText: string) => {
    // Add the relevant question to the current generated questions
    const newQuestion: GeneratedQuestion = {
      id: `q-relevant-${Date.now()}`,
      question: questionText,
      selected: true,
      confidence: 85, // Default confidence for relevant questions
      confidenceReasoning: 'Added from relevant questions found from other LLM providers',
      outputTokens: Math.ceil(questionText.length / 4), // Estimate tokens
      cost: 0 // No additional cost for adding existing questions
    };

    setGeneratedQuestions(prev => [...prev, newQuestion]);
    showStatus(`Added relevant question: "${questionText.substring(0, 50)}..."`, 'success');
  };

  const migrateLocalStorageToBackend = async () => {
    try {
      showSessionStatus('Migrating localStorage data to backend...', 'info');
      
      const result = await apiService.migrateFromLocalStorage(allSessions);
      
      if (result.success) {
        setMigrationCompleted(true);
        showSessionStatus(`Migration completed: ${result.summary.successful}/${result.summary.total} sessions migrated`, 'success');
        
        // Reload sessions from backend
        await loadSessionsFromBackend();
      } else {
        showSessionStatus('Migration failed', 'error');
      }
    } catch (error) {
      console.error('Migration error:', error);
      showSessionStatus('Migration failed: ' + (error as Error).message, 'error');
    }
  };
  
  // Show loading state while checking authentication
  if (isLoading) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    console.log('Showing login page - not authenticated');
    return <Login />;
  }

  console.log('Showing main app - authenticated');

  const generateQuestions = async () => {
    if (!blogContent.trim()) {
      showStatus('Please load content from a URL or enter content manually', 'error');
      return;
    }

    if (!questionProvider || !questionModel) {
      showStatus('Please select a question provider and model', 'error');
      return;
    }

    try {
      setIsGeneratingQuestions(true);
      showStatus('Generating high-confidence questions...', 'info');
      setProgress(0);

      // Use backend LLM API
      const result = await apiService.generateQuestions({
        content: blogContent,
        questionCount,
        provider: questionProvider,
        model: questionModel
      });

      if (result.questions.length === 0) {
        throw new Error('No questions were generated. Please try again.');
      }

      // Calculate confidence for these questions individually
      const generatedQs: GeneratedQuestion[] = await mapWithConcurrencyLimit<string, GeneratedQuestion>(result.questions, 5, async (question: string, i: number) => {
        let confidence = 50;
        let confidenceReasoning = '';
        let confidenceOutputTokens = 0;
        try {
          const confidenceResult = await apiService.calculateConfidence(
            question,
            blogContent,
            questionProvider,
            questionModel
          );
          confidence = confidenceResult.confidence;
          confidenceReasoning = confidenceResult.reasoning;
          confidenceOutputTokens = confidenceResult.outputTokens;
        } catch (error) {
          confidence = 50;
          confidenceReasoning = 'Fallback confidence calculation due to AI error';
          confidenceOutputTokens = 0;
        }
        const questionOutputTokens = Math.ceil(question.length / 4);
        const questionCost = calculateCost(0, questionOutputTokens, questionModel);
        const confidenceCost = calculateCost(0, confidenceOutputTokens, questionModel);
        const totalCost = questionCost + confidenceCost;
        const totalOutputTokens = questionOutputTokens + confidenceOutputTokens;
        setProgress((i + 1) / result.questions.length);
        return {
          id: `q-${Date.now()}-${i}`,
          question,
          selected: true,
          confidence,
          confidenceReasoning,
          outputTokens: totalOutputTokens,
          cost: totalCost
        };
      });

      setGeneratedQuestions(generatedQs);
      setProgress(1);
      
      // Calculate confidence statistics
      const confidences = generatedQs.map(q => q.confidence || 0);
      const stats = calculateConfidenceStats(confidences);
      
      showStatus(`Generated ${result.questions.length} questions with average confidence of ${stats.average.toFixed(1)}%. Select which questions you want to answer.`, 'success');
      
      // Save question session after generating questions
      const totalOutputTokens = generatedQs.reduce((sum, q) => sum + (q.outputTokens || 0), 0);
      await saveQuestionSession(generatedQs, 0, totalOutputTokens, blogUrl);
      
    } catch (error) {
      showStatus(`Error: ${(error as Error).message}`, 'error');
      console.error('Generation error:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const generateAnswers = async () => {
    const selectedQuestions = generatedQuestions.filter(q => q.selected);
    
    if (selectedQuestions.length === 0) {
      showStatus('Please select at least one question', 'error');
      return;
    }

    if (!answerProvider || !answerModel) {
      showStatus('Please select an answer provider and model', 'error');
      return;
    }

    try {
      setIsGeneratingAnswers(true);
      showStatus(`Generating answers for ${selectedQuestions.length} selected questions...`, 'info');
      setProgress(0);

      let result;
      if (answerMode === 'api') {
        result = await apiService.generateAnswers({
          content: blogContent,
          questions: selectedQuestions.map(q => q.question),
          provider: answerProvider,
          model: answerModel
        });
      } else {
        showStatus('Generating answers using web browser automation. This may take longer...', 'info');
        result = await apiService.generateAnswersWeb({
          content: blogContent,
          questions: selectedQuestions.map(q => q.question),
          answerProvider,
          model: answerModel
        });
      }

      // Dynamically generate important questions for coverage
      let importantQuestions: string[] = [];
      let importantConfidences: number[] = [];
      try {
        const importantResult = await apiService.generateQuestions({
          content: blogContent,
          questionCount: 10, // or another suitable number
          provider: questionProvider,
          model: questionModel
        });
        importantQuestions = importantResult.questions;
        // Get confidences for important questions
        for (const q of importantQuestions) {
          try {
            const confResp = await apiService.calculateConfidence(q, blogContent, questionProvider, questionModel);
            importantConfidences.push(confResp.confidence);
          } catch (e) {
            importantConfidences.push(0);
          }
        }
      } catch (e) {
        console.error('Failed to generate important questions for GEO coverage:', e);
      }

      // Replace the synchronous map with an async loop to await backend accuracy and GEO score
      const newQAData: QAItem[] = await mapWithConcurrencyLimit<any, QAItem>(result.answers, 5, async (answerData: any, i: number) => {
        let accuracy = 50;
        try {
          const resp = await apiService.calculateAccuracy({
            answer: answerData.answer,
            content: blogContent,
            provider: answerProvider,
            model: answerModel
          });
          accuracy = resp.accuracy;
        } catch (e) {
          accuracy = 50;
        }
        let citationLikelihood = 50;
        try {
          const citationResp = await apiService.calculateCitationLikelihood({
            answer: answerData.answer,
            content: blogContent,
            provider: answerProvider,
            model: answerModel
          });
          citationLikelihood = citationResp.citationLikelihood;
        } catch (e) {
          citationLikelihood = 50;
        }
        const sentiment = analyzeSentiment(answerData.answer);
        const totalTokens = answerData.inputTokens + answerData.outputTokens;
        const cost = calculateCost(answerData.inputTokens, answerData.outputTokens, answerModel);
        // Calculate GEO score using backend
        let geoScore = 0;
        let geoBreakdown = {};
        try {
          console.log('[Frontend] Calling GEO score backend with:', {
            accuracy,
            question: answerData.question,
            answer: answerData.answer,
            importantQuestions,
            allConfidences: importantConfidences,
            sourceUrl: blogUrl,
            content: blogContent
          });
          const geoResult = await apiService.calculateGeoScoreBackend({
            accuracy,
            question: answerData.question,
            answer: answerData.answer,
            importantQuestions,
            allConfidences: importantConfidences,
            sourceUrl: blogUrl,
            content: blogContent
          });
          console.log('[Frontend] GEO score backend response:', geoResult);
          geoScore = geoResult.geoScore;
          geoBreakdown = geoResult.breakdown;
        } catch (e) {
          console.error('[Frontend] GEO score calculation failed:', e);
        }
        return {
          question: answerData.question,
          answer: answerData.answer,
          accuracy: accuracy.toFixed(1),
          sentiment,
          inputTokens: answerData.inputTokens,
          outputTokens: answerData.outputTokens,
          totalTokens,
          cost,
          geoScore,
          geoBreakdown,
          citationLikelihood
        };
      });

      // Calculate vector similarities and GEO fanout density for the Q&A pairs
      let finalQAData = newQAData;
      
      showStatus('Calculating vector similarities...', 'info');
      try {
        const qaDataWithSimilarities = await calculateAndUpdateVectorSimilarities(newQAData, blogContent);
        finalQAData = qaDataWithSimilarities;
        console.log('[App] Vector similarities calculated and updated');
      } catch (error) {
        console.error('[App] Error calculating vector similarities:', error);
        // Use original data if similarity calculation fails
      }

      showStatus('Calculating GEO fanout density...', 'info');
      try {
        // const qaDataWithFanoutDensity = await calculateAndUpdateGEOFanoutDensity(
        //   finalQAData, 
        //   blogContent, 
        //   answerProvider || 'gemini', 
        //   answerModel || 'gemini-1.5-flash'
        // );
        // finalQAData = qaDataWithFanoutDensity;
        console.log('[App] GEO fanout density calculation skipped due to commented out import');
      } catch (error) {
        console.error('[App] Error calculating GEO fanout density:', error);
        // Keep the data with vector similarities if fanout density calculation fails
      }
      
      setQAData(finalQAData);
      
      setTotalInputTokens(result.totalInputTokens || 0);
      setTotalOutputTokens(result.totalOutputTokens || 0);
      
      showStatus('All answers generated successfully!', 'success');
      setProgress(1);
      
      // Auto-save session
      if (!currentSessionId) {
        const autoSessionName = `Auto-saved ${new Date().toLocaleString()}`;
        setSessionName(autoSessionName);
      }
      
      // Save answer session after generating answers
      await saveAnswerSession(newQAData, result.totalInputTokens || 0, result.totalOutputTokens || 0, blogUrl);
      
    } catch (error) {
      showStatus(`Error: ${(error as Error).message}`, 'error');
      console.error('Generation error:', error);
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  const toggleQuestion = (id: string) => {
    setGeneratedQuestions(prev =>
      prev.map(q => q.id === id ? { ...q, selected: !q.selected } : q)
    );
  };

  const selectAllQuestions = () => {
    setGeneratedQuestions(prev => prev.map(q => ({ ...q, selected: true })));
  };

  const deselectAllQuestions = () => {
    setGeneratedQuestions(prev => prev.map(q => ({ ...q, selected: false })));
  };

  // Session management functions
  const generateSessionId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const saveCurrentSession = () => {
    if (qaData.length === 0) {
      showSessionStatus('No data to save', 'error');
      return;
    }

    let name = sessionName.trim();
    if (!name) {
      name = `Session ${new Date().toLocaleString()}`;
    }

    const sessionId = currentSessionId || generateSessionId();
    const totalCost = qaData.reduce((sum, qa) => sum + (qa.cost || 0), 0);
    const sessionData: SessionData = {
      id: sessionId,
      name,
      type: 'answer',
      timestamp: new Date().toISOString(),
      model: answerModel,
      questionProvider,
      answerProvider,
      questionModel,
      answerModel,
      blogContent,
      blogUrl,
      qaData: [...qaData],
      totalInputTokens,
      totalOutputTokens,
      statistics: {
        totalQuestions: qaData.length,
        avgAccuracy: qaData.length > 0 ? (qaData.reduce((sum, item) => sum + parseFloat(item.accuracy), 0) / qaData.length).toFixed(1) + '%' : '0%',
        avgCitationLikelihood: qaData.length > 0 ? (qaData.reduce((sum, item) => sum + (item.citationLikelihood || 0), 0) / qaData.length).toFixed(1) + '%' : '0%',
        totalCost: totalCost.toFixed(8)
      }
    };

    const updatedSessions = { ...allSessions, [sessionId]: sessionData };
    setAllSessions(updatedSessions);
    setCurrentSessionId(sessionId);
    setSessionName(name);
    
    // Auto-save to localStorage for recovery
    const recoveryData = {
      ...sessionData,
      questionProvider,
      answerProvider,
      questionModel,
      answerModel
    };
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(recoveryData));
    
    showSessionStatus(`Session "${name}" saved successfully!`, 'success');
  };

  const loadSession = (sessionId: string) => {
    const sessionData = allSessions[sessionId];
    if (!sessionData) {
      showSessionStatus('Session not found', 'error');
      return;
    }

    setCurrentSessionId(sessionData.id);
    setSessionName(sessionData.name);
    setQAData([...sessionData.qaData]);
    setTotalInputTokens(sessionData.totalInputTokens);
    setTotalOutputTokens(sessionData.totalOutputTokens);
    
    // Handle backward compatibility for API keys and models
    if (sessionData.questionProvider && sessionData.answerProvider) {
      // New structure with providers
      setQuestionProvider(sessionData.questionProvider);
      setAnswerProvider(sessionData.answerProvider);
      setQuestionModel(sessionData.questionModel || '');
      setAnswerModel(sessionData.answerModel || '');
    } else {
      // Old structure with single model - use for both
      setQuestionProvider('gemini'); // Default to gemini for old sessions
      setAnswerProvider('gemini');
      setQuestionModel(sessionData.model);
      setAnswerModel(sessionData.model);
    }
    
    setBlogContent(sessionData.blogContent);
    setBlogUrl(sessionData.blogUrl || '');
    setSourceUrls(sessionData.sourceUrls || []);
    setCrawlMode(sessionData.crawlMode || 'single');
    setCrawledPages(sessionData.crawledPages || []);
    // Ensure type is set for backward compatibility
    if (!sessionData.type) sessionData.type = 'answer';

    showSessionStatus(`Session "${sessionData.name}" loaded successfully!`, 'success');
  };

  const deleteSession = () => {
    if (!selectedSessionId) {
      showSessionStatus('Please select a session to delete', 'error');
      return;
    }

    const sessionName = allSessions[selectedSessionId]?.name || 'Unknown';
    
    if (window.confirm(`Are you sure you want to delete session "${sessionName}"?`)) {
      const updatedSessions = { ...allSessions };
      delete updatedSessions[selectedSessionId];
      setAllSessions(updatedSessions);
      
      if (currentSessionId === selectedSessionId) {
        setCurrentSessionId(null);
        setSessionName('');
      }
      
      setSelectedSessionId('');
      showSessionStatus(`Session "${sessionName}" deleted successfully!`, 'success');
    }
  };

  const clearAllSessions = () => {
    if (window.confirm('Are you sure you want to delete ALL saved sessions? This cannot be undone!')) {
      setAllSessions({});
      localStorage.removeItem(CURRENT_SESSION_KEY);
      setCurrentSessionId(null);
      setSessionName('');
      setSelectedSessionId('');
      showSessionStatus('All sessions cleared successfully!', 'success');
    }
  };

  const exportAllSessions = () => {
    const sessionCount = Object.keys(allSessions).length;
    
    if (sessionCount === 0) {
      showSessionStatus('No sessions to export', 'error');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      totalSessions: sessionCount,
      sessions: allSessions
    };

    downloadFile(
      JSON.stringify(exportData, null, 2), 
      `llm-qa-all-sessions-${new Date().toISOString().split('T')[0]}.json`, 
      'application/json'
    );
    
    showSessionStatus(`${sessionCount} sessions exported successfully!`, 'success');
  };

  // Export functions
  const exportToCSV = () => {
    if (qaData.length === 0) {
      showStatus('No data to export', 'error');
      return;
    }
    
    const headers = [
      'Source URLs', 'Crawl Mode', 'Crawled Pages Count', 'LLM Provider', 'LLM Model', 'Question', 'Answer', 'Accuracy (%)', 
      'Sentiment', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'API Cost'
    ];
    const csvContent = [
      headers.join(','),
      ...qaData.map(item => [
        `"${sourceUrls.length > 0 ? sourceUrls.join('; ') : (blogUrl || '')}"`,
        `"${crawlMode || ''}"`,
        crawledPages.length,
        `"${answerProvider || ''}"`,
        `"${answerModel || ''}"`,
        `"${item.question.replace(/"/g, '""')}"`,
        `"${item.answer.replace(/"/g, '""')}"`,
        item.accuracy,
        item.sentiment,
        item.inputTokens,
        item.outputTokens,
        item.totalTokens,
        item.cost ? item.cost.toFixed(8) : '0'
      ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, 'llm-qa-results.csv', 'text/csv');
    showStatus('CSV file downloaded successfully!', 'success');
  };

  const exportToJSON = () => {
    if (qaData.length === 0) {
      showStatus('No data to export', 'error');
      return;
    }
    
    const avgAccuracy = qaData.length > 0 ? 
      qaData.reduce((sum, item) => sum + parseFloat(item.accuracy), 0) / qaData.length : 0;
    const totalCost = qaData.reduce((sum, qa) => sum + (qa.cost || 0), 0);
    
    const exportData = {
      timestamp: new Date().toISOString(),
      sourceUrls: sourceUrls.length > 0 ? sourceUrls : (blogUrl ? [blogUrl] : []),
      crawlMode: crawlMode,
      crawledPagesCount: crawledPages.length,
      llmProvider: answerProvider,
      llmModel: answerModel,
      totalQuestions: qaData.length,
      totalInputTokens,
      totalOutputTokens,
      totalCost: totalCost.toFixed(8),
      averageAccuracy: avgAccuracy.toFixed(1),
      data: qaData
    };
    
    downloadFile(JSON.stringify(exportData, null, 2), 'llm-qa-results.json', 'application/json');
    showStatus('JSON file downloaded successfully!', 'success');
  };

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      sourceUrls: sourceUrls.length > 0 ? sourceUrls : (blogUrl ? [blogUrl] : []),
      crawlMode: crawlMode,
      crawledPagesCount: crawledPages.length,
      llmProvider: answerProvider,
      llmModel: answerModel,
      totalQuestions: qaData.length,
      questions: qaData.map(item => ({
        question: item.question,
        answer: item.answer,
        accuracy: item.accuracy,
        sentiment: item.sentiment
      }))
    };

    const reportContent = JSON.stringify(report, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('Report downloaded successfully!', 'success');
  };

  // Save question session after generating questions
  const saveQuestionSession = async (questions: GeneratedQuestion[], inputTokens: number, outputTokens: number, blogUrl: string) => {
    const sessionId = generateSessionId();
    const totalCost = questions.reduce((sum, q) => sum + (q.cost || 0), 0);
    const sessionData: SessionData = {
      id: sessionId,
      name: `Questions ${new Date().toLocaleString()}`,
      type: 'question',
      timestamp: new Date().toISOString(),
      model: questionModel,
      questionProvider,
      answerProvider,
      questionModel,
      answerModel,
      blogContent: '',
      blogUrl,
      sourceUrls: sourceUrls.length > 0 ? sourceUrls : (blogUrl ? [blogUrl] : undefined),
      crawlMode: sourceUrls.length > 1 || crawlMode === 'website' ? crawlMode : undefined,
      crawledPages: crawledPages.length > 0 ? crawledPages : undefined,
      qaData: questions.map(q => ({
        question: q.question,
        answer: '',
        accuracy: '',
        sentiment: '',
        inputTokens: 0, // Questions don't have input tokens
        outputTokens: q.outputTokens || 0,
        totalTokens: q.outputTokens || 0,
        cost: q.cost
      })),
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      statistics: {
        totalQuestions: questions.length,
        avgAccuracy: '',
        avgCitationLikelihood: '0%',
        totalCost: totalCost.toFixed(8),
      }
    };

    console.log('Saving question session:', { sessionId, backendConnected, sessionData });

    try {
      if (backendConnected) {
        console.log('Attempting to save to backend...');
        const result = await apiService.saveSession(sessionData);
        console.log('Backend save result:', result);
        showSessionStatus('Question session saved to backend successfully!', 'success');
        // Reload sessions from backend
        await loadSessionsFromBackend();
      } else {
        console.log('Backend not connected, saving to localStorage...');
        // Fallback to localStorage
        const allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
        allSessions[sessionId] = sessionData;
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
        
        // Update local state
        const sessionsArr: SessionData[] = Object.values(allSessions);
        setQuestionSessions(sessionsArr.filter(s => s.type === 'question'));
        showSessionStatus('Question session saved to localStorage!', 'success');
      }
    } catch (error) {
      console.error('Error saving question session:', error);
      showSessionStatus(`Failed to save question session: ${(error as Error).message}`, 'error');
      
      // Fallback to localStorage on error
      try {
        const allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
        allSessions[sessionId] = sessionData;
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
        
        const sessionsArr: SessionData[] = Object.values(allSessions);
        setQuestionSessions(sessionsArr.filter(s => s.type === 'question'));
        showSessionStatus('Question session saved to localStorage as fallback!', 'success');
      } catch (localStorageError) {
        console.error('Failed to save to localStorage as well:', localStorageError);
        showSessionStatus('Failed to save session anywhere!', 'error');
      }
    }
  };

  // Save answer session after generating answers
  const saveAnswerSession = async (qaData: QAItem[], inputTokens: number, outputTokens: number, blogUrl: string) => {
    const sessionId = generateSessionId();
    const totalCost = qaData.reduce((sum, qa) => sum + (qa.cost || 0), 0);
    const sessionData: SessionData = {
      id: sessionId,
      name: `Answers ${new Date().toLocaleString()}`,
      type: 'answer',
      timestamp: new Date().toISOString(),
      model: answerModel,
      questionProvider,
      answerProvider,
      questionModel,
      answerModel,
      blogContent: '', // Don't store full content
      blogUrl,
      sourceUrls: sourceUrls.length > 0 ? sourceUrls : (blogUrl ? [blogUrl] : undefined),
      crawlMode: sourceUrls.length > 1 || crawlMode === 'website' ? crawlMode : undefined,
      crawledPages: crawledPages.length > 0 ? crawledPages : undefined,
      qaData: [...qaData],
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      statistics: {
        totalQuestions: qaData.length,
        avgAccuracy: qaData.length > 0 ? (qaData.reduce((sum, item) => sum + parseFloat(item.accuracy), 0) / qaData.length).toFixed(1) + '%' : '0%',
        avgCitationLikelihood: qaData.length > 0 ? (qaData.reduce((sum, item) => sum + (item.citationLikelihood || 0), 0) / qaData.length).toFixed(1) + '%' : '0%',
        totalCost: totalCost.toFixed(8),
      }
    };

    console.log('Saving answer session:', { sessionId, backendConnected, sessionData });

    try {
      if (backendConnected) {
        console.log('Attempting to save answer session to backend...');
        const result = await apiService.saveSession(sessionData);
        console.log('Backend save result for answer session:', result);
        showSessionStatus('Answer session saved to backend successfully!', 'success');
        // Reload sessions from backend
        await loadSessionsFromBackend();
      } else {
        console.log('Backend not connected, saving answer session to localStorage...');
        // Fallback to localStorage
        const allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
        allSessions[sessionId] = sessionData;
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
        
        // Update local state
        const sessionsArr: SessionData[] = Object.values(allSessions);
        setAnswerSessions(sessionsArr.filter(s => s.type === 'answer'));
        showSessionStatus('Answer session saved to localStorage!', 'success');
      }
    } catch (error) {
      console.error('Error saving answer session:', error);
      showSessionStatus(`Failed to save answer session: ${(error as Error).message}`, 'error');
      
      // Fallback to localStorage on error
      try {
        const allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
        allSessions[sessionId] = sessionData;
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
        
        const sessionsArr: SessionData[] = Object.values(allSessions);
        setAnswerSessions(sessionsArr.filter(s => s.type === 'answer'));
        showSessionStatus('Answer session saved to localStorage as fallback!', 'success');
      } catch (localStorageError) {
        console.error('Failed to save to localStorage as well:', localStorageError);
        showSessionStatus('Failed to save session anywhere!', 'error');
      }
    }
  };

  const savedSessionsList = Object.values(allSessions).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LLM Q&A Automation Tool
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Generate intelligent questions and get comprehensive answers from blog URLs using AI</p>
          
          {/* User Profile and Backend Status */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <UserProfile />
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-600">
                {backendConnected ? 'Backend Connected - Persistent Storage' : 'Local Storage Mode - Backend Unavailable'}
              </span>
              {!backendConnected && (
                <button
                  onClick={migrateLocalStorageToBackend}
                  className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Retry Connection
                </button>
              )}
            </div>
            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Configuration */}
          <Configuration
            questionProvider={questionProvider}
            setQuestionProvider={setQuestionProvider}
            answerProvider={answerProvider}
            setAnswerProvider={setAnswerProvider}
            questionModel={questionModel}
            setQuestionModel={setQuestionModel}
            answerModel={answerModel}
            setAnswerModel={setAnswerModel}
            answerMode={answerMode}
            setAnswerMode={setAnswerMode}
          />

          {/* Content Input */}
          <ContentInput
            blogContent={blogContent}
            setBlogContent={setBlogContent}
            blogUrl={blogUrl}
            setBlogUrl={setBlogUrl}
            sourceUrls={sourceUrls}
            setSourceUrls={setSourceUrls}
            crawlMode={crawlMode}
            setCrawlMode={setCrawlMode}
            crawledPages={crawledPages}
            setCrawledPages={setCrawledPages}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            onGenerateQuestions={generateQuestions}
            isGenerating={isGeneratingQuestions}
          />

          {/* Question Generation */}
          <div>
            {/* Question Selection */}
            <QuestionSelection
              questions={generatedQuestions}
              onToggleQuestion={toggleQuestion}
              onSelectAll={selectAllQuestions}
              onDeselectAll={deselectAllQuestions}
              onGenerateAnswers={generateAnswers}
              isGeneratingAnswers={isGeneratingAnswers}
              onCheckRelevantQuestions={checkRelevantQuestions}
              isCheckingRelevance={isCheckingRelevance}
              hasRelevantQuestions={relevantQuestions.length > 0}
            />
          </div>

          {/* Progress */}
          <ProgressSection
            progress={progress}
            status={status}
            statusType={statusType}
            isVisible={isGeneratingQuestions || isGeneratingAnswers || progress > 0}
          />

          {/* Answer Generation */}
          <div>
            {/* Results */}
            <Results
              qaData={qaData}
              onExportCSV={exportToCSV}
              onExportJSON={exportToJSON}
              onGenerateReport={generateReport}
              onSaveSession={saveCurrentSession}
              isVisible={qaData.length > 0}
              blogUrl={blogUrl}
              sourceUrls={sourceUrls}
              crawlMode={crawlMode}
              crawledPages={crawledPages}
              answerProvider={answerProvider}
              answerModel={answerModel}
            />

            {/* Statistics */}
            {qaData.length > 0 && (
              <Statistics
                totalQuestions={qaData.length}
                avgAccuracy={qaData.length > 0 ? qaData.reduce((sum, item) => sum + parseFloat(item.accuracy), 0) / qaData.length : 0}
                totalTokens={totalInputTokens + totalOutputTokens}
                totalCost={qaData.reduce((sum, qa) => sum + (qa.cost || 0), 0)}
                inputTokens={totalInputTokens}
                outputTokens={totalOutputTokens}
                inputCost={calculateCost(totalInputTokens, 0, answerModel)}
                outputCost={calculateCost(0, totalOutputTokens, answerModel)}
                isVisible={qaData.length > 0}
              />
            )}

            {/* Session Management */}
            <SessionManagement
              sessionName={sessionName}
              setSessionName={setSessionName}
              savedSessions={savedSessionsList}
              onLoadSession={loadSession}
              onSaveSession={saveCurrentSession}
              onDeleteSession={deleteSession}
              onClearAllSessions={clearAllSessions}
              onExportAllSessions={exportAllSessions}
              statusMessage={sessionStatus}
              statusType={sessionStatusType}
              selectedSessionId={selectedSessionId}
              setSelectedSessionId={setSelectedSessionId}
            />
          </div>
        </div>

        {/* History Button at Bottom */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowHistory(true)}
            className="px-6 py-3 bg-green-600 text-white text-lg rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            📚 View History
          </button>
          <p className="text-sm text-gray-600 mt-2">
            View and manage your question and answer generation history
          </p>
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

      {/* History Modal */}
      {showHistory && (
        <History
          questionSessions={questionSessions}
          answerSessions={answerSessions}
          onClose={() => setShowHistory(false)}
          questionProvider={questionProvider}
          questionModel={questionModel}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AppContent />
  );
}

export default App;