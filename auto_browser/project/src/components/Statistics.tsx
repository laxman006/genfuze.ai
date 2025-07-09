import React from 'react';
import { BarChart3, Target, Coins, Hash } from 'lucide-react';

interface StatisticsProps {
  totalQuestions: number;
  avgAccuracy: number;
  avgCitationLikelihood?: number;
  totalTokens: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  isVisible: boolean;
}

export function Statistics({
  totalQuestions,
  avgAccuracy,
  avgCitationLikelihood,
  totalTokens,
  totalCost,
  inputTokens,
  outputTokens,
  inputCost,
  outputCost,
  isVisible
}: StatisticsProps) {
  if (!isVisible) return null;

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Statistics</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white text-center">
            <Hash className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <div className="text-blue-100 text-sm">Total Questions</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white text-center">
            <Target className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{avgAccuracy.toFixed(1)}%</div>
            <div className="text-green-100 text-sm">Avg Accuracy</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white text-center">
            <Hash className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <div className="text-purple-100 text-sm">Total Tokens</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg text-white text-center">
            <Coins className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <div className="text-orange-100 text-sm">Estimated Cost</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Token Cost Breakdown</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center">
            <div className="text-lg font-bold">{inputTokens.toLocaleString()}</div>
            <div className="text-emerald-100 text-sm">Input Tokens</div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center">
            <div className="text-lg font-bold">{outputTokens.toLocaleString()}</div>
            <div className="text-emerald-100 text-sm">Output Tokens</div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center">
            <div className="text-lg font-bold">${inputCost.toFixed(4)}</div>
            <div className="text-emerald-100 text-sm">Input Cost</div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center">
            <div className="text-lg font-bold">${outputCost.toFixed(4)}</div>
            <div className="text-emerald-100 text-sm">Output Cost</div>
          </div>
        </div>
      </div>
    </>
  );
}