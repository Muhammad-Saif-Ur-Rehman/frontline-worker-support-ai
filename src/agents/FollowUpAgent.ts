import { BookingRecord, ServiceMatch, FollowUpMessage, AgentResponse } from '../types';
import { getGeminiService } from '../services/GeminiService';

export class FollowUpAgent {
  async generateFollowUp(
    booking: BookingRecord,
    service: ServiceMatch,
    isDegraded = false
  ): Promise<AgentResponse<FollowUpMessage>> {
    const startTime = Date.now();

    try {
      if (isDegraded) {
        return this.degradedFollowUp(booking, service, startTime);
      }

      // Use real AI processing with Gemini
      const geminiService = getGeminiService();
      
      const aiResponse = await geminiService.generateFollowUpMessage(
        booking.requestText,
        service,
        booking,
        booking.urgency
      );

      if (!aiResponse.success || !aiResponse.content) {
        return this.degradedFollowUp(booking, service, startTime);
      }

      try {
        const aiAnalysis = geminiService.parseJsonResponse(aiResponse.content);
        
        const followUp: FollowUpMessage = {
          message: aiAnalysis.message || this.generateConfirmationMessage(booking, service),
          actions: aiAnalysis.actions || this.generateActionItems(booking, service),
          nextSteps: aiAnalysis.nextSteps || this.generateNextSteps(booking, service),
          emergencyContacts: aiAnalysis.emergencyContacts || this.getEmergencyContacts(service)
        };

        return {
          success: true,
          data: followUp,
          reasoning: `AI-Generated personalized follow-up message with specific instructions for ${service.serviceType} service.`,
          confidence: 0.92,
          processingTime: Date.now() - startTime
        };

      } catch (parseError) {
        return this.degradedFollowUp(booking, service, startTime);
      }

    } catch (error) {
      return this.degradedFollowUp(booking, service, startTime);
    }
  }

  private degradedFollowUp(
    booking: BookingRecord,
    service: ServiceMatch,
    startTime: number
  ): AgentResponse<FollowUpMessage> {
    const followUp: FollowUpMessage = {
      message: `✅ Your request has been processed. Booking ID: ${booking.bookingId}. Please contact ${service.serviceName} at ${service.phone} for confirmation.`,
      actions: ['Contact service provider', 'Keep booking ID ready'],
      nextSteps: ['Wait for service confirmation'],
      emergencyContacts: ['Emergency: 1122']
    };

    return {
      success: true,
      data: followUp,
      reasoning: `DEGRADED MODE: Basic follow-up message generated with essential contact information.`,
      confidence: 0.5,
      processingTime: Date.now() - startTime
    };
  }

  private generateConfirmationMessage(booking: BookingRecord, service: ServiceMatch): string {
    const urgencyEmoji = booking.urgency === 'High' ? '🚨' : booking.urgency === 'Medium' ? '⚠️' : '✅';
    
    let message = `${urgencyEmoji} Booking Confirmed\n\n`;
    message += `📋 Booking ID: ${booking.bookingId}\n`;
    message += `🏥 Service: ${service.serviceName}\n`;
    message += `📍 Location: ${service.address}\n`;
    message += `📞 Contact: ${service.phone}\n`;
    
    if (booking.scheduledTime) {
      message += `⏰ Scheduled: ${booking.scheduledTime}\n`;
    }
    
    message += `\n📝 Your request: "${booking.requestText}"`;
    
    return message;
  }

  private generateActionItems(booking: BookingRecord, service: ServiceMatch): string[] {
    const actions = [];
    
    actions.push('Keep this booking ID safe: ' + booking.bookingId);
    
    if (service.serviceType === 'hospital') {
      actions.push('Bring valid ID and any medical records');
      actions.push('Prepare list of current medications');
      actions.push('Have emergency contact information ready');
    } else if (service.serviceType === 'emergency') {
      actions.push('Stay calm and wait for emergency team');
      actions.push('Keep phone accessible for updates');
      actions.push('Clear access path if possible');
    } else if (service.serviceType === 'police') {
      actions.push('Gather any relevant documents or evidence');
      actions.push('Prepare to provide detailed statement');
      actions.push('Stay in safe location');
    }
    
    return actions;
  }

  private generateNextSteps(booking: BookingRecord, service: ServiceMatch): string[] {
    const steps = [];
    
    if (booking.urgency === 'High') {
      steps.push('Emergency team will contact you within 15 minutes');
      steps.push('If condition worsens, call emergency line immediately');
    } else {
      steps.push(`${service.serviceName} will confirm appointment details`);
      steps.push('You will receive SMS confirmation');
      steps.push('Arrive 15 minutes early for your appointment');
    }
    
    return steps;
  }

  private getEmergencyContacts(service: ServiceMatch): string[] {
    const contacts = [];
    
    contacts.push('Emergency Services: 1122');
    contacts.push('Police: 15');
    contacts.push(`${service.serviceName}: ${service.phone}`);
    
    return contacts;
  }
}