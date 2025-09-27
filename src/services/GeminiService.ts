import { GoogleGenerativeAI } from '@google/generative-ai';
import { SERVICES } from '../data/services';
import { getLocationService, LocationCoordinates, NearbyService } from './LocationService';

interface GeminiResponse {
    success: boolean;
    content?: string;
    error?: string;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = import.meta.env.VITE_GEMINI_KEY || process.env.GEMINI_KEY;

        if (!apiKey) {
            throw new Error('Gemini API key not found. Please set VITE_GEMINI_KEY or GEMINI_KEY environment variable.');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    }

    async analyzeEmergencyTriage(requestText: string, location?: string): Promise<GeminiResponse> {
        try {
            const prompt = `
You are an expert emergency triage AI assistant for Pakistani emergency services. Analyze the following emergency request and determine the urgency level.

Emergency Request: "${requestText}"
Location: ${location || 'Not specified'}

Please analyze and respond with ONLY a JSON object in this exact format:
{
  "urgency": "High" | "Medium" | "Low",
  "confidence": 0.85,
  "reasoning": "Brief explanation of urgency classification",
  "keywords": ["keyword1", "keyword2"],
  "medicalIndicators": ["indicator1", "indicator2"]
}

Classification Guidelines:
- High: Life-threatening emergencies (heart attack, unconscious, severe bleeding, suicide risk, major accidents)
- Medium: Urgent but not immediately life-threatening (injuries, moderate pain, minor accidents, robbery, theft, crime)
- Low: Non-urgent requests (routine appointments, information, minor issues)

IMPORTANT: Classify robbery, theft, and other crimes as Medium urgency (not High unless there are injuries involved).

Example classifications:
- "robbery", "theft", "crime" → Medium urgency
- "heart attack", "collapsed", "unconscious" → High urgency
- "check-up", "appointment" → Low urgency

Consider Pakistani context and emergency service availability in your analysis.
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();

            console.log('Gemini Triage Analysis Response:', content); // Debug log

            return {
                success: true,
                content: content.trim()
            };

        } catch (error) {
            // Clean error handling - no verbose error logs in production
            return {
                success: false,
                error: 'AI service temporarily unavailable'
            };
        }
    }

    async matchEmergencyServices(requestText: string, urgencyLevel: string, location?: string): Promise<GeminiResponse> {
        try {
            const locationService = getLocationService();
            
            // Step 1: Geocode the user's location
            let userLocation: LocationCoordinates | null = null;
            if (location) {
                userLocation = await locationService.geocodeLocation(location);
            }
            
            // Step 2: Determine appropriate service types based on emergency description
            const requiredServiceTypes = locationService.getServiceTypesForEmergency(requestText, urgencyLevel);
            console.log('Required service types:', requiredServiceTypes);
            
            // Step 3: Find nearest services for each required type
            const nearbyServices: NearbyService[] = [];
            
            for (const serviceType of requiredServiceTypes) {
                if (userLocation) {
                    const servicesForType = await locationService.findNearestServices(
                        userLocation, 
                        serviceType, 
                        SERVICES,
                        3 // Get top 3 nearest for each type
                    );
                    nearbyServices.push(...servicesForType);
                }
            }
            
            // Fallback if no user location or no nearby services found
            if (nearbyServices.length === 0) {
                const fallbackServices = SERVICES
                    .filter(service => 
                        service.availability && 
                        requiredServiceTypes.some(type => type === 'all' || service.serviceType === type)
                    )
                    .slice(0, 5)
                    .map(service => ({
                        ...service,
                        distance: 10, // Default distance
                        travelTime: '15-20 min'
                    }));
                
                nearbyServices.push(...fallbackServices);
            }
            
            // Step 4: Remove duplicates and sort by distance
            const uniqueServices = nearbyServices
                .filter((service, index, self) => 
                    self.findIndex(s => s.serviceId === service.serviceId) === index
                )
                .sort((a, b) => a.distance - b.distance);

            console.log(`Found ${uniqueServices.length} nearby services for emergency types: ${requiredServiceTypes.join(', ')}`);

            // Step 5: Use AI to make final selection with enhanced prompt
            const servicesInfo = uniqueServices.map(s => ({
                id: s.serviceId,
                name: s.serviceName,
                type: s.serviceType,
                address: s.address,
                phone: s.phone,
                city: s.city,
                distance: s.distance,
                travelTime: s.travelTime
            }));

            const prompt = `
You are an expert emergency service coordinator for Pakistan. Based on the emergency analysis, select the MOST APPROPRIATE service.

Emergency Request: "${requestText}"
Urgency Level: ${urgencyLevel}
User Location: ${location || 'Not specified'}
Required Service Types: ${requiredServiceTypes.join(', ')}

Available Services (pre-filtered and sorted by proximity):
${JSON.stringify(servicesInfo, null, 2)}

CRITICAL SERVICE TYPE ROUTING RULES:
1. ACCIDENTS (car accidents, vehicle crashes, collisions):
   - PRIMARY: Emergency services (Rescue 1122) for immediate rescue/ambulance
   - SECONDARY: Hospitals only if no emergency services nearby
   - NEVER route to police unless specifically mentioned crime/hit-and-run

2. MEDICAL EMERGENCIES (heart attack, stroke, unconscious, bleeding):
   - HIGH URGENCY: Emergency services (Rescue 1122) + Hospital
   - MEDIUM/LOW: Hospital or emergency services

3. CRIME (robbery, theft, violence, assault):
   - PRIMARY: Police services
   - Consider proximity within same city

4. FIRE EMERGENCIES:
   - PRIMARY: Fire department services

5. MENTAL HEALTH:
   - PRIMARY: Mental health specialized services
   - SECONDARY: General hospitals

PROXIMITY PRIORITY:
- Services under 5km: Strongly preferred
- Services 5-15km: Acceptable for specialized care
- Services >15km: Only if no alternatives in required service type

Please respond with ONLY a JSON object:
{
  "selectedServiceId": "service-id",
  "reasoning": "Emergency type requires [service type] - selected closest available service at [distance]km",
  "confidence": 0.90,
  "emergencyType": "accident|medical|crime|fire|mental_health",
  "alternativeServices": ["alt-service-id1", "alt-service-id2"]
}

REMEMBER: For accidents, prioritize emergency/rescue services over police or general hospitals.
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();

            return {
                success: true,
                content: content.trim()
            };

        } catch (error) {
            console.warn('AI service matching failed:', error);
            return {
                success: false,
                error: 'AI service temporarily unavailable'
            };
        }
    }

    async generateFollowUpMessage(
        requestText: string,
        selectedService: any,
        bookingDetails: any,
        urgencyLevel: string
    ): Promise<GeminiResponse> {
        try {
            const prompt = `
You are a compassionate emergency response coordinator creating a personalized follow-up message for a Pakistani emergency services user.

Original Request: "${requestText}"
Selected Service: ${selectedService.serviceName} (${selectedService.serviceType})
Service Contact: ${selectedService.phone}
Service Address: ${selectedService.address}
Booking ID: ${bookingDetails.bookingId}
Scheduled Time: ${bookingDetails.scheduledTime}
Urgency Level: ${urgencyLevel}

Create a warm, professional follow-up message that includes:
1. Confirmation of request processing
2. Service details and booking information
3. Next steps and what to expect
4. Relevant action items for the specific service type
5. Emergency contacts if situation worsens

Please respond with ONLY a JSON object in this exact format:
{
  "message": "The main follow-up message (can include emojis)",
  "actions": ["Action item 1", "Action item 2", "Action item 3"],
  "nextSteps": ["Next step 1", "Next step 2"],
  "emergencyContacts": ["Emergency: 1122", "Service contact"],
  "estimatedResponse": "Expected response timeframe"
}

Consider:
- Pakistani cultural context and respectful communication
- Urgency level appropriate messaging
- Service-specific instructions (hospital vs emergency vs police)
- Clear, actionable guidance
- Empathetic tone for emergency situations
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();

            return {
                success: true,
                content: content.trim()
            };

        } catch (error) {
            return {
                success: false,
                error: 'AI service temporarily unavailable'
            };
        }
    }

    async analyzeEquityImpact(
        requestText: string,
        selectedService: any,
        responseTime: number,
        location?: string
    ): Promise<GeminiResponse> {
        try {
            const prompt = `
You are an equity and fairness analyst for Pakistani emergency services. Analyze the following emergency response for potential bias or equity concerns.

Request: "${requestText}"
Selected Service: ${selectedService.serviceName} (${selectedService.serviceType})
Response Time: ${responseTime}ms
Location: ${location || 'Not specified'}

Analyze for equity considerations including:
- Service accessibility
- Response time fairness
- Geographic equity (urban vs rural)
- Service quality consistency
- Potential demographic factors

Please respond with ONLY a JSON object in this exact format:
{
  "fairnessScore": 0.85,
  "equityFactors": ["factor1", "factor2"],
  "potentialBias": ["bias1", "bias2"] or [],
  "recommendations": ["recommendation1", "recommendation2"],
  "notes": "Brief analysis of equity considerations"
}

Fairness Score (0-1):
- 0.9-1.0: Excellent equity
- 0.7-0.89: Good equity
- 0.5-0.69: Fair equity, some concerns
- Below 0.5: Poor equity, needs attention

Focus on systemic fairness, not individual characteristics.
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();

            return {
                success: true,
                content: content.trim()
            };

        } catch (error) {
            return {
                success: false,
                error: 'AI service temporarily unavailable'
            };
        }
    }

    // Utility method to safely parse JSON responses
    parseJsonResponse(content: string): any {
        try {
            // Remove any markdown code blocks
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanContent);
        } catch (error) {
            // Clean error handling - don't log parsing failures in production
            throw new Error('Invalid AI response format');
        }
    }
}

// Singleton instance
let geminiService: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
    if (!geminiService) {
        geminiService = new GeminiService();
    }
    return geminiService;
};