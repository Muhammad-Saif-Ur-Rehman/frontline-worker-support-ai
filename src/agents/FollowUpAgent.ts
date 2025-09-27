import { BookingRecord, ServiceMatch, FollowUpMessage, AgentResponse } from '../types';

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

      // Simulate AI message generation
      await new Promise(resolve => setTimeout(resolve, 600));

      const message = this.generateConfirmationMessage(booking, service);
      const actions = this.generateActionItems(booking, service);
      const nextSteps = this.generateNextSteps(booking, service);
      const emergencyContacts = this.getEmergencyContacts(service);

      const followUp: FollowUpMessage = {
        message,
        actions,
        nextSteps,
        emergencyContacts
      };

      return {
        success: true,
        data: followUp,
        reasoning: `Generated personalized follow-up message with specific instructions for ${service.serviceType} service.`,
        confidence: 0.92,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: `Follow-up generation failed: ${error}`,
        reasoning: 'Error in automated follow-up system',
        confidence: 0,
        processingTime: Date.now() - startTime
      };
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
      steps.push('Service provider will confirm appointment details');
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