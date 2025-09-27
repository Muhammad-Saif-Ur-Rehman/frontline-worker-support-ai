import { ServiceMatch } from '../types';

// Service database with location-aware data
export const SERVICES: ServiceMatch[] = [
  // Hospitals
  {
    serviceId: 'hospital-001',
    serviceName: 'Pakistan Institute of Medical Sciences (PIMS)',
    serviceType: 'hospital',
    address: 'G-8/3, Islamabad',
    phone: '+92-51-926-1170',
    availability: true,
    confidence: 0.95,
    // Location data for proximity matching
    city: 'Islamabad',
    coordinates: { lat: 33.6938, lng: 73.0651 },
    coverage: ['Islamabad', 'G-8', 'G-7', 'G-6', 'F-8', 'F-7', 'F-6']
  },
  {
    serviceId: 'hospital-002', 
    serviceName: 'Shifa International Hospital',
    serviceType: 'hospital',
    address: 'H-8/4, Islamabad',
    phone: '+92-51-846-4646',
    availability: true,
    confidence: 0.92,
    city: 'Islamabad',
    coordinates: { lat: 33.6515, lng: 73.0746 },
    coverage: ['Islamabad', 'H-8', 'H-9', 'I-8', 'I-9', 'G-8', 'G-9']
  },
  {
    serviceId: 'hospital-003',
    serviceName: 'Combined Military Hospital (CMH)',
    serviceType: 'hospital', 
    address: 'E-7, Rawalpindi',
    phone: '+92-51-907-0601',
    availability: true,
    confidence: 0.88,
    city: 'Rawalpindi',
    coordinates: { lat: 33.5651, lng: 73.0169 },
    coverage: ['Rawalpindi', 'E-7', 'E-8', 'F-7', 'Saddar', 'Mall Road']
  },
  
  // Emergency Services
  {
    serviceId: 'emergency-001',
    serviceName: 'Rescue 1122 Islamabad',
    serviceType: 'emergency',
    address: 'Multiple locations citywide',
    phone: '1122',
    availability: true,
    confidence: 0.98,
    city: 'Islamabad',
    coordinates: { lat: 33.6844, lng: 73.0479 }, // Central Islamabad
    coverage: ['Islamabad', 'all sectors', 'citywide coverage']
  },
  {
    serviceId: 'emergency-002',
    serviceName: 'Edhi Ambulance Service',
    serviceType: 'emergency',
    address: 'F-6/1, Islamabad',
    phone: '+92-51-111-133-442',
    availability: true,
    confidence: 0.94,
    city: 'Islamabad',
    coordinates: { lat: 33.7164, lng: 73.0614 },
    coverage: ['Islamabad', 'Rawalpindi', 'F-6', 'F-7', 'F-8', 'G-6', 'G-7']
  },
  
  // Police
  {
    serviceId: 'police-001',
    serviceName: 'Islamabad Police Emergency',
    serviceType: 'police',
    address: 'G-6/4, Islamabad',
    phone: '15',
    availability: true,
    confidence: 0.96,
    city: 'Islamabad',
    coordinates: { lat: 33.7094, lng: 73.0487 },
    coverage: ['Islamabad', 'all sectors', 'federal capital area']
  },
  {
    serviceId: 'police-002',
    serviceName: 'Rawalpindi Police Station',
    serviceType: 'police',
    address: 'Saddar, Rawalpindi',
    phone: '+92-51-555-0100',
    availability: true,
    confidence: 0.89,
    city: 'Rawalpindi',
    coordinates: { lat: 33.5983, lng: 73.0408 },
    coverage: ['Rawalpindi', 'Saddar', 'Mall Road', 'Cantonment', 'Committee Chowk']
  },
  
  // Fire Department
  {
    serviceId: 'fire-001',
    serviceName: 'Capital Development Authority Fire Service',
    serviceType: 'fire',
    address: 'G-7/1, Islamabad',
    phone: '+92-51-925-5100',
    availability: true,
    confidence: 0.93,
    city: 'Islamabad',
    coordinates: { lat: 33.7137, lng: 73.0370 },
    coverage: ['Islamabad', 'CDA sectors', 'G-7', 'G-8', 'F-7', 'F-8']
  },
  
  // Mental Health
  {
    serviceId: 'mental-001',
    serviceName: 'Institute of Psychiatry & Behavioral Sciences',
    serviceType: 'mental_health',
    address: 'PIMS Hospital, G-8/3, Islamabad',
    phone: '+92-51-926-1170',
    availability: true,
    confidence: 0.87,
    city: 'Islamabad',
    coordinates: { lat: 33.6938, lng: 73.0651 }, // Same as PIMS
    coverage: ['Islamabad', 'Rawalpindi', 'G-8', 'G-7', 'federal area']
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

// Location-aware service matching utilities
export const LOCATION_KEYWORDS = {
  islamabad: ['islamabad', 'isb', 'pims', 'shifa', 'g-8', 'g-7', 'g-6', 'f-8', 'f-7', 'f-6', 'h-8', 'h-9', 'i-8', 'i-9', 'blue area', 'jinnah avenue', 'constitution avenue'],
  rawalpindi: ['rawalpindi', 'pindi', 'cmh', 'saddar', 'mall road', 'e-7', 'e-8', 'cantonment', 'committee chowk', 'murree road']
};

// Function to calculate rough distance between two coordinates (in km)
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Function to infer user location from text
export const inferLocationFromText = (text: string): { city: string; coordinates?: { lat: number; lng: number } } => {
  const lowerText = text.toLowerCase();
  
  // Check for Islamabad keywords
  for (const keyword of LOCATION_KEYWORDS.islamabad) {
    if (lowerText.includes(keyword)) {
      return { city: 'Islamabad', coordinates: { lat: 33.6844, lng: 73.0479 } };
    }
  }
  
  // Check for Rawalpindi keywords
  for (const keyword of LOCATION_KEYWORDS.rawalpindi) {
    if (lowerText.includes(keyword)) {
      return { city: 'Rawalpindi', coordinates: { lat: 33.5983, lng: 73.0408 } };
    }
  }
  
  // Default to Islamabad if no specific location found
  return { city: 'Islamabad', coordinates: { lat: 33.6844, lng: 73.0479 } };
};

// Function to filter and sort services by proximity
export const getServicesByProximity = (
  services: ServiceMatch[],
  userLocation: { city: string; coordinates?: { lat: number; lng: number } },
  serviceType?: string
): ServiceMatch[] => {
  let filteredServices = services.filter(s => s.availability);
  
  // Filter by service type if specified
  if (serviceType) {
    filteredServices = filteredServices.filter(s => s.serviceType === serviceType);
  }
  
  // Add distance calculation and sort by proximity
  const servicesWithDistance = filteredServices.map(service => {
    let distance = 999; // Default high distance
    
    // Prefer same city services
    if (service.city === userLocation.city) {
      distance = 1; // Low distance for same city
      
      // Calculate actual distance if coordinates are available
      if (userLocation.coordinates && service.coordinates) {
        distance = calculateDistance(
          userLocation.coordinates.lat,
          userLocation.coordinates.lng,
          service.coordinates.lat,
          service.coordinates.lng
        );
      }
    } else {
      // Higher distance for different city
      distance = 50;
      
      // Calculate cross-city distance if coordinates available
      if (userLocation.coordinates && service.coordinates) {
        distance = calculateDistance(
          userLocation.coordinates.lat,
          userLocation.coordinates.lng,
          service.coordinates.lat,
          service.coordinates.lng
        );
      }
    }
    
    return {
      ...service,
      distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
    };
  });
  
  // Sort by distance (nearest first), then by confidence
  return servicesWithDistance.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return b.confidence - a.confidence;
  });
};