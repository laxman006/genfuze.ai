import React, { useState } from 'react';
import { FileText, Zap, Loader2, Plus, X, Globe, BarChart3, DollarSign } from 'lucide-react';
import { QAItem } from '../types';
import { apiService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

interface ContentInputProps {
  onGenerateQA: (items: QAItem[], content: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  provider: string;
  model: string;
  questionCount: number;
  urls: UrlData[];
  setUrls: React.Dispatch<React.SetStateAction<UrlData[]>>;
}

export interface UrlData {
  url: string;
  content: string;
  status: 'pending' | 'extracting' | 'success' | 'error';
  error?: string;
  confidence?: number;
  tokens?: number;
  cost?: number;
}

export function ContentInput({ onGenerateQA, isProcessing, setIsProcessing, provider, model, questionCount, urls, setUrls }: ContentInputProps) {
  const [content, setContent] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [metrics, setMetrics] = useState({
    totalTokens: 0,
    estimatedCost: 0,
    confidenceScore: 0,
    contentLength: 0
  });

  const navigate = useNavigate();

  const addUrl = () => {
    if (newUrl.trim() && !urls.find(u => u.url === newUrl.trim())) {
      setUrls([...urls, { url: newUrl.trim(), content: '', status: 'pending' }]);
      setNewUrl('');
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const extractContentFromUrl = async (urlData: UrlData, index: number) => {
    const updatedUrls = [...urls];
    updatedUrls[index] = { ...urlData, status: 'extracting' };
    setUrls(updatedUrls);

    try {
      const result = await apiService.extractContentFromUrl(urlData.url);
      const extractedContent = result.content || '';
      
      // Calculate metrics for this URL
      const tokens = extractedContent.length / 4; // Rough estimate
      const cost = tokens * 0.0001; // Rough cost estimate
      const confidence = Math.random() * 0.3 + 0.7; // Mock confidence score
      
      updatedUrls[index] = {
        ...urlData,
        content: extractedContent,
        status: 'success',
        tokens,
        cost,
        confidence
      };
      setUrls(updatedUrls);
      
      // Update overall content
      const allContent = updatedUrls.map(u => u.content).join('\n\n') + '\n\n' + content;
      setContent(allContent);
      
      // Update metrics
      updateMetrics(allContent);
      
    } catch (err: any) {
      updatedUrls[index] = {
        ...urlData,
        status: 'error',
        error: err.message || 'Failed to extract content'
      };
      setUrls(updatedUrls);
    }
  };

  const updateMetrics = (text: string) => {
    const tokens = text.length / 4;
    const cost = tokens * 0.0001;
    const confidence = Math.random() * 0.2 + 0.8;
    
    setMetrics({
      totalTokens: Math.round(tokens),
      estimatedCost: parseFloat(cost.toFixed(4)),
      confidenceScore: parseFloat((confidence * 100).toFixed(1)),
      contentLength: text.length
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateMetrics(newContent);
  };

  const handleGenerateQA = async () => {
    if (!content.trim()) {
      alert('Please enter some content first');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await apiService.generateQuestions({ content, questionCount, provider, model });
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

  return (
    <div className="card bg-white border border-primary/10 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-8 h-8 text-black drop-shadow" />
        <h2 className="text-3xl font-extrabold text-black tracking-tight">Content Input</h2>
      </div>
      
      <div className="space-y-8">
        {/* Multi-URL Input Section */}
        <div>
          <label className="block text-base font-semibold text-black mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-black" />
            Add URLs to crawl (multiple URLs supported)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 bg-white border border-black/20 rounded-lg px-4 py-3 text-black text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
            <button
              onClick={addUrl}
              disabled={!newUrl.trim()}
              className="bg-black text-white font-bold px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base shadow"
            >
              <Plus className="w-5 h-5 text-white" />
              Add
            </button>
          </div>
          
          {/* URL List */}
          {urls.length > 0 && (
            <div className="space-y-2 mb-4">
              {urls.map((urlData, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg border border-black/10">
                  <div className="flex-1 min-w-0">
                    <div className="text-base text-black font-medium truncate">{urlData.url}</div>
                    {urlData.status === 'error' && (
                      <div className="text-xs text-red-600 mt-1">{urlData.error}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {urlData.status === 'pending' && (
                      <button
                        onClick={() => extractContentFromUrl(urlData, index)}
                        className="bg-black text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow"
                      >
                        Extract
                      </button>
                    )}
                    {urlData.status === 'extracting' && (
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                    )}
                    {urlData.status === 'success' && (
                      <div className="w-3 h-3 bg-black rounded-full"></div>
                    )}
                    {urlData.status === 'error' && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    <button
                      onClick={() => removeUrl(index)}
                      className="text-red-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-5 h-5 text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Textarea */}
        <div>
          <label className="block text-base font-semibold text-black mb-3">
            Content (from URLs + manual input)
          </label>
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Content will be automatically populated from URLs, or paste your content here..."
            className="w-full h-48 bg-white border border-black/20 rounded-lg px-4 py-3 text-black text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-between gap-4 mt-4">
          <div className="text-base text-black font-medium">
            {urls.length} URL{urls.length !== 1 ? 's' : ''} • {content.length} characters
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateQA}
              disabled={isProcessing || !content.trim()}
              className="bg-black text-white font-bold py-3 px-10 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg shadow"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  Generating Q&A...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 text-white" />
                  Generate Q&A
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/competitor-benchmarking')}
              disabled={urls.length === 0}
              className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg shadow"
            >
              <BarChart3 className="w-6 h-6 text-white" />
              See Competitor Benchmarking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}