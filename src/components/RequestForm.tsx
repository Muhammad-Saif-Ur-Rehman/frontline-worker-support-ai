import React, { useState } from 'react';
import { Send, AlertTriangle, MapPin } from 'lucide-react';

interface RequestFormProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
}

export const RequestForm: React.FC<RequestFormProps> = ({ onSubmit, isProcessing }) => {
  const [requestText, setRequestText] = useState('');

  // Example scenarios for quick testing
  const demoScenarios = [
    {
      text: 'My father has collapsed in Islamabad and is unconscious. Please help immediately!',
      label: 'Critical Emergency'
    },
    {
      text: 'There was a car accident near PIMS hospital. Two people are injured.',
      label: 'Multi-Patient Incident'
    },
    {
      text: 'Need to schedule a routine check-up at a hospital in Rawalpindi.',
      label: 'Routine Medical Care'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestText.trim()) {
      onSubmit(requestText.trim());
    }
  };

  const handleDemoScenario = (scenario: typeof demoScenarios[0]) => {
    setRequestText(scenario.text);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-90">
      <div className="flex items-center mb-6">
        <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Emergency Request System</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="request" className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            Describe your emergency or service request
          </label>
          <textarea
            id="request"
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="e.g., 'My father collapsed in Islamabad and needs immediate medical attention'"
            className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
            disabled={isProcessing}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <h3 className="col-span-full text-lg font-semibold text-gray-700 mb-2">Quick Start Examples</h3>
          {demoScenarios.map((scenario, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleDemoScenario(scenario)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
              disabled={isProcessing}
            >
              <div className="font-medium text-sm text-gray-800">{scenario.label}</div>
              <div className="text-xs text-gray-600 mt-1 line-clamp-2">{scenario.text}</div>
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={isProcessing || !requestText.trim()}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-4 px-6 rounded-lg hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Emergency Request...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Submit Emergency Request
            </>
          )}
        </button>
      </form>
    </div>
  );
};