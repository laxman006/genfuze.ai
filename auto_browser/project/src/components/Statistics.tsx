import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { SessionData } from '../types';

interface StatisticsProps {
  sessions: SessionData[];
  currentSession: SessionData | null;
}

export function Statistics({ sessions, currentSession }: StatisticsProps) {
  const totalQuestions = sessions.reduce((sum, session) => sum + session.statistics.totalQuestions, 0);
  const totalCost = sessions.reduce((sum, session) => sum + parseFloat(session.statistics.totalCost), 0);
  const avgAccuracy = sessions.length > 0 
    ? sessions.reduce((sum, session) => sum + parseFloat(session.statistics.avgAccuracy), 0) / sessions.length 
    : 0;

  return (
    <div className="card backdrop-blur-md bg-black/80 border border-genfuze-green/60 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-7 h-7 text-genfuze-green" />
        <h2 className="text-2xl font-bold text-genfuze-green">Statistics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-genfuze-green/20 rounded-lg mx-auto mb-4">
            <Activity className="w-6 h-6 text-genfuze-green" />
          </div>
          <div className="text-3xl font-bold text-genfuze-green mb-2">{totalQuestions}</div>
          <div className="text-gray-400">Total Questions</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">{avgAccuracy.toFixed(1)}%</div>
          <div className="text-gray-400">Average Accuracy</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mx-auto mb-4">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">${totalCost.toFixed(2)}</div>
          <div className="text-gray-400">Total Cost</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-2">{sessions.length}</div>
          <div className="text-gray-400">Total Sessions</div>
        </div>
      </div>

      {currentSession && (
        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Current Session: {currentSession.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-400">Questions Generated</div>
              <div className="text-2xl font-bold text-genfuze-green">{currentSession.statistics.totalQuestions}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Average Accuracy</div>
              <div className="text-2xl font-bold text-blue-400">{currentSession.statistics.avgAccuracy}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Total Cost</div>
              <div className="text-2xl font-bold text-green-400">${currentSession.statistics.totalCost}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <span className="font-medium text-blue-300">
          Statistics provide insights into your Q&A generation performance and costs.
        </span>
      </div>
    </div>
  );
}