import { useState, useEffect } from 'react';
import { LogOut, User, BarChart3, FileText, History as HistoryIcon, DollarSign, Zap } from 'lucide-react';
import { ContentInput } from './components/ContentInput';
import { SessionManagement } from './components/SessionManagement';
import { Statistics } from './components/Statistics';
import { Login } from './components/Login';
import { useLocalStorage } from './hooks/useLocalStorage';
import { downloadFile } from './utils/fileUtils';
import { QAItem, SessionData, User as UserType } from './types';
import { useAuth } from './contexts/AuthContext';
import { calculateCost } from './utils/pricing';
import { History } from './components/History';
import { Configuration } from './components/Configuration';
import { apiService } from './services/apiService';

const SESSIONS_KEY = 'llm_qa_sessions';
const CURRENT_SESSION_KEY = 'llm_qa_current_session';

const SIDEBAR_ITEMS = [
  { label: 'Q&A Generation', icon: <Zap /> },
  { label: 'Sessions', icon: <FileText /> },
  { label: 'History', icon: <HistoryIcon /> },
  { label: 'Statistics', icon: <BarChart3 /> },
  { label: 'Cost Breakdown', icon: <DollarSign /> },
];

interface SidebarProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  onLogout: () => void;
  user: UserType | null;
}

function Sidebar({ activeTab, setActiveTab, onLogout, user }: SidebarProps) {
  return (
    <aside className="bg-black w-60 min-h-screen flex flex-col border-r border-genfuze-green/30">
      <div className="flex items-center gap-3 px-6 py-8 border-b border-genfuze-green/20">
        <div className="w-10 h-10 bg-gradient-to-r from-genfuze-green to-green-400 rounded-xl flex items-center justify-center">
          <Zap className="w-6 h-6 text-black" />
        </div>
        <span className="text-2xl font-extrabold text-genfuze-green tracking-wide">Genfuze.ai</span>
      </div>
      <nav className="flex-1 flex flex-col gap-1 mt-6 px-2">
        {SIDEBAR_ITEMS.map((item, idx) => (
          <button
            key={item.label}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200
              ${activeTab === idx ? 'bg-genfuze-green/20 text-genfuze-green border-l-4 border-genfuze-green' : 'text-white hover:bg-genfuze-green/10'}`}
            onClick={() => setActiveTab(idx)}
          >
            <span className={`w-5 h-5 ${activeTab === idx ? 'text-genfuze-green' : 'text-white'}`}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto px-6 py-6 border-t border-genfuze-green/20 flex items-center gap-3">
        <User className="w-6 h-6 text-genfuze-green" />
        <div className="flex-1">
          <div className="font-bold text-white">{user?.displayName || user?.name || 'User'}</div>
          <div className="text-xs text-genfuze-green">{user?.email}</div>
        </div>
        <button className="bg-black border border-genfuze-green text-genfuze-green px-3 py-2 rounded hover:bg-genfuze-green hover:text-black transition-all" onClick={onLogout}>
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="w-full bg-black border-b border-genfuze-green/20 flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-genfuze-green to-green-400 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-black" />
        </div>
        <span className="text-xl font-extrabold text-genfuze-green tracking-wide">Genfuze.ai</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Add user avatar or settings here if needed */}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-black border-t border-genfuze-green/20 text-center text-genfuze-green py-4 text-sm">
      © {new Date().getFullYear()} Genfuze.ai. All rights reserved.
    </footer>
  );
}

function App() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useLocalStorage<SessionData[]>(SESSIONS_KEY, []);
  const [currentSession, setCurrentSession] = useLocalStorage<SessionData | null>(CURRENT_SESSION_KEY, null);
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [qaContent, setQaContent] = useState(''); // Store content used for Q&A
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');

  // Add answer generation state
  const [answerLoading, setAnswerLoading] = useState<{ [idx: number]: boolean }>({});

  // Defensive: Ensure sessions is always an array
  useEffect(() => {
    if (!Array.isArray(sessions)) {
      setSessions([]);
    }
  }, [sessions, setSessions]);

  // Initialize default session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      const defaultSession: SessionData = {
        id: 'default',
        name: 'Default Session',
        type: 'question',
        timestamp: new Date().toISOString(),
        model: 'gemini-pro',
        blogContent: '',
        qaData: [],
        totalInputTokens: 0,
        totalOutputTokens: 0,
        statistics: {
          totalQuestions: 0,
          avgAccuracy: '0',
          avgCitationLikelihood: '0',
          totalCost: '0'
        }
      };
      setSessions([defaultSession]);
      setCurrentSession(defaultSession);
    }
  }, [sessions, setSessions, setCurrentSession]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-genfuze-green mx-auto mb-4"></div>
          <p className="text-genfuze-green font-medium">Loading Genfuze.ai...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGenerateQA = (items: QAItem[]) => {
    setQaItems(items);
    // Update current session with new QA items
    if (currentSession) {
      const totalInputTokens = items.reduce((sum, item) => sum + item.inputTokens, 0);
      const totalOutputTokens = items.reduce((sum, item) => sum + item.outputTokens, 0);
      const totalCost = calculateCost(totalInputTokens, totalOutputTokens, currentSession.model);
      
      const updatedSession = {
        ...currentSession,
        qaData: [...currentSession.qaData, ...items],
        statistics: {
          totalQuestions: currentSession.qaData.length + items.length,
          avgAccuracy: '85', // Placeholder
          avgCitationLikelihood: '75', // Placeholder
          totalCost: totalCost.toString()
        }
      };
      setCurrentSession(updatedSession);
      setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
    }
  };

  // Generate answer for a question
  const handleGenerateAnswer = async (idx: number) => {
    setAnswerLoading((prev) => ({ ...prev, [idx]: true }));
    try {
      const item = qaItems[idx];
      const provider = selectedProvider;
      const model = selectedModel === 'gemini-pro' ? 'gemini-1.5-flash' : selectedModel;
      // 1. Generate answer
      const result = await apiService.generateAnswers({
        content: qaContent,
        questions: [item.question],
        provider,
        model,
      });
      const answerObj = result.answers[0] || {};
      const answer = answerObj.answer || '';
      const inputTokens = answerObj.inputTokens || 0;
      const outputTokens = answerObj.outputTokens || 0;
      // 2. Call metrics endpoints in parallel
      const [semantic, vector, citation, accuracy] = await Promise.all([
        apiService.calculateConfidence(item.question, qaContent, provider, model).catch(() => null),
        apiService.calculateVectorSimilarities([{ question: item.question, answer }], qaContent).catch(() => null),
        apiService.calculateCitationLikelihood({ answer, content: qaContent, provider, model }).catch(() => null),
        apiService.calculateAccuracy({ answer, content: qaContent, provider, model }).catch(() => null),
      ]);
      // 3. Calculate cost (example: Gemini 1.5 Flash pricing)
      let cost = 0;
      if (model === 'gemini-1.5-flash') {
        cost = (inputTokens * 0.000075 + outputTokens * 0.0003) / 1000;
      }
      // 4. Update qaItems with answer and metrics
      setQaItems((prev) => prev.map((q, i) => i === idx ? {
        ...q,
        answer,
        inputTokens,
        outputTokens,
        cost,
        semanticRelevance: semantic?.confidence?.toString() ?? '-',
        vectorSimilarity: (vector?.similarities && vector.similarities[0] && typeof vector.similarities[0].similarity !== 'undefined') ? vector.similarities[0].similarity.toString() : '-',
        citationLikelihood: citation?.likelihood?.toString() ?? (citation?.citationLikelihood?.toString() ?? '-'),
        accuracy: accuracy?.accuracy?.toString() ?? '-',
      } : q));

      // Save Q&A with metrics to current session and sessions (for History)
      if (currentSession) {
        const updatedQaData = qaItems.map((q, i) => i === idx ? {
          ...q,
          answer,
          inputTokens,
          outputTokens,
          cost,
          semanticRelevance: semantic?.confidence?.toString() ?? '-',
          vectorSimilarity: (vector?.similarities && vector.similarities[0] && typeof vector.similarities[0].similarity !== 'undefined') ? vector.similarities[0].similarity.toString() : '-',
          citationLikelihood: citation?.likelihood?.toString() ?? (citation?.citationLikelihood?.toString() ?? '-'),
          accuracy: accuracy?.accuracy?.toString() ?? '-',
        } : q);
        const updatedSession = {
          ...currentSession,
          qaData: updatedQaData,
        };
        setCurrentSession(updatedSession);
        setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
      }
    } catch (err) {
      const errorMsg = (err as any)?.message || err;
      alert('Failed to generate answer: ' + errorMsg);
    } finally {
      setAnswerLoading((prev) => ({ ...prev, [idx]: false }));
    }
  };

  // Toggle selection for a question
  const handleSelectQuestion = (idx: number) => {
    setSelectedQuestions((prev) => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  // Select all questions
  const handleSelectAll = () => {
    setSelectedQuestions(qaItems.map((_, idx) => idx));
  };

  // Deselect all questions
  const handleDeselectAll = () => {
    setSelectedQuestions([]);
  };

  // Generate answers for all selected questions
  const handleGenerateAnswersForSelected = async () => {
    for (const idx of selectedQuestions) {
      if (!qaItems[idx].answer) {
        await handleGenerateAnswer(idx);
      }
    }
  };

  const getTotalCost = () => {
    if (!currentSession?.qaData) return 0;
    const totalInputTokens = currentSession.qaData.reduce((sum, item) => sum + item.inputTokens, 0);
    const totalOutputTokens = currentSession.qaData.reduce((sum, item) => sum + item.outputTokens, 0);
    return calculateCost(totalInputTokens, totalOutputTokens, currentSession.model);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} user={user} />
      <main className="flex-1 flex flex-col">
        <Topbar />
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 0 && (
            <div className="space-y-8">
              <Configuration 
                provider={selectedProvider}
                model={selectedModel}
                onProviderChange={setSelectedProvider}
                onModelChange={setSelectedModel}
              />
              {/* Question count dropdown */}
              <div className="mb-4 flex items-center gap-4">
                <label htmlFor="questionCount" className="text-genfuze-green font-semibold">Number of Questions:</label>
                <select
                  id="questionCount"
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="bg-gray-900 border border-genfuze-green/40 text-genfuze-green font-bold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-genfuze-green"
                >
                  {[3, 5, 7, 10, 15, 20].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <ContentInput 
                onGenerateQA={(items, content) => { setQaItems(items); setQaContent(content); }}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                provider={selectedProvider}
                model={selectedModel === 'gemini-pro' ? 'gemini-1.5-flash' : selectedModel}
                questionCount={questionCount}
              />
              {/* Q&A Display Section */}
              {qaItems.length > 0 && (
                <div className="card mt-8 p-6 bg-black/80 border border-genfuze-green/60 shadow-xl">
                  <h3 className="text-xl font-bold text-genfuze-green mb-4">Generated Questions & Answers</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      className="bg-gradient-to-r from-genfuze-green to-green-400 text-black font-bold px-5 py-2 rounded-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleGenerateAnswersForSelected}
                      disabled={selectedQuestions.length === 0}
                    >
                      Generate Responses for Selected
                    </button>
                    <button
                      className="bg-black border border-genfuze-green text-genfuze-green font-bold px-4 py-2 rounded-lg hover:bg-genfuze-green hover:text-black transition-all duration-200"
                      onClick={handleSelectAll}
                    >Select All</button>
                    <button
                      className="bg-black border border-genfuze-green text-genfuze-green font-bold px-4 py-2 rounded-lg hover:bg-genfuze-green hover:text-black transition-all duration-200"
                      onClick={handleDeselectAll}
                    >Deselect All</button>
                  </div>
                  <ul className="space-y-6">
                    {qaItems.map((item, idx) => (
                      <li key={idx} className="p-4 rounded-lg bg-gray-900/60 border border-genfuze-green/20">
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(idx)}
                            onChange={() => handleSelectQuestion(idx)}
                            className="mr-2 accent-genfuze-green"
                          />
                          <div className="font-semibold text-genfuze-green">Q{idx + 1}: {item.question}</div>
                        </div>
                        {item.answer ? (
                          <div className="text-white mb-2"><span className="font-bold text-genfuze-green">A:</span> {item.answer}</div>
                        ) : (
                          <button
                            className="bg-gradient-to-r from-genfuze-green to-green-400 text-black font-bold px-5 py-2 rounded-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleGenerateAnswer(idx)}
                            disabled={answerLoading[idx]}
                          >
                            {answerLoading[idx] ? 'Generating Answer...' : 'Generate Response'}
                          </button>
                        )}
                        {/* Basic and advanced metrics */}
                        <div className="text-xs text-gray-400 mt-2 flex gap-4 flex-wrap">
                          <span>Input Tokens: {item.inputTokens || 0}</span>
                          <span>Output Tokens: {item.outputTokens || 0}</span>
                          <span>Cost: ${item.cost || 0}</span>
                          <span>Semantic Relevance: {item.semanticRelevance ?? '-'}</span>
                          <span>Vector Similarity: {item.vectorSimilarity ?? '-'}</span>
                          <span>Citation Likelihood: {item.citationLikelihood ?? '-'}</span>
                          <span>Accuracy: {item.accuracy ?? '-'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {activeTab === 1 && (
            <SessionManagement />
          )}
          {activeTab === 2 && (
            <History 
              qaItems={currentSession?.qaData || []}
              onExport={downloadFile}
            />
          )}
          {activeTab === 3 && (
            <Statistics 
              sessions={sessions}
              currentSession={currentSession}
            />
          )}
          {activeTab === 4 && (
            <div className="max-w-4xl mx-auto">
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 text-genfuze-green">Cost Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-genfuze-green/20">
                    <div className="text-3xl font-bold text-genfuze-green mb-2">
                      ${getTotalCost().toFixed(2)}
                    </div>
                    <div className="text-gray-300">Total Cost</div>
                  </div>
                  <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-genfuze-green/20">
                    <div className="text-3xl font-bold text-genfuze-green mb-2">
                      {currentSession?.qaData?.length || 0}
                    </div>
                    <div className="text-gray-300">Questions Generated</div>
                  </div>
                  <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-genfuze-green/20">
                    <div className="text-3xl font-bold text-genfuze-green mb-2">
                      ${((currentSession?.qaData?.length || 0) * 0.01).toFixed(2)}
                    </div>
                    <div className="text-gray-300">Estimated Monthly</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default App;