import { GoogleGenerativeAI } from '@google/generative-ai';

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
            console.error('Gemini API Error (Triage):', error);
            return {
                success: false,
                error: `Gemini API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    async matchEmergencyServices(requestText: string, urgencyLevel: string, availableServices: any[]): Promise<GeminiResponse> {
        try {
            const servicesInfo = availableServices.map(s => ({
                id: s.serviceId,
                name: s.serviceName,
                type: s.serviceType,
                address: s.address,
                phone: s.phone
            }));

            const prompt = `
You are an expert emergency service coordinator for Pakistan. Match the following emergency request to the most appropriate service.

Emergency Request: "${requestText}"
Urgency Level: ${urgencyLevel}

Available Services:
${JSON.stringify(servicesInfo, null, 2)}

Please respond with ONLY a JSON object in this exact format:
{
  "selectedServiceId": "service-id",
  "reasoning": "Explanation of why this service is the best match",
  "confidence": 0.90,
  "alternativeServices": ["alt-service-id1", "alt-service-id2"]
}

Selection Criteria:
- High urgency: Prioritize emergency services and hospitals with trauma capabilities
- Car accidents/Vehicle crashes: Emergency services (emergency-001) for rescue/ambulance
- Medical issues: Hospitals and medical centers
- Crime/Safety/Robbery/Theft: Police services (police-001, police-002)
- Fire/Explosions/Smoke: Fire department (fire-001)
- Mental health issues: Specialized mental health services (mental-001)
- Consider location proximity (Islamabad/Rawalpindi context)

IMPORTANT: 
- For car accidents, crashes, or vehicle-related emergencies: Select emergency services (emergency-001)
- For crime, theft, robbery, violence, or safety issues: Select police service (police-001 or police-002)
- For medical emergencies without trauma: Select hospital services

Example mappings:
- "car accident", "crash", "collision" → emergency service
- "robbery", "theft", "crime" → police service
- "heart attack", "collapsed" → emergency or hospital
- "fire", "burning" → fire service
- "depression", "anxiety" → mental health service
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();

            console.log('Gemini Service Matching Response:', content); // Debug log

            return {
                success: true,
                content: content.trim()
            };

        } catch (error) {
            console.error('Gemini API Error (Service Matching):', error);
            return {
                success: false,
                error: `Gemini API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            console.error('Gemini API Error (Follow-up):', error);
            return {
                success: false,
                error: `Gemini API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            console.error('Gemini API Error (Equity Analysis):', error);
            return {
                success: false,
                error: `Gemini API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            console.error('Failed to parse Gemini JSON response:', error);
            console.error('Raw content:', content);
            throw new Error('Invalid JSON response from Gemini API');
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