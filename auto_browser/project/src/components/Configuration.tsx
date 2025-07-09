import React, { useState, useEffect } from 'react';
import { Settings, Bot, HelpCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import { LLMProvidersResponse, LLMModel } from '../types';

interface ConfigurationProps {
  questionProvider: string;
  setQuestionProvider: (provider: string) => void;
  answerProvider: string;
  setAnswerProvider: (provider: string) => void;
  questionModel: string;
  setQuestionModel: (model: string) => void;
  answerModel: string;
  setAnswerModel: (model: string) => void;
  answerMode: 'api' | 'web';
  setAnswerMode: (mode: 'api' | 'web') => void;
}

export function Configuration({ 
  questionProvider, 
  setQuestionProvider,
  answerProvider,
  setAnswerProvider,
  questionModel,
  setQuestionModel,
  answerModel,
  setAnswerModel,
  answerMode,
  setAnswerMode
}: ConfigurationProps) {
  const [llmData, setLlmData] = useState<LLMProvidersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLLMProviders();
  }, []);

  useEffect(() => {
    if (answerMode === 'web' && !answerProvider) {
      setAnswerProvider('gemini');
    }
  }, [answerMode, answerProvider, setAnswerProvider]);

  const loadLLMProviders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getLLMProviders();
      setLlmData(data);
      
      // Set default providers if none selected
      if (!questionProvider && data.configuredProviders.length > 0) {
        const questionProviders = data.configuredProviders.filter(p => p !== 'serper');
        if (questionProviders.length > 0) {
          setQuestionProvider(questionProviders[0]);
          // Set default model for question provider
          const questionModels = data.availableModels[questionProviders[0] as keyof typeof data.availableModels] || [];
          if (questionModels.length > 0) {
            setQuestionModel(questionModels[0].value);
          }
        }
      }
      if (!answerProvider && data.configuredProviders.length > 0) {
        setAnswerProvider(data.configuredProviders[0]);
        // Set default model for answer provider
        const answerModels = data.availableModels[data.configuredProviders[0] as keyof typeof data.availableModels] || [];
        if (answerModels.length > 0) {
          setAnswerModel(answerModels[0].value);
        }
      }
    } catch (err) {
      setError('Failed to load LLM providers. Please check your backend connection.');
      console.error('Error loading LLM providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'gemini': return 'Gemini (Google)';
      case 'openai': return 'ChatGPT (OpenAI)';
      case 'perplexity': return 'Perplexity';
      case 'serper': return 'Google Serper (Search)';
      default: return provider;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini': return '🔷';
      case 'openai': return '🤖';
      case 'perplexity': return '🔍';
      case 'serper': return '🔎';
      default: return '🤖';
    }
  };

  const getModelsForProvider = (provider: string): LLMModel[] => {
    if (!llmData) return [];
    return llmData.availableModels[provider as keyof typeof llmData.availableModels] || [];
  };

  // Filter providers for question generation (exclude Serper)
  const getQuestionProviders = () => {
    if (!llmData) return [];
    return llmData.configuredProviders.filter(provider => provider !== 'serper');
  };

  // All providers for answer generation (including Serper)
  const getAnswerProviders = () => {
    if (!llmData) return [];
    return llmData.configuredProviders;
  };

  const WEB_PROVIDERS = [
    { value: 'gemini', label: 'Gemini (Google)' },
    { value: 'perplexity', label: 'Perplexity' },
    { value: 'claude', label: 'Claude' },
    { value: 'chatgpt', label: 'ChatGPT (OpenAI)' },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Configuration</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading LLM providers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Configuration</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadLLMProviders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!llmData || llmData.configuredProviders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Configuration</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-yellow-600 mb-4">No LLM providers configured in backend</p>
          <p className="text-gray-600 text-sm">
            Please configure API keys for Gemini, OpenAI, Perplexity, or Google Serper in your backend environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Configuration</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Question Generation Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Question Generation</h3>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                LLM provider and model for generating questions
              </div>
            </div>
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Bot className="w-4 h-4" />
              Question Provider:
            </label>
            <select
              value={questionProvider}
              onChange={(e) => {
                setQuestionProvider(e.target.value);
                // Reset model when provider changes
                const models = getModelsForProvider(e.target.value);
                if (models.length > 0) {
                  setQuestionModel(models[0].value);
                }
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              {getQuestionProviders().map(provider => (
                <option key={provider} value={provider}>
                  {getProviderIcon(provider)} {getProviderLabel(provider)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Bot className="w-4 h-4" />
              Question Model:
            </label>
            <select
              value={questionModel}
              onChange={(e) => setQuestionModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              {getModelsForProvider(questionProvider).map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Answer Generation Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Answer Generation</h3>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                LLM provider and model for generating answers
              </div>
            </div>
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Bot className="w-4 h-4" />
              Answer Generation Mode:
            </label>
            <select
              value={answerMode}
              onChange={(e) => setAnswerMode(e.target.value as 'api' | 'web')}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="api">🔑 API Key (Fast)</option>
              <option value="web">🌐 Web Browser Automation (No API Key Required)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {answerMode === 'api' 
                ? 'Uses API keys for faster response' 
                : 'Uses browser automation - may take longer but no API key needed'
              }
            </p>
          </div>

          {answerMode === 'web' ? (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Bot className="w-4 h-4" />
                Web Browser Provider:
              </label>
              <select
                value={answerProvider}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAnswerProvider(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {WEB_PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Model selection is not available for Web Browser Automation. The provider's default model will be used.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Bot className="w-4 h-4" />
                  Answer Provider:
                </label>
                <select
                  value={answerProvider}
                  onChange={(e) => {
                    setAnswerProvider(e.target.value);
                    // Reset model when provider changes
                    const models = getModelsForProvider(e.target.value);
                    if (models.length > 0) {
                      setAnswerModel(models[0].value);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {getAnswerProviders().map(provider => (
                    <option key={provider} value={provider}>
                      {getProviderIcon(provider)} {getProviderLabel(provider)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Bot className="w-4 h-4" />
                  Answer Model:
                </label>
                <select
                  value={answerModel}
                  onChange={(e) => setAnswerModel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {getModelsForProvider(answerProvider).map(model => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Multi-LLM Support</h4>
            <p className="text-sm text-blue-800">
              You can now use different LLM providers (Gemini, ChatGPT, Perplexity, Google Serper) for question and answer generation. 
              Google Serper is available for answer generation only and provides real-time web search results. 
              Configured providers: {llmData.configuredProviders.map(p => getProviderLabel(p)).join(', ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}