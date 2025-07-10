import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';

interface ProgressSectionProps {
  progress: number;
  status: string;
  statusType: 'info' | 'success' | 'error';
  isVisible: boolean;
  isLoading?: boolean;
}

export function ProgressSection({ progress, status, statusType, isVisible, isLoading }: ProgressSectionProps) {
  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (statusType) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusBgColor = () => {
    switch (statusType) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="card mb-8 backdrop-blur-md bg-black/80 border border-genfuze-green/60 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-genfuze-green animate-pulse" />
        <h3 className="text-lg font-bold text-genfuze-green">Progress</h3>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Progress</h2>
      </div>
      
      <div className="space-y-4">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        
        <div className={`flex items-center gap-2 p-4 rounded-lg border ${getStatusBgColor()}`}>
          {getStatusIcon()}
          <span className="font-medium">{status}</span>
        </div>
      </div>
      {isLoading && <div className="spinner mt-4" />}
    </div>
  );
}