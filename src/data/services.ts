import { ServiceMatch } from '../types';

// Mock service database
export const SERVICES: ServiceMatch[] = [
  // Hospitals
  {
    serviceId: 'hospital-001',
    serviceName: 'Pakistan Institute of Medical Sciences (PIMS)',
    serviceType: 'hospital',
    address: 'G-8/3, Islamabad',
    phone: '+92-51-926-1170',
    availability: true,
    confidence: 0.95
  },
  {
    serviceId: 'hospital-002', 
    serviceName: 'Shifa International Hospital',
    serviceType: 'hospital',
    address: 'H-8/4, Islamabad',
    phone: '+92-51-846-4646',
    availability: true,
    confidence: 0.92
  },
  {
    serviceId: 'hospital-003',
    serviceName: 'Combined Military Hospital (CMH)',
    serviceType: 'hospital', 
    address: 'E-7, Rawalpindi',
    phone: '+92-51-907-0601',
    availability: true,
    confidence: 0.88
  },
  
  // Emergency Services
  {
    serviceId: 'emergency-001',
    serviceName: 'Rescue 1122 Islamabad',
    serviceType: 'emergency',
    address: 'Multiple locations citywide',
    phone: '1122',
    availability: true,
    confidence: 0.98
  },
  {
    serviceId: 'emergency-002',
    serviceName: 'Edhi Ambulance Service',
    serviceType: 'emergency',
    address: 'F-6/1, Islamabad',
    phone: '+92-51-111-133-442',
    availability: true,
    confidence: 0.94
  },
  
  // Police
  {
    serviceId: 'police-001',
    serviceName: 'Islamabad Police Emergency',
    serviceType: 'police',
    address: 'G-6/4, Islamabad',
    phone: '15',
    availability: true,
    confidence: 0.96
  },
  {
    serviceId: 'police-002',
    serviceName: 'Rawalpindi Police Station',
    serviceType: 'police',
    address: 'Saddar, Rawalpindi',
    phone: '+92-51-555-0100',
    availability: true,
    confidence: 0.89
  },
  
  // Fire Department
  {
    serviceId: 'fire-001',
    serviceName: 'Capital Development Authority Fire Service',
    serviceType: 'fire',
    address: 'G-7/1, Islamabad',
    phone: '+92-51-925-5100',
    availability: true,
    confidence: 0.93
  },
  
  // Mental Health
  {
    serviceId: 'mental-001',
    serviceName: 'Institute of Psychiatry & Behavioral Sciences',
    serviceType: 'mental_health',
    address: 'PIMS Hospital, G-8/3, Islamabad',
    phone: '+92-51-926-1170',
    availability: true,
    confidence: 0.87
  }
];

// Keywords for service matching
export const SERVICE_KEYWORDS = {
  hospital: ['collapsed', 'unconscious', 'heart attack', 'stroke', 'bleeding', 'accident', 'injured', 'pain', 'sick', 'fever'],
  emergency: ['emergency', 'urgent', 'critical', 'life threatening', 'ambulance', 'rescue', 'immediate'],
  police: ['robbery', 'theft', 'violence', 'assault', 'crime', 'suspicious', 'harassment', 'fraud'],
  fire: ['fire', 'smoke', 'burning', 'explosion', 'gas leak', 'electrical'],
  mental_health: ['depression', 'anxiety', 'suicide', 'mental health', 'counseling', 'therapy', 'psychological']
};

// Urgency keywords for rule-based fallback
export const URGENCY_KEYWORDS = {
  high: ['collapsed', 'unconscious', 'heart attack', 'stroke', 'emergency', 'critical', 'life threatening', 'bleeding heavily', 'suicide'],
  medium: ['accident', 'injured', 'pain', 'fever', 'robbery', 'fire', 'urgent'],
  low: ['appointment', 'check up', 'consultation', 'information', 'minor']
};