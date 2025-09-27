// Core types for the Frontline AI system
export interface EmergencyRequest {
  id: string;
  text: string;
  timestamp: Date;
  location?: string;
}

export interface TriageResult {
  urgency: 'High' | 'Medium' | 'Low';
  confidence: number;
  reasoning: string;
  keywords: string[];
}

export interface ServiceMatch {
  serviceId: string;
  serviceName: string;
  serviceType: 'hospital' | 'emergency' | 'police' | 'fire' | 'mental_health';
  address: string;
  phone: string;
  availability: boolean;
  distance?: number;
  confidence: number;
  // Location-aware fields for proximity matching
  city?: string;
  coordinates?: { lat: number; lng: number };
  coverage?: string[];
}

export interface BookingRecord {
  bookingId: string;
  serviceId: string;
  urgency: string;
  requestText: string;
  scheduledTime?: string;
  status: 'confirmed' | 'pending' | 'failed';
  createdAt: Date;
}

export interface FollowUpMessage {
  message: string;
  actions: string[];
  nextSteps: string[];
  emergencyContacts?: string[];
}

export interface EquityLog {
  requestId: string;
  demographic?: string;
  serviceType: string;
  responseTime: number;
  fairnessScore: number;
  notes: string;
}

export interface ProcessingStep {
  agent: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
  reasoning?: string;
  timestamp: Date;
  duration?: number;
}

export interface CoordinatorResult {
  requestId: string;
  finalUrgency: string;
  selectedService: ServiceMatch;
  booking: BookingRecord;
  followUp: FollowUpMessage;
  equityLog: EquityLog;
  processingTrace: ProcessingStep[];
  mode: 'normal' | 'degraded';
  conflicts: string[];
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  reasoning: string;
  confidence: number;
  processingTime: number;
}