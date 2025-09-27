import React from 'react';
import { ProcessingStep } from '../types';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  isActive: boolean;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ steps, isActive }) => {
  if (!isActive && steps.length === 0) return null;

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50 animate-pulse';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 backdrop-blur-sm bg-opacity-90">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Agents Processing</h2>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 transition-all duration-300 ${getStepColor(step.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStepIcon(step.status)}
                <span className="ml-3 font-semibold text-gray-800">
                  {step.agent === 'Coordinator' ? '🧠 Meta-Agent (Coordinator)' : `🤖 ${step.agent}`}
                </span>
              </div>
              {step.duration && (
                <span className="text-sm text-gray-600">{step.duration}ms</span>
              )}
            </div>
            {step.reasoning && (
              <p className="mt-2 text-sm text-gray-600 pl-8">{step.reasoning}</p>
            )}
            {step.status === 'processing' && (
              <div className="mt-2 pl-8">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};