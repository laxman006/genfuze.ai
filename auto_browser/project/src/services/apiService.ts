import { SessionData, LLMProvidersResponse, QuestionGenerationRequest, QuestionGenerationResponse, AnswerGenerationRequest, AnswerGenerationResponse } from '../types';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // LLM API Methods
  async getLLMProviders(): Promise<LLMProvidersResponse> {
    return this.request('/llm/providers');
  }

  async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    return this.request('/llm/generate-questions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateAnswers(request: AnswerGenerationRequest): Promise<AnswerGenerationResponse> {
    return this.request('/llm/generate-answers', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateAnswersWeb(request: AnswerGenerationRequest): Promise<AnswerGenerationResponse> {
    return this.request('/llm/generate-answers-web', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async calculateConfidence(question: string, content: string, provider: string, model: string): Promise<{
    success: boolean;
    confidence: number;
    reasoning: string;
    inputTokens: number;
    outputTokens: number;
    provider: string;
    model: string;
  }> {
    return this.request('/llm/calculate-confidence', {
      method: 'POST',
      body: JSON.stringify({ question, content, provider, model }),
    });
  }

  // Compare two questions for similarity
  async compareQuestions(question1: string, question2: string, provider: string, model: string): Promise<{
    success: boolean;
    similarity: number;
    reasoning: string;
    inputTokens: number;
    outputTokens: number;
    provider: string;
    model: string;
  }> {
    return this.request('/llm/compare-questions', {
      method: 'POST',
      body: JSON.stringify({ question1, question2, provider, model }),
    });
  }

  // Save a session to the backend
  async saveSession(sessionData: SessionData): Promise<{ success: boolean; sessionId: string; message: string }> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Get all sessions of a specific type
  async getSessionsByType(type: 'question' | 'answer'): Promise<{ success: boolean; sessions: SessionData[]; count: number }> {
    return this.request(`/sessions/${type}`);
  }

  // Get sessions with filters
  async getSessionsWithFilters(
    type: 'question' | 'answer',
    filters: {
      fromDate?: string;
      toDate?: string;
      llmProvider?: string;
      llmModel?: string;
      blogLink?: string;
      search?: string;
    }
  ): Promise<{ 
    success: boolean; 
    sessions: SessionData[]; 
    totalCount: number;
    filters: any;
  }> {
    const params = new URLSearchParams();
    
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.llmProvider) params.append('llmProvider', filters.llmProvider);
    if (filters.llmModel) params.append('llmModel', filters.llmModel);
    if (filters.blogLink) params.append('blogLink', filters.blogLink);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `/sessions/${type}?${queryString}` : `/sessions/${type}`;
    
    return this.request(url);
  }

  // Get sessions by date range
  async getSessionsByDateRange(
    type: 'question' | 'answer', 
    fromDate: string, 
    toDate: string
  ): Promise<{ success: boolean; sessions: SessionData[]; count: number; fromDate: string; toDate: string }> {
    const params = new URLSearchParams({ fromDate, toDate });
    return this.request(`/sessions/${type}/range?${params}`);
  }

  // Get a specific session by ID
  async getSessionById(id: string): Promise<{ success: boolean; session: SessionData }> {
    return this.request(`/sessions/question/${id}`); // We'll try both types if needed
  }

  // Delete a session
  async deleteSession(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // Get session statistics
  async getSessionStats(type: 'question' | 'answer'): Promise<{
    success: boolean;
    stats: {
      totalSessions: number;
      totalCost: string;
      totalQuestions: number;
      averageQuestionsPerSession: string;
    };
  }> {
    return this.request(`/stats/${type}`);
  }

  // Bulk save sessions
  async bulkSaveSessions(sessions: SessionData[]): Promise<{
    success: boolean;
    results: Array<{ id: string; success: boolean; savedId?: string; error?: string }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    return this.request('/sessions/bulk', {
      method: 'POST',
      body: JSON.stringify({ sessions }),
    });
  }

  // Export sessions
  async exportSessions(type: 'question' | 'answer', format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/${type}?format=${format}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }

  // Migrate localStorage data to backend
  async migrateFromLocalStorage(localStorageSessions: Record<string, SessionData>): Promise<{
    success: boolean;
    results: Array<{ id: string; success: boolean; error?: string }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const sessions = Object.values(localStorageSessions);
    return this.bulkSaveSessions(sessions);
  }

  // Check for relevant questions across different LLM providers
  async checkQuestionRelevance(
    sourceUrls: string[] | undefined,
    blogUrl: string | undefined,
    questionText: string,
    currentProvider: string,
    currentModel: string
  ): Promise<{
    success: boolean;
    relevantQuestions: Array<{
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
    }>;
    totalChecked: number;
    message: string;
  }> {
    return this.request('/questions/check-relevance', {
      method: 'POST',
      body: JSON.stringify({
        sourceUrls,
        blogUrl,
        questionText,
        currentProvider,
        currentModel
      }),
    });
  }

  // Calculate citation likelihood using any LLM provider
  async calculateCitationLikelihood({ answer, content, provider, model }: { answer: string, content: string, provider: string, model: string }) {
    console.log('[Frontend] Calling /api/citation-likelihood/calculate with:', { answer, content, provider, model });
    const res = await fetch(`${API_BASE_URL}/citation-likelihood/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify({ answer, content, provider, model })
    });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error('[Frontend] Failed to parse JSON from /api/citation-likelihood/calculate:', e);
      throw new Error('Failed to parse JSON from /api/citation-likelihood/calculate');
    }
    console.log('[Frontend] /api/citation-likelihood/calculate response:', json);
    if (!res.ok) throw new Error('Failed to calculate citation likelihood: ' + (json.error || res.status));
    return json;
  }

  // Calculate accuracy using any LLM provider
  async calculateAccuracy({ answer, content, provider, model }: { answer: string, content: string, provider: string, model: string }) {
    console.log('[Frontend] Calling /api/accuracy/calculate with:', { answer, content, provider, model });
    const res = await fetch(`${API_BASE_URL}/accuracy/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify({ answer, content, provider, model })
    });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error('[Frontend] Failed to parse JSON from /api/accuracy/calculate:', e);
      throw new Error('Failed to parse JSON from /api/accuracy/calculate');
    }
    console.log('[Frontend] /api/accuracy/calculate response:', json);
    if (!res.ok) throw new Error('Failed to calculate accuracy: ' + (json.error || res.status));
    return json;
  }

  // Calculate Gemini accuracy
  async calculateGeminiAccuracy({ answer, content, model }: { answer: string, content: string, model: string }) {
    console.log('[Frontend] Calling /api/accuracy/gemini with:', { answer, content, model });
    const res = await fetch(`${API_BASE_URL}/accuracy/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify({ answer, content, model })
    });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error('[Frontend] Failed to parse JSON from /api/accuracy/gemini:', e);
      throw new Error('Failed to parse JSON from /api/accuracy/gemini');
    }
    console.log('[Frontend] /api/accuracy/gemini response:', json);
    if (!res.ok) throw new Error('Failed to calculate Gemini accuracy: ' + (json.error || res.status));
    return json;
  }

  async calculateGeoScoreBackend(params: {
    accuracy: number;
    question: string;
    answer: string;
    importantQuestions: string[];
    allConfidences: number[];
    sourceUrl: string;
    content: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/geo-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify(params)
    });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error('[Frontend] Failed to parse JSON from /api/geo-score:', e);
      throw new Error('Failed to parse JSON from /api/geo-score');
    }
    console.log('[Frontend] /api/geo-score response:', json);
    if (!res.ok) throw new Error('Failed to calculate GEO score: ' + (json.error || res.status));
    return json;
  }

  // Vector embedding methods
  async generateEmbedding(text: string, type: 'question' | 'answer' = 'answer') {
    console.log('[Frontend] Calling /api/embeddings/generate with:', { text: text.substring(0, 100) + '...', type });
    const res = await fetch(`${API_BASE_URL}/embeddings/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify({ text, type })
    });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error('[Frontend] Failed to parse JSON from /api/embeddings/generate:', e);
      throw new Error('Failed to parse JSON from /api/embeddings/generate');
    }
    console.log('[Frontend] /api/embeddings/generate response:', json);
    if (!res.ok) throw new Error('Failed to generate embedding: ' + (json.error || res.status));
    return json;
  }

  async searchSimilarQuestions(question: string, limit: number = 10, threshold: number = 0.7) {
    console.log('[Frontend] Calling /api/embeddings/search/questions with:', { question: question.substring(0, 100) + '...', limit, threshold });
    const res = await fetch(`${API_BASE_URL}/embeddings/search/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify({ question, limit, threshold })
    });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error('[Frontend] Failed to parse JSON from /api/embeddings/search/questions:', e);
      throw new Error('Failed to parse JSON from /api/embeddings/search/questions');
    }
    console.log('[Frontend] /api/embeddings/search/questions response:', json);
    if (!res.ok) throw new Error('Failed to search similar questions: ' + (json.error || res.status));
    return json;
  }

  async searchSimilarAnswers(answer: string, limit: number = 10, threshold: number = 0.7) {
    console.log('[Frontend] Calling /api/embeddings/search/answers with:', { answer: answer.substring(0, 100) + '...', limit, threshold });
    const res = await fetch(`${API_BASE_URL}/embeddings/search/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify({ answer, limit, threshold })
    });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error('[Frontend] Failed to parse JSON from /api/embeddings/search/answers:', e);
      throw new Error('Failed to parse JSON from /api/embeddings/search/answers');
    }
    console.log('[Frontend] /api/embeddings/search/answers response:', json);
    if (!res.ok) throw new Error('Failed to search similar answers: ' + (json.error || res.status));
    return json;
  }

  // Calculate vector similarities for Q&A pairs
  async calculateVectorSimilarities(qaData: Array<{ question: string; answer: string }>, content?: string) {
    console.log('[Frontend] Calling /api/embeddings/calculate-similarities with:', { qaCount: qaData.length, hasContent: !!content });
    const res = await fetch(`${API_BASE_URL}/embeddings/calculate-similarities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify({ qaData, content })
    });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error('[Frontend] Failed to parse JSON from /api/embeddings/calculate-similarities:', e);
      throw new Error('Failed to parse JSON from /api/embeddings/calculate-similarities');
    }
    console.log('[Frontend] /api/embeddings/calculate-similarities response:', json);
    if (!res.ok) throw new Error('Failed to calculate vector similarities: ' + (json.error || res.status));
    return json;
  }

  // GEO Fanout Density Analysis
  // async trackGEOFanoutDensity(params: {
  //   mainQuestion: string;
  //   content: string;
  //   provider: string;
  //   model: string;
  // }) {
  //   console.log('[Frontend] Calling /api/geo-fanout/track with:', { 
  //     mainQuestion: params.mainQuestion.substring(0, 100) + '...', 
  //     provider: params.provider, 
  //     model: params.model 
  //   });
  //   const res = await fetch(`${API_BASE_URL}/geo-fanout/track`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
  //     },
  //     body: JSON.stringify(params)
  //   });
  //   let json;
  //   try {
  //     json = await res.json();
  //   } catch (e) {
  //     console.error('[Frontend] Failed to parse JSON from /api/geo-fanout/track:', e);
  //     throw new Error('Failed to parse JSON from /api/geo-fanout/track');
  //   }
  //   console.log('[Frontend] /api/geo-fanout/track response:', json);
  //   if (!res.ok) throw new Error('Failed to track GEO fanout density: ' + (json.error || res.status));
  //   return json;
  // }

  async getGEOFanoutAnalysis(sessionId?: string) {
    const url = sessionId ? `${API_BASE_URL}/geo-fanout/analysis?sessionId=${sessionId}` : `${API_BASE_URL}/geo-fanout/analysis`;
    console.log('[Frontend] Calling GEO fanout analysis:', url);
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      }
    });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error('[Frontend] Failed to parse JSON from GEO fanout analysis:', e);
      throw new Error('Failed to parse JSON from GEO fanout analysis');
    }
    console.log('[Frontend] GEO fanout analysis response:', json);
    if (!res.ok) throw new Error('Failed to get GEO fanout analysis: ' + (json.error || res.status));
    return json;
  }
}

export const apiService = new ApiService(); 