import React from 'react';
import { CoordinatorResult } from '../types';
import { 
  CheckCircle, 
  Clock, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  Shield,
  FileText
} from 'lucide-react';

interface ResultDisplayProps {
  result: CoordinatorResult;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 backdrop-blur-sm bg-opacity-90">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Request Processed Successfully</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Urgency & Service */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Urgency Level</label>
              <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 font-semibold ${getUrgencyColor(result.finalUrgency)}`}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                {result.finalUrgency} Priority
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Selected Service</label>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">{result.selectedService.serviceName}</h3>
                <div className="flex items-center text-blue-700 mt-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{result.selectedService.address}</span>
                </div>
                <div className="flex items-center text-blue-700 mt-1">
                  <Phone className="h-4 w-4 mr-1" />
                  <span className="text-sm">{result.selectedService.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Booking Information</label>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-900">Booking Confirmed</span>
                </div>
                <p className="text-sm text-green-800 mb-2">
                  <strong>ID:</strong> {result.booking.bookingId}
                </p>
                <div className="flex items-center text-green-700">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">{result.booking.scheduledTime}</span>
                </div>
              </div>
            </div>

            {result.conflicts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Meta-Agent Conflict Resolution</label>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Shield className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="font-semibold text-orange-900">Coordinator Override</span>
                  </div>
                  {result.conflicts.map((conflict, index) => (
                    <p key={index} className="text-sm text-orange-800 mb-1">
                      {conflict}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Message */}
      <div className="bg-white rounded-2xl shadow-xl p-6 backdrop-blur-sm bg-opacity-90">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Confirmation & Instructions
        </h3>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <pre className="whitespace-pre-wrap text-blue-900 font-medium">
            {result.followUp.message}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Action Items:</h4>
            <ul className="space-y-1">
              {result.followUp.actions.map((action, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Next Steps:</h4>
            <ul className="space-y-1">
              {result.followUp.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {result.followUp.emergencyContacts && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Emergency Contacts:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.followUp.emergencyContacts.map((contact, index) => (
                <p key={index} className="text-sm text-red-700 font-medium">
                  {contact}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Equity & System Info */}
      <div className="bg-white rounded-2xl shadow-xl p-6 backdrop-blur-sm bg-opacity-90">
        <h3 className="text-xl font-bold text-gray-800 mb-4">System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800">Fairness Score</h4>
            <p className="text-2xl font-bold text-green-600">
              {(result.equityLog.fairnessScore * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800">Response Time</h4>
            <p className="text-2xl font-bold text-blue-600">
              {(result.equityLog.responseTime / 1000).toFixed(1)}s
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800">Processing Steps</h4>
            <p className="text-2xl font-bold text-purple-600">
              {result.processingTrace.length}
            </p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-4">{result.equityLog.notes}</p>
      </div>
    </div>
  );
};