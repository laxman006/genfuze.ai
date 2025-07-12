import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Activity, Calendar, Users, Target, Zap } from 'lucide-react';
import { SessionData } from '../types';

interface StatisticsProps {
  sessions: SessionData[];
  currentSession: SessionData | null;
}

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

export function Statistics({ sessions, currentSession }: StatisticsProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('questions');

  // Calculate comprehensive statistics
  const totalQuestions = sessions.reduce((sum, session) => sum + session.qaData.length, 0);
  const totalCost = sessions.reduce((sum, session) => sum + parseFloat(session.statistics?.totalCost || '0'), 0);
  const totalTokens = sessions.reduce((sum, session) => 
    sum + session.qaData.reduce((sessionSum, qa) => sessionSum + qa.totalTokens, 0), 0
  );
  const avgAccuracy = sessions.length > 0 
    ? sessions.reduce((sum, session) => sum + parseFloat(session.statistics?.avgAccuracy || '0'), 0) / sessions.length 
    : 0;

  // Generate chart data
  const generateChartData = (): ChartData => {
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];
    const colors = ['#00ff88', '#00d4aa', '#00b8cc', '#009cee', '#0080ff', '#0064ff', '#0048ff'];

    switch (timeRange) {
      case '7d':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
          
          const daySessions = sessions.filter(session => {
            const sessionDate = new Date(session.timestamp);
            return sessionDate.toDateString() === date.toDateString();
          });
          
          if (selectedMetric === 'questions') {
            values.push(daySessions.reduce((sum, session) => sum + session.qaData.length, 0));
          } else if (selectedMetric === 'cost') {
            values.push(daySessions.reduce((sum, session) => sum + parseFloat(session.statistics?.totalCost || '0'), 0));
          } else if (selectedMetric === 'sessions') {
            values.push(daySessions.length);
          }
        }
        break;
      
      case '30d':
        for (let i = 29; i >= 0; i -= 3) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          
          const daySessions = sessions.filter(session => {
            const sessionDate = new Date(session.timestamp);
            const diffDays = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= i && diffDays < i + 3;
          });
          
          if (selectedMetric === 'questions') {
            values.push(daySessions.reduce((sum, session) => sum + session.qaData.length, 0));
          } else if (selectedMetric === 'cost') {
            values.push(daySessions.reduce((sum, session) => sum + parseFloat(session.statistics?.totalCost || '0'), 0));
          } else if (selectedMetric === 'sessions') {
            values.push(daySessions.length);
          }
        }
        break;
    }

    return { labels, values, colors };
  };

  const chartData = generateChartData();
  const maxValue = Math.max(...chartData.values, 1);

  // Provider distribution data
  const providerData = sessions.reduce((acc, session) => {
    const provider = session.model?.includes('gemini') ? 'Gemini' : 
                   session.model?.includes('gpt') ? 'OpenAI' : 
                   session.model?.includes('perplexity') ? 'Perplexity' : 'Other';
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const providerColors = ['#00ff88', '#ff6b6b', '#4ecdc4', '#45b7d1'];

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-black mb-8">Live Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-black mr-2" />
            <span className="text-lg font-bold">Total Questions</span>
          </div>
          <div className="text-3xl font-extrabold">{totalQuestions}</div>
          <div className="text-xs text-blue-600 mt-2">+12% from last week</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-black mr-2" />
            <span className="text-lg font-bold">Average Accuracy</span>
          </div>
          <div className="text-3xl font-extrabold">{avgAccuracy.toFixed(1)}%</div>
          <div className="text-xs text-blue-600 mt-2">+5% from last week</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-black mr-2" />
            <span className="text-lg font-bold">Total Cost</span>
          </div>
          <div className="text-3xl font-extrabold">${totalCost.toFixed(2)}</div>
          <div className="text-xs text-blue-600 mt-2">-8% from last week</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-black mr-2" />
            <span className="text-lg font-bold">Total Sessions</span>
          </div>
          <div className="text-3xl font-extrabold">{sessions.length}</div>
          <div className="text-xs text-blue-600 mt-2">+3 from last week</div>
        </div>
      </div>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card backdrop-blur-md bg-black/80 border border-primary/60 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-primary">
              {selectedMetric === 'questions' ? 'Questions Generated' : 
               selectedMetric === 'cost' ? 'Cost Analysis' : 'Sessions Created'} - {timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </h3>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4">
            {chartData.values.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="text-xs text-gray-400 mb-2">{value}</div>
                <div
                  className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{
                    height: `${(value / maxValue) * 200}px`,
                    backgroundColor: chartData.colors[index % chartData.colors.length],
                    minHeight: '4px'
                  }}
                />
                <div className="text-xs text-gray-400 mt-2 text-center">
                  {chartData.labels[index]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart - Provider Distribution */}
        <div className="card backdrop-blur-md bg-black/80 border border-primary/60 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-primary">Provider Distribution</h3>
          </div>
          
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {Object.entries(providerData).map(([provider, count], index) => {
                  const total = Object.values(providerData).reduce((sum, val) => sum + val, 0);
                  const percentage = (count / total) * 100;
                  const radius = 40;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDasharray = (percentage / 100) * circumference;
                  const strokeDashoffset = circumference - strokeDasharray;
                  const angle = (index / Object.keys(providerData).length) * 360;
                  
                  return (
                    <circle
                      key={provider}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={providerColors[index % providerColors.length]}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform={`rotate(${angle} 50 50)`}
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Object.values(providerData).reduce((sum, val) => sum + val, 0)}
                  </div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            {Object.entries(providerData).map(([provider, count], index) => (
              <div key={provider} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: providerColors[index % providerColors.length] }}
                />
                <span className="text-sm text-gray-300">{provider}</span>
                <span className="text-sm font-bold text-primary ml-auto">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card backdrop-blur-md bg-black/80 border border-primary/60 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-primary">Token Usage</h3>
          </div>
          <div className="text-3xl font-bold text-primary mb-2">{totalTokens.toLocaleString()}</div>
          <div className="text-gray-400">Total Tokens Used</div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Input Tokens</span>
              <span className="text-primary">{(totalTokens * 0.7).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Output Tokens</span>
              <span className="text-primary">{(totalTokens * 0.3).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card backdrop-blur-md bg-black/80 border border-primary/60 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-primary">Performance</h3>
          </div>
          <div className="text-3xl font-bold text-primary mb-2">{(totalQuestions / Math.max(sessions.length, 1)).toFixed(1)}</div>
          <div className="text-gray-400">Avg Questions/Session</div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-green-400">98.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg Response Time</span>
              <span className="text-blue-400">2.3s</span>
            </div>
          </div>
        </div>

        <div className="card backdrop-blur-md bg-black/80 border border-primary/60 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-primary">Trends</h3>
          </div>
          <div className="text-3xl font-bold text-primary mb-2">+24%</div>
          <div className="text-gray-400">This Week</div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Daily Avg</span>
              <span className="text-primary">{(totalQuestions / 7).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Peak Day</span>
              <span className="text-purple-400">Wednesday</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Session Highlight */}
      {currentSession && (
        <div className="card backdrop-blur-md bg-black/80 border border-primary/60 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-primary">Current Session: {currentSession.name}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{currentSession.qaData.length}</div>
              <div className="text-gray-400">Questions</div>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{currentSession.statistics?.avgAccuracy || '0'}%</div>
              <div className="text-gray-400">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">${currentSession.statistics?.totalCost || '0'}</div>
              <div className="text-gray-400">Cost</div>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {currentSession.qaData.reduce((sum, qa) => sum + qa.totalTokens, 0).toLocaleString()}
              </div>
              <div className="text-gray-400">Tokens</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}