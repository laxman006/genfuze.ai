import React, { useState } from 'react';
import { FileText, Hash, Zap, Link, Loader, Globe, File, StopCircle } from 'lucide-react';
import { crawlWebsite } from '../utils/fileUtils';

interface ContentInputProps {
  blogContent: string;
  setBlogContent: (content: string) => void;
  blogUrl: string;
  setBlogUrl: (url: string) => void;
  sourceUrls: string[];
  setSourceUrls: (urls: string[]) => void;
  crawlMode: 'single' | 'website';
  setCrawlMode: (mode: 'single' | 'website') => void;
  crawledPages: string[];
  setCrawledPages: (pages: string[]) => void;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  onGenerateQuestions: () => void;
  isGenerating: boolean;
}

export function ContentInput({
  blogContent,
  setBlogContent,
  blogUrl,
  setBlogUrl,
  sourceUrls,
  setSourceUrls,
  crawlMode,
  setCrawlMode,
  crawledPages,
  setCrawledPages,
  questionCount,
  setQuestionCount,
  onGenerateQuestions,
  isGenerating
}: ContentInputProps) {
  const [multipleUrls, setMultipleUrls] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [loadStatus, setLoadStatus] = useState('');
  const [loadStatusType, setLoadStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [maxPages, setMaxPages] = useState(10);
  const [unlimitedCrawl, setUnlimitedCrawl] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<{ current: number; total: number; url: string } | null>(null);
  const [stopCrawling, setStopCrawling] = useState(false);
  const [crawlStats, setCrawlStats] = useState<{
    totalPages: number;
    crawledPages: number;
    failedPages: number;
    skippedPages: number;
    totalContent: number;
    startTime: number;
    pagesPerMinute: number;
    estimatedTimeRemaining: number;
  } | null>(null);
  const [crawlLog, setCrawlLog] = useState<Array<{
    timestamp: string;
    action: string;
    url: string;
    status: 'success' | 'error' | 'skipped';
    contentLength?: number;
    error?: string;
  }>>([]);

  // Email notification state
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Perplexity QA state
  const [qaProvider, setQaProvider] = useState('perplexity');
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState('');

  const showLoadStatus = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLoadStatus(message);
    setLoadStatusType(type);
  };

  const getLoadStatusBgColor = () => {
    switch (loadStatusType) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const extractTextFromHtml = (html: string): string => {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation, .ads, .advertisement');
    scripts.forEach(el => el.remove());
    
    // Try to find main content areas
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.blog-content',
      '.post-body',
      'main',
      '.main-content',
      '.page-content'
    ];
    
    let mainContent = null;
    for (const selector of contentSelectors) {
      mainContent = tempDiv.querySelector(selector);
      if (mainContent && mainContent.textContent && mainContent.textContent.length > 200) {
        break;
      }
    }
    
    // If no main content found, use the whole body
    if (!mainContent) {
      mainContent = tempDiv;
    }
    
    // Extract text content
    let textContent = mainContent.textContent || (mainContent as HTMLElement).innerText || '';
    
    // Clean up the text
    textContent = textContent
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .trim();
    
    return textContent;
  };

  const corsProxies = [
    {
      name: 'AllOrigins',
      url: (targetUrl: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
      extractContent: (data: any) => data.contents
    },
    {
      name: 'CORS Anywhere (Heroku)',
      url: (targetUrl: string) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
      extractContent: (data: any) => data
    },
    {
      name: 'ThingProxy',
      url: (targetUrl: string) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
      extractContent: (data: any) => data
    },
    {
      name: 'CORS.SH',
      url: (targetUrl: string) => `https://cors.sh/${targetUrl}`,
      extractContent: (data: any) => data
    }
  ];

  const loadSinglePage = async (url: string): Promise<string | null> => {
    let lastError = '';
    
    // Try each CORS proxy
    for (let i = 0; i < corsProxies.length; i++) {
      const proxy = corsProxies[i];
      
      try {
        const proxyUrl = proxy.url(url);
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/html, */*',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          data = proxy.extractContent(data);
        } else {
          data = await response.text();
        }
        
        if (!data || (typeof data === 'string' && data.length < 100)) {
          throw new Error('Insufficient content received');
        }

        // Extract text content from HTML
        const textContent = extractTextFromHtml(data);
        
        if (!textContent || textContent.length < 100) {
          throw new Error('Could not extract meaningful content from the page');
        }

        return textContent;
        
      } catch (error) {
        console.error(`Error with ${proxy.name}:`, error);
        lastError = `${proxy.name}: ${(error as Error).message}`;
        
        // If this is not the last proxy, continue to the next one
        if (i < corsProxies.length - 1) {
          continue;
        }
      }
    }
    
    throw new Error(`Failed to load content: ${lastError}`);
  };

  const updateCrawlStats = (newStats: Partial<typeof crawlStats>) => {
    setCrawlStats(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...newStats };
      
      // Calculate pages per minute
      const elapsedMinutes = (Date.now() - updated.startTime) / 60000;
      updated.pagesPerMinute = elapsedMinutes > 0 ? updated.crawledPages / elapsedMinutes : 0;
      
      // Calculate estimated time remaining
      const remainingPages = updated.totalPages - updated.crawledPages;
      updated.estimatedTimeRemaining = updated.pagesPerMinute > 0 ? remainingPages / updated.pagesPerMinute : 0;
      
      return updated;
    });
  };

  const sendCrawlCompletionEmail = async (crawledPages: number, totalContent: number) => {
    try {
      setEmailError(null);
      
      const crawlData = {
        websiteUrl: blogUrl || multipleUrls.split('\n')[0] || 'Unknown',
        totalPages: crawlStats?.totalPages || crawledPages,
        crawledPages,
        failedPages: crawlStats?.failedPages || 0,
        skippedPages: crawlStats?.skippedPages || 0,
        totalContent,
        startTime: crawlStats?.startTime || Date.now(),
        endTime: Date.now(),
        duration: Date.now() - (crawlStats?.startTime || Date.now())
      };

      const response = await fetch('/api/email/crawl-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ crawlData })
      });

      const result = await response.json();
      
      if (result.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 5000); // Clear after 5 seconds
      } else {
        setEmailError(result.error || 'Failed to send email notification');
      }
    } catch (error) {
      setEmailError('Failed to send email notification: ' + (error as Error).message);
    }
  };

  const sendCrawlErrorEmail = async (errorMessage: string) => {
    try {
      setEmailError(null);
      
      const errorData = {
        websiteUrl: blogUrl || multipleUrls.split('\n')[0] || 'Unknown',
        error: errorMessage,
        startTime: crawlStats?.startTime || Date.now(),
        endTime: Date.now(),
        crawledPages: crawlStats?.crawledPages || 0
      };

      const response = await fetch('/api/email/crawl-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ errorData })
      });

      const result = await response.json();
      
      if (result.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 5000); // Clear after 5 seconds
      } else {
        setEmailError(result.error || 'Failed to send error email notification');
      }
    } catch (error) {
      setEmailError('Failed to send error email notification: ' + (error as Error).message);
    }
  };

  const loadContentFromUrl = async () => {
    const urls = multipleUrls.trim() ? 
      multipleUrls.split('\n').map(url => url.trim()).filter(url => url) : 
      blogUrl.trim() ? [blogUrl.trim()] : [];
    if (urls.length === 0) {
      showLoadStatus('Please enter a blog URL', 'error');
      return;
    }
    
    // Update parent state with source URLs and crawl mode
    setSourceUrls(urls);
    setCrawlMode(crawlMode);
    
    const url = urls[0];
    setBlogUrl(url);
    setIsLoadingContent(true);
    setCrawledPages([]);
    setStopCrawling(false);
    setCrawlProgress({ current: 0, total: urls.length, url });
    setCrawlLog([]);
    
    // Initialize crawl statistics
    const startTime = Date.now();
    setCrawlStats({
      totalPages: unlimitedCrawl ? -1 : 0,
      crawledPages: 0,
      failedPages: 0,
      skippedPages: 0,
      totalContent: 0,
      startTime,
      pagesPerMinute: 0,
      estimatedTimeRemaining: 0
    });

    const allContent: string[] = [];
    const allPages: string[] = [];

    try {
      for (let i = 0; i < urls.length; i++) {
        if (stopCrawling) {
          showLoadStatus('Crawling stopped by user', 'info');
          
          // Send email notification if enabled
          if (enableEmailNotifications && notificationEmail) {
            await sendCrawlErrorEmail('Crawling stopped by user');
          }
          break;
        }

        const url = urls[i];
        setCrawlProgress({ current: i + 1, total: urls.length, url });

        if (crawlMode === 'website') {
          // Website crawling mode
          showLoadStatus(`Crawling website ${i + 1}/${urls.length}: ${url}`, 'info');
          addCrawlLog('Starting website crawl', url, 'success');
          
          try {
            const maxPagesToCrawl = unlimitedCrawl ? Number.MAX_SAFE_INTEGER : maxPages; // Allow truly unlimited crawling
            const result = await crawlWebsite(url, maxPagesToCrawl, (progress) => {
              // Live progress updates
              if (progress.status === 'crawling') {
                setCrawlProgress({ 
                  current: progress.crawledPages + 1, 
                  total: progress.totalPages, 
                  url: progress.currentPage 
                });
                addCrawlLog('Crawling page', progress.currentPage, 'success');
              } else if (progress.status === 'success') {
                updateCrawlStats({
                  crawledPages: (crawlStats?.crawledPages || 0) + 1,
                  totalContent: (crawlStats?.totalContent || 0) + (progress.contentLength || 0)
                });
                addCrawlLog('Page crawled successfully', progress.currentPage, 'success', progress.contentLength);
              } else if (progress.status === 'error') {
                updateCrawlStats({
                  failedPages: (crawlStats?.failedPages || 0) + 1
                });
                addCrawlLog('Page crawl failed', progress.currentPage, 'error', undefined, progress.error);
              } else if (progress.status === 'skipped') {
                updateCrawlStats({
                  skippedPages: (crawlStats?.skippedPages || 0) + 1
                });
                addCrawlLog('Page skipped', progress.currentPage, 'skipped');
              }
            });
            
            // Update stats
            updateCrawlStats({
              totalPages: unlimitedCrawl ? -1 : (crawlStats?.totalPages || 0) + result.pages.length,
              crawledPages: (crawlStats?.crawledPages || 0) + result.pages.length,
              totalContent: (crawlStats?.totalContent || 0) + result.content.length
            });
            
            allContent.push(`=== Website: ${url} ===\n${result.content}\n`);
            allPages.push(...result.pages);
            
            showLoadStatus(`Successfully crawled ${result.pages.length} pages from ${url}`, 'success');
          } catch (error) {
            addCrawlLog('Website crawl failed', url, 'error', undefined, (error as Error).message);
            updateCrawlStats({
              failedPages: (crawlStats?.failedPages || 0) + 1
            });
            showLoadStatus(`Error crawling website ${url}: ${(error as Error).message}`, 'error');
            // Continue with other URLs
          }
        } else {
          // Single page mode
          showLoadStatus(`Loading page ${i + 1}/${urls.length}: ${url}`, 'info');
          addCrawlLog('Starting page load', url, 'success');
          
          try {
            const content = await loadSinglePage(url);
            if (content) {
              updateCrawlStats({
                totalPages: (crawlStats?.totalPages || 0) + 1,
                crawledPages: (crawlStats?.crawledPages || 0) + 1,
                totalContent: (crawlStats?.totalContent || 0) + content.length
              });
              
              allContent.push(`=== Page: ${url} ===\n${content}\n`);
              allPages.push(url);
              addCrawlLog('Page loaded', url, 'success', content.length);
              showLoadStatus(`Successfully loaded content from ${url}`, 'success');
            }
          } catch (error) {
            addCrawlLog('Page load failed', url, 'error', undefined, (error as Error).message);
            updateCrawlStats({
              failedPages: (crawlStats?.failedPages || 0) + 1
            });
            showLoadStatus(`Error loading page ${url}: ${(error as Error).message}`, 'error');
            // Continue with other URLs
          }
        }
      }

      if (allContent.length > 0) {
        const combinedContent = allContent.join('\n\n');
        setBlogContent(combinedContent);
        setCrawledPages(allPages);
        showLoadStatus(`Successfully processed ${allPages.length} pages with ${combinedContent.length} characters of content`, 'success');
        
        // Send email notification if enabled
        if (enableEmailNotifications && notificationEmail) {
          await sendCrawlCompletionEmail(allPages.length, combinedContent.length);
        }
      } else {
        showLoadStatus('No content was successfully loaded from any URL', 'error');
        
        // Send error email notification if enabled
        if (enableEmailNotifications && notificationEmail) {
          await sendCrawlErrorEmail('No content was successfully loaded from any URL');
        }
      }
      
    } catch (error) {
      showLoadStatus(`Error during content loading: ${(error as Error).message}`, 'error');
    }
    
    setIsLoadingContent(false);
    setCrawlProgress(null);
  };

  const clearContent = () => {
    setBlogContent('');
    setBlogUrl('');
    setSourceUrls([]);
    setCrawledPages([]);
    setMultipleUrls('');
    setLoadStatus('');
    setCrawlProgress(null);
    setStopCrawling(false);
  };

  const stopCrawlingProcess = () => {
    setStopCrawling(true);
    showLoadStatus('Stopping crawl process...', 'info');
  };

  const addCrawlLog = (action: string, url: string, status: 'success' | 'error' | 'skipped', contentLength?: number, error?: string) => {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      url,
      status,
      contentLength,
      error
    };
    setCrawlLog(prev => [...prev, logEntry]);
  };

  const testEmailConfiguration = async () => {
    try {
      setEmailError(null);
      
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 5000); // Clear after 5 seconds
        showLoadStatus('Test email sent successfully!', 'success');
      } else {
        setEmailError(result.error || 'Failed to send test email');
        showLoadStatus('Test email failed: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      setEmailError('Failed to send test email: ' + (error as Error).message);
      showLoadStatus('Test email failed: ' + (error as Error).message, 'error');
    }
  };

  const handleAskProvider = async () => {
    setQaLoading(true);
    setQaError('');
    setQaAnswer('');
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: qaProvider, question: qaQuestion })
      });
      const data = await res.json();
      if (res.ok) {
        setQaAnswer(data.answer);
      } else {
        setQaError(data.error || 'Error fetching answer');
      }
    } catch (err) {
      setQaError('Network error');
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Content Input</h2>
      </div>
      
      <div className="space-y-6">
        {/* Crawl Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Content Source:</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="crawlMode"
                value="single"
                checked={crawlMode === 'single'}
                onChange={(e) => setCrawlMode(e.target.value as 'single' | 'website')}
                className="text-blue-600"
              />
              <File className="w-4 h-4" />
              <span className="text-sm">Single Page</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="crawlMode"
                value="website"
                checked={crawlMode === 'website'}
                onChange={(e) => setCrawlMode(e.target.value as 'single' | 'website')}
                className="text-blue-600"
              />
              <Globe className="w-4 h-4" />
              <span className="text-sm">Website Crawl</span>
            </label>
          </div>
        </div>

        {/* URL Input Section */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Link className="w-4 h-4" />
            {crawlMode === 'website' ? 'Website URLs:' : 'Page URLs:'}
          </label>
          
          {/* Multiple URLs Textarea */}
          <div className="mb-3">
            <textarea
              value={multipleUrls}
              onChange={(e) => setMultipleUrls(e.target.value)}
              placeholder="Enter multiple URLs (one per line):&#10;https://example1.com/&#10;https://example2.com/blog&#10;https://example3.com/article"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-24 resize-y"
              disabled={isLoadingContent}
            />
            <div className="mt-1 text-xs text-gray-500">
              Enter one URL per line. Leave empty to use single URL below.
            </div>
          </div>

          {/* Single URL Input (fallback) */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Single URL (if not using multiple URLs above):
            </label>
            <input
              type="url"
              value={blogUrl}
              onChange={(e) => setBlogUrl(e.target.value)}
              placeholder={crawlMode === 'website' ? "https://example.com/" : "https://www.cloudfuze.com/move-files-to-sharepoint-from-dropbox/"}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isLoadingContent}
            />
          </div>

          {/* Crawl Controls */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={loadContentFromUrl}
              disabled={isLoadingContent || (!multipleUrls.trim() && !blogUrl.trim())}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {isLoadingContent ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {crawlMode === 'website' ? 'Crawling...' : 'Loading...'}
                </>
              ) : (
                <>
                  {crawlMode === 'website' ? <Globe className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                  {crawlMode === 'website' ? 'Crawl Websites' : 'Load Pages'}
                </>
              )}
            </button>
            
            {isLoadingContent && (
              <button
                onClick={stopCrawlingProcess}
                className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                Stop
              </button>
            )}
          </div>
          
          {/* Max Pages Input for Website Crawl */}
          {crawlMode === 'website' && (
            <div className="flex items-center gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Pages per Website:
                </label>
                <input
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value) || 10)}
                  min="1"
                  max="100"
                  disabled={unlimitedCrawl}
                  placeholder={unlimitedCrawl ? "Unlimited" : "10"}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unlimitedCrawl}
                  onChange={(e) => setUnlimitedCrawl(e.target.checked)}
                  className="text-blue-600"
                />
                <span className="text-sm">Unlimited crawling (no page limit)</span>
              </label>
              {unlimitedCrawl && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-xs text-yellow-800">
                    <strong>Note:</strong> Unlimited crawling will continue until all discoverable pages are crawled or you manually stop the process. 
                    This may take a very long time for large websites and could generate substantial content.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Notification Settings */}
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="enableEmailNotifications"
                checked={enableEmailNotifications}
                onChange={(e) => setEnableEmailNotifications(e.target.checked)}
                className="text-blue-600"
              />
              <label htmlFor="enableEmailNotifications" className="text-sm font-medium text-blue-800">
                Send email notification when crawling completes
              </label>
            </div>
            
            {enableEmailNotifications && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Notification Email Address:
                  </label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {emailSent && (
                  <div className="p-2 bg-green-100 border border-green-300 rounded-lg">
                    <div className="text-xs text-green-800">
                      ✅ Email notification sent successfully!
                    </div>
                  </div>
                )}
                
                {emailError && (
                  <div className="p-2 bg-red-100 border border-red-300 rounded-lg">
                    <div className="text-xs text-red-800">
                      ❌ Email notification failed: {emailError}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-blue-600">
                  You'll receive a detailed email with crawl statistics when the process completes.
                </div>
                
                <button
                  onClick={testEmailConfiguration}
                  className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Test Email Configuration
                </button>
              </div>
            )}
          </div>

          {/* Progress Display */}
          {crawlProgress && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Live Progress: {crawlProgress.current} {crawlProgress.total === -1 ? '(Unlimited)' : `/ ${crawlProgress.total}`}
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: crawlProgress.total === -1 ? '100%' : `${(crawlProgress.current / crawlProgress.total) * 100}%` }}
                />
              </div>
              <div className="text-xs text-blue-600 mt-1 truncate">
                Currently crawling: {crawlProgress.url}
              </div>
              <div className="text-xs text-blue-500 mt-1">
                {crawlStats && (
                  <>
                    Speed: {crawlStats.pagesPerMinute.toFixed(1)} pages/min | 
                    ETA: {crawlStats.estimatedTimeRemaining > 0 ? `${crawlStats.estimatedTimeRemaining.toFixed(1)} min` : 'Calculating...'}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Crawling Statistics */}
          {crawlStats && (
            <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-800 mb-2">Crawling Statistics</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="font-medium">Total Pages:</span> {crawlStats.totalPages === -1 ? 'Unlimited' : crawlStats.totalPages}
                </div>
                <div>
                  <span className="font-medium">Crawled:</span> {crawlStats.crawledPages}
                </div>
                <div>
                  <span className="font-medium">Failed:</span> {crawlStats.failedPages}
                </div>
                <div>
                  <span className="font-medium">Skipped:</span> {crawlStats.skippedPages}
                </div>
                <div>
                  <span className="font-medium">Content:</span> {crawlStats.totalContent.toLocaleString()} chars
                </div>
                <div>
                  <span className="font-medium">Speed:</span> {crawlStats.pagesPerMinute.toFixed(1)} pages/min
                </div>
                <div>
                  <span className="font-medium">ETA:</span> {crawlStats.estimatedTimeRemaining > 0 ? `${crawlStats.estimatedTimeRemaining.toFixed(1)} min` : 'Calculating...'}
                </div>
                <div>
                  <span className="font-medium">Elapsed:</span> {((Date.now() - crawlStats.startTime) / 60000).toFixed(1)} min
                </div>
              </div>
            </div>
          )}

          {/* Crawl Log */}
          {crawlLog.length > 0 && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-800 mb-2">Crawl Log ({crawlLog.length} entries)</div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {crawlLog.slice(-10).map((log, index) => (
                  <div key={index} className={`text-xs p-1 rounded ${
                    log.status === 'success' ? 'bg-green-100 text-green-800' :
                    log.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    <span className="font-mono">{log.timestamp}</span> - {log.action}: {log.url}
                    {log.contentLength && <span className="ml-2">({log.contentLength} chars)</span>}
                    {log.error && <span className="ml-2 text-red-600">Error: {log.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {loadStatus && (
            <div className={`p-3 rounded-lg border ${getLoadStatusBgColor()}`}>
              <span className="text-sm font-medium whitespace-pre-line">{loadStatus}</span>
            </div>
          )}

          {/* Display Crawled Pages */}
          {crawledPages.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Crawled Pages ({crawledPages.length}):
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {crawledPages.map((page, index) => (
                  <div key={index} className="text-xs text-gray-600 truncate">
                    {index + 1}. {page}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Manual Content Input Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {crawlMode === 'website' ? 'Website Content:' : 'Page Content:'}
            </label>
            {blogContent && (
              <button
                onClick={clearContent}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Clear Content
              </button>
            )}
          </div>
          <textarea
            value={blogContent}
            onChange={(e) => setBlogContent(e.target.value)}
            placeholder={crawlMode === 'website' ? "Website content will be loaded here from the URLs above, or you can paste it manually..." : "Page content will be loaded here from the URLs above, or you can paste it manually..."}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-32 resize-y"
            readOnly={isLoadingContent}
          />
          {blogContent && (
            <div className="mt-2 text-sm text-gray-500">
              Content length: {blogContent.length} characters
            </div>
          )}
        </div>
        
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Hash className="w-4 h-4" />
            Number of Questions to Generate:
          </label>
          <input
            type="number"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
            min="1"
            max="50"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <button
          onClick={onGenerateQuestions}
          disabled={isGenerating || !blogContent.trim() || isLoadingContent}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Zap className="w-4 h-4" />
          {isGenerating ? 'Generating Questions...' : 'Generate Questions'}
        </button>
      </div>

      <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="mb-2 font-semibold text-purple-800">Ask a Question (Web Automation)</div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium text-purple-700">Provider:</label>
          <select value={qaProvider} onChange={e => setQaProvider(e.target.value)} className="border rounded px-2 py-1">
            <option value="perplexity">Perplexity</option>
            {/* Future: <option value="chatgpt">ChatGPT</option> <option value="gemini">Gemini</option> <option value="claude">Claude</option> */}
          </select>
        </div>
        <textarea
          value={qaQuestion}
          onChange={e => setQaQuestion(e.target.value)}
          placeholder="Type your question for Perplexity..."
          className="w-full px-3 py-2 border border-purple-300 rounded mb-2"
          rows={3}
        />
        <button
          onClick={handleAskProvider}
          disabled={qaLoading || !qaQuestion.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {qaLoading ? 'Asking...' : 'Ask'}
        </button>
        {qaError && <div className="mt-2 text-red-600 text-sm">{qaError}</div>}
        {qaAnswer && (
          <div className="mt-4 p-3 bg-white border border-purple-200 rounded text-gray-800 whitespace-pre-line">
            <span className="font-semibold text-purple-700">Answer:</span> {qaAnswer}
          </div>
        )}
      </div>
    </div>
  );
}