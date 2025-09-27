import { useState } from 'react';
import { RequestForm } from './components/RequestForm';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultDisplay } from './components/ResultDisplay';
import { Coordinator } from './agents/Coordinator';
import { EmergencyRequest, CoordinatorResult } from './types';
import { Brain } from 'lucide-react';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const [result, setResult] = useState<CoordinatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const coordinator = new Coordinator();

  // Add coordinator to window for testing (development only)
  if (import.meta.env.DEV) {
    (window as any).testCoordinator = coordinator;
    (window as any).forceDegradedMode = false; // Can be set to true for testing
    (window as any).enableDegradedMode = () => {
      (window as any).forceDegradedMode = true;
      console.log('🔧 Degraded mode enabled for testing');
    };
    (window as any).disableDegradedMode = () => {
      (window as any).forceDegradedMode = false;
      console.log('🔧 Degraded mode disabled');
    };
    // Remove repetitive console logs - only show once on app load
  }

  const handleSubmitRequest = async (text: string) => {
    setIsProcessing(true);
    setProcessingSteps([]);
    setResult(null);
    setError(null);

    try {
      const request: EmergencyRequest = {
        id: `req-${Date.now()}`,
        text,
        timestamp: new Date(),
        location: text.toLowerCase().includes('islamabad') ? 'Islamabad' : 
                 text.toLowerCase().includes('rawalpindi') ? 'Rawalpindi' : undefined
      };

      // Process with live updates
      const coordinatorResult = await coordinator.processRequest(request);
      
      // Update processing steps in real-time (simulate)
      const updateInterval = setInterval(() => {
        setProcessingSteps([...coordinatorResult.processingTrace]);
      }, 500);

      // Clear interval after processing
      setTimeout(() => {
        clearInterval(updateInterval);
        setResult(coordinatorResult);
        setIsProcessing(false);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Frontline Worker Support AI</h1>
                <p className="text-sm text-gray-600">AI-Powered Emergency Response Coordination</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form and Processing */}
          <div className="space-y-6">
            <RequestForm 
              onSubmit={handleSubmitRequest}
              isProcessing={isProcessing}
            />
            
            <ProcessingStatus 
              steps={processingSteps}
              isActive={isProcessing}
            />

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-800 mb-2">Processing Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            {result && <ResultDisplay result={result} />}
            
            {!result && !isProcessing && (
              <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-90 text-center">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  AI Agents Ready
                </h3>
                <p className="text-gray-600">
                  Submit an emergency request to see the multi-agent system in action.
                  Try one of the example scenarios to get started quickly.
                </p>
                
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900">5 AI Agents</h4>
                    <p className="text-blue-700">Powered by Google Gemini AI</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900">Real-time Analysis</h4>
                    <p className="text-green-700">Intelligent emergency response coordination</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Emergency response coordination system powered by AI agents.
            For emergencies, please contact your local emergency services immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;