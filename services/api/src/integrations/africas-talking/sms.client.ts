import { config } from '../../config/index.js';
import { logger } from '../../lib/logger.js';
import { maskPhone } from '@fundi-wangu/utils';

/**
 * Africa's Talking SMS client.
 * Used for OTP delivery and critical Fundi notifications (feature phone support).
 * SMS is mandatory for job alerts — Mafundi may be on feature phones.
 */
class SmsClient {
  private isConfigured(): boolean {
    return !!(config.AT_API_KEY && config.AT_USERNAME !== 'sandbox');
  }

  /** Send a raw SMS message */
  async sendSms(phone: string, message: string): Promise<void> {
    if (!this.isConfigured()) {
      logger.info({
        event: 'sms.dev_mode',
        phone: maskPhone(phone),
        message: message.slice(0, 50),
      });
      return;
    }

    logger.info({
      event: 'sms.sending',
      phone: maskPhone(phone),
    });

    // Production: POST to Africa's Talking API
    // https://africastalking.com/docs/sms/sending
    throw new Error("Africa's Talking production integration pending");
  }

  /** Send OTP via SMS with Fundi Wangu branding */
  async sendOtp(phone: string, code: string): Promise<void> {
    const message = `Fundi Wangu: Nambari yako ya uthibitishaji ni ${code}. Inaisha baada ya dakika 5.`;

    if (!this.isConfigured()) {
      logger.info({
        event: 'otp.dev_mode',
        phone: maskPhone(phone),
        code,
      });
      return;
    }

    await this.sendSms(phone, message);
  }
}

export const smsClient = new SmsClient();
