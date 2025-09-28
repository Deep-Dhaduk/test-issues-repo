import { createHmac, timingSafeEqual } from 'crypto';

export class WebhookVerifier {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  verifySignature(payload: string, signature: string): boolean {
    if (!signature) {
      return false;
    }

    // GitHub sends signature as "sha256=<hash>"
    if (!signature.startsWith('sha256=')) {
      return false;
    }

    const expectedSignature = signature.replace('sha256=', '');
    
    // Create HMAC hash
    const hmac = createHmac('sha256', this.secret);
    hmac.update(payload, 'utf8');
    const calculatedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const calculatedBuffer = Buffer.from(calculatedSignature, 'hex');

    // Ensure both buffers are the same length
    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, calculatedBuffer);
  }

  getSignature(payload: string): string {
    const hmac = createHmac('sha256', this.secret);
    hmac.update(payload, 'utf8');
    return `sha256=${hmac.digest('hex')}`;
  }
}
