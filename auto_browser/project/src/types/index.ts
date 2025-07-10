// GEO Fanout Density Types
// export interface FanoutQuery {
//   query: string;
//   aspect: string;
//   priority: 'high' | 'medium' | 'low';
// }

// export interface FanoutResult {
//   query: string;
//   aspect: string;
//   priority: 'high' | 'medium' | 'low';
//   answer: string;
//   inputTokens: number;
//   outputTokens: number;
//   timestamp: string;
//   error?: string;
// }

export interface ContentSnippet {
  text: string;
  similarity: number;
  relevance: 'high' | 'medium' | 'low';
}

export interface AttributionAnalysis {
  query: string;
  isFromContent: boolean;
  attributionScore: number;
  confidence: 'very_high' | 'high' | 'medium' | 'low';
  reasoning: string;
  contentSnippets: ContentSnippet[];
}

export interface DensityMetrics {
  totalQueries: number;
  contentAttributed: number;
  externalAnswers: number;
  fanoutDensity: number;
  averageAttributionScore: number;
  coverageScore: number;
  qualityDistribution: {
    very_high: number;
    high: number;
    medium: number;
    low: number;
  };
  aspectCoverage: {
    [aspect: string]: {
      total: number;
      fromContent: number;
    };
  };
}

// export interface GEOFanoutAnalysis {
//   success: boolean;
//   mainQuestion: string;
//   fanoutQueries: FanoutQuery[];
//   fanoutResults: FanoutResult[];
//   attributionAnalysis: AttributionAnalysis[];
//   densityMetrics: DensityMetrics;
//   summary: {
//     totalFanoutQueries: number;
//     contentAttributedAnswers: number;
//     externalAnswers: number;
//     averageAttributionScore: number;
//     fanoutDensity: number;
//   };
// }

export interface QAItem {
  question: string;
  answer: string;
  accuracy: string | null;
  sentiment: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  geoScore: number;
  citationLikelihood: number | null;
  semanticRelevance?: string | null;
  vectorSimilarity?: string | null;
  fanoutAnalysis?: GEOFanoutAnalysis;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  selected: boolean;
  confidence?: number; // Confidence score (0-100) - relevance only
  confidenceReasoning?: string;
  outputTokens?: number;
  cost?: number;
}

export interface SessionData {
  id: string;
  name: string;
  type: 'question' | 'answer'; // NEW: session type
  timestamp: string;
  model: string;
  questionProvider?: string; // Add provider fields
  answerProvider?: string;
  questionModel?: string;
  answerModel?: string;
  blogContent: string;
  blogUrl?: string; // Legacy single URL field for backward compatibility
  sourceUrls?: string[]; // New field for multiple URLs
  crawlMode?: 'single' | 'website'; // New field for crawl mode
  crawledPages?: string[]; // New field for crawled pages
  qaData: QAItem[];
  totalInputTokens: number;
  totalOutputTokens: number;
  statistics: {
    totalQuestions: number;
    avgAccuracy: string;
    avgCitationLikelihood: string;
    totalCost: string;
  };
  userId?: string; // Add user ID for multi-tenant support
  // Legacy API key fields for backward compatibility
  questionApiKey?: string;
  answerApiKey?: string;
}

export interface ApiResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface ModelPricing {
  input: number;
  output: number;
}

export interface ConfidenceStats {
  average: number;
  min: number;
  max: number;
  distribution: {
    high: number; // 80-100
    medium: number; // 50-79
    low: number; // 0-49
  };
}

export interface HighConfidenceQuestionResult {
  questions: string[];
  confidences: number[];
  attempts: number;
  stats: ConfidenceStats;
}

// Microsoft Entra ID Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  displayName: string;
  tenantId: string;
  roles: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
}

// API Key Configuration Types
export interface ApiKeyConfig {
  questionApiKey: string;
  answerApiKey: string;
  model: string;
}

export interface ApiKeyUsage {
  questionApiKey: string;
  answerApiKey: string;
  questionModel: string;
  answerModel: string;
}

// Multi-LLM Types
export interface LLMProvider {
  name: string;
  label: string;
  configured: boolean;
}

export interface LLMModel {
  value: string;
  label: string;
  pricing: {
    input: number;
    output: number;
  };
}

export interface LLMConfig {
  provider: string;
  model: string;
}

export interface LLMProvidersResponse {
  success: boolean;
  configuredProviders: string[];
  availableModels: {
    gemini: LLMModel[];
    openai: LLMModel[];
    perplexity: LLMModel[];
    serper: LLMModel[];
  };
}

export interface QuestionGenerationRequest {
  content: string;
  questionCount: number;
  provider: string;
  model: string;
}

export interface QuestionGenerationResponse {
  success: boolean;
  questions: string[];
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AnswerGenerationRequest {
  content: string;
  questions: string[];
  provider?: string;
  answerProvider?: string;
  model: string;
}

export interface AnswerGenerationResponse {
  success: boolean;
  answers: Array<{
    question: string;
    answer: string;
    inputTokens: number;
    outputTokens: number;
    provider: string;
    model: string;
  }>;
  provider: string;
  model: string;
  totalInputTokens: number;
  totalOutputTokens: number;
}