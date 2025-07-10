import React, { useState } from 'react';
import { FileText, Zap, Loader2 } from 'lucide-react';
import { QAItem } from '../types';
import { apiService } from '../services/apiService';

interface ContentInputProps {
  onGenerateQA: (items: QAItem[], content: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  provider: string;
  model: string;
  questionCount: number;
}

export function ContentInput({ onGenerateQA, isProcessing, setIsProcessing, provider, model, questionCount }: ContentInputProps) {
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const handleGenerateQA = async () => {
    if (!content.trim()) {
      alert('Please enter some content first');
      return;
    }

    setIsProcessing(true);
    try {
      // Call backend to generate questions
      const result = await apiService.generateQuestions({ content, questionCount, provider, model });
      // Map backend response to QAItem[]
      const qaItems: QAItem[] = result.questions.map((q: string) => ({
        question: q,
        answer: '',
        accuracy: '',
        sentiment: '',
        inputTokens: result.inputTokens || 0,
        outputTokens: result.outputTokens || 0,
        totalTokens: (result.inputTokens || 0) + (result.outputTokens || 0),
        cost: 0,
        geoScore: 0,
        citationLikelihood: 0
      }));
      onGenerateQA(qaItems, content);
    } catch (err: any) {
      alert('Failed to generate questions: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractContent = async () => {
    if (!url.trim()) {
      setExtractError('Please enter a URL');
      return;
    }
    setExtracting(true);
    setExtractError(null);
    try {
      const result = await apiService.extractContentFromUrl(url.trim());
      setContent(result.content || '');
      if (!result.content) setExtractError('No content extracted from this URL.');
    } catch (err: any) {
      setExtractError(err.message || 'Failed to extract content');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="card backdrop-blur-md bg-black/80 border border-genfuze-green/60 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-genfuze-green" />
        <h2 className="text-2xl font-bold text-genfuze-green">Content Input</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Paste your content here
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your blog post, article, or any content you want to generate Q&A for..."
            className="w-full h-48 bg-gray-800/50 border border-gray-600/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-genfuze-green focus:border-transparent transition-all resize-none"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Or enter a URL to crawl</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 bg-gray-800/50 border border-gray-600/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-genfuze-green focus:border-transparent transition-all"
              disabled={extracting}
            />
            <button
              type="button"
              onClick={handleExtractContent}
              disabled={extracting || !url.trim()}
              className="bg-gradient-to-r from-genfuze-green to-green-400 text-black font-bold px-5 py-2 rounded-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {extracting ? 'Extracting...' : 'Fetch Content'}
            </button>
          </div>
          {extractError && <div className="text-red-400 text-xs mt-2">{extractError}</div>}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {content.length} characters
          </div>
          
          <button
            onClick={handleGenerateQA}
            disabled={isProcessing || !content.trim()}
            className="bg-gradient-to-r from-genfuze-green to-green-400 text-black font-bold py-3 px-8 rounded-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Q&A...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Q&A
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}