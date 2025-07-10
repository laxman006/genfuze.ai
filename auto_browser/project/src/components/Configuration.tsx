import React from 'react';
import { Settings, Bot, HelpCircle } from 'lucide-react';

interface ConfigurationProps {
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
}

export function Configuration({ provider, model, onProviderChange, onModelChange }: ConfigurationProps) {
  return (
    <div className="card mb-8 backdrop-blur-md bg-black/80 border border-genfuze-green/60 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-6 h-6 text-genfuze-green animate-pulse" />
        <h2 className="text-2xl font-bold text-genfuze-green">Configuration</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Question Generation Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white">Question Generation</h3>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                LLM provider and model for generating questions
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
              <select value={provider} onChange={e => onProviderChange(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-genfuze-green">
                <option value="gemini">Gemini (Google)</option>
                <option value="openai">ChatGPT (OpenAI)</option>
                <option value="perplexity">Perplexity</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
              <select value={model} onChange={e => onModelChange(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-genfuze-green">
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Answer Generation Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white">Answer Generation</h3>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                LLM provider and model for generating answers
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
              <select className="w-full bg-gray-800/50 border border-gray-600/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-genfuze-green">
                <option value="gemini">Gemini (Google)</option>
                <option value="openai">ChatGPT (OpenAI)</option>
                <option value="perplexity">Perplexity</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
              <select className="w-full bg-gray-800/50 border border-gray-600/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-genfuze-green">
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}