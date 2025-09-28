import { WebhookVerifier } from '../../src/services/webhook-verifier';

describe('WebhookVerifier', () => {
  const secret = 'test-secret';
  const verifier = new WebhookVerifier(secret);

  describe('verifySignature', () => {
    it('should verify a valid signature', () => {
      const payload = '{"test": "data"}';
      const signature = verifier.getSignature(payload);
      
      expect(verifier.verifySignature(payload, signature)).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const payload = '{"test": "data"}';
      const invalidSignature = 'sha256=invalid-hash';
      
      expect(verifier.verifySignature(payload, invalidSignature)).toBe(false);
    });

    it('should reject a tampered payload', () => {
      const originalPayload = '{"test": "data"}';
      const tamperedPayload = '{"test": "tampered"}';
      const signature = verifier.getSignature(originalPayload);
      
      expect(verifier.verifySignature(tamperedPayload, signature)).toBe(false);
    });

    it('should reject empty signature', () => {
      const payload = '{"test": "data"}';
      
      expect(verifier.verifySignature(payload, '')).toBe(false);
    });

    it('should reject signature without sha256 prefix', () => {
      const payload = '{"test": "data"}';
      const signature = verifier.getSignature(payload).replace('sha256=', '');
      
      expect(verifier.verifySignature(payload, signature)).toBe(false);
    });

    it('should handle different payloads with same secret', () => {
      const payload1 = '{"event": "issues", "action": "opened"}';
      const payload2 = '{"event": "issues", "action": "closed"}';
      
      const signature1 = verifier.getSignature(payload1);
      const signature2 = verifier.getSignature(payload2);
      
      expect(verifier.verifySignature(payload1, signature1)).toBe(true);
      expect(verifier.verifySignature(payload2, signature2)).toBe(true);
      expect(verifier.verifySignature(payload1, signature2)).toBe(false);
      expect(verifier.verifySignature(payload2, signature1)).toBe(false);
    });
  });

  describe('getSignature', () => {
    it('should generate consistent signatures for same payload', () => {
      const payload = '{"test": "data"}';
      const signature1 = verifier.getSignature(payload);
      const signature2 = verifier.getSignature(payload);
      
      expect(signature1).toBe(signature2);
    });

    it('should generate different signatures for different payloads', () => {
      const payload1 = '{"test": "data1"}';
      const payload2 = '{"test": "data2"}';
      
      const signature1 = verifier.getSignature(payload1);
      const signature2 = verifier.getSignature(payload2);
      
      expect(signature1).not.toBe(signature2);
    });

    it('should generate signature with sha256 prefix', () => {
      const payload = '{"test": "data"}';
      const signature = verifier.getSignature(payload);
      
      expect(signature).toMatch(/^sha256=/);
    });

    it('should generate valid hex signature', () => {
      const payload = '{"test": "data"}';
      const signature = verifier.getSignature(payload);
      const hash = signature.replace('sha256=', '');
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
