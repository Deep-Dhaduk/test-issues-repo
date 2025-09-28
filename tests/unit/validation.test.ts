import {
  validateCreateIssueRequest,
  validateUpdateIssueRequest,
  validateCreateCommentRequest,
  validateIssueNumber,
  validatePaginationParams,
  ValidationError,
} from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('validateCreateIssueRequest', () => {
    it('should validate a valid create issue request', () => {
      const validRequest = {
        title: 'Test Issue',
        body: 'Test body',
        labels: ['bug', 'enhancement'],
      };

      const result = validateCreateIssueRequest(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should validate a minimal create issue request', () => {
      const minimalRequest = {
        title: 'Test Issue',
      };

      const result = validateCreateIssueRequest(minimalRequest);
      expect(result).toEqual({
        title: 'Test Issue',
        body: undefined,
        labels: undefined,
      });
    });

    it('should throw ValidationError for missing title', () => {
      const invalidRequest = {
        body: 'Test body',
      };

      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow('Title is required and must be a non-empty string');
    });

    it('should throw ValidationError for empty title', () => {
      const invalidRequest = {
        title: '',
      };

      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow('Title is required and must be a non-empty string');
    });

    it('should throw ValidationError for title too long', () => {
      const invalidRequest = {
        title: 'a'.repeat(201),
      };

      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow('Title must be 200 characters or less');
    });

    it('should throw ValidationError for invalid body type', () => {
      const invalidRequest = {
        title: 'Test Issue',
        body: 123,
      };

      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow('Body must be a string');
    });

    it('should throw ValidationError for body too long', () => {
      const invalidRequest = {
        title: 'Test Issue',
        body: 'a'.repeat(65537),
      };

      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow('Body must be 65536 characters or less');
    });

    it('should throw ValidationError for invalid labels type', () => {
      const invalidRequest = {
        title: 'Test Issue',
        labels: 'not-an-array',
      };

      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow('Labels must be an array');
    });

    it('should throw ValidationError for non-string labels', () => {
      const invalidRequest = {
        title: 'Test Issue',
        labels: ['valid', 123, 'also-valid'],
      };

      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateIssueRequest(invalidRequest)).toThrow('All labels must be strings');
    });
  });

  describe('validateUpdateIssueRequest', () => {
    it('should validate a valid update issue request', () => {
      const validRequest = {
        title: 'Updated Title',
        body: 'Updated body',
        state: 'closed',
      };

      const result = validateUpdateIssueRequest(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should validate partial update request', () => {
      const partialRequest = {
        title: 'Updated Title',
      };

      const result = validateUpdateIssueRequest(partialRequest);
      expect(result).toEqual(partialRequest);
    });

    it('should throw ValidationError for invalid state', () => {
      const invalidRequest = {
        state: 'invalid-state',
      };

      expect(() => validateUpdateIssueRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateUpdateIssueRequest(invalidRequest)).toThrow('State must be either "open" or "closed"');
    });

    it('should throw ValidationError for empty title', () => {
      const invalidRequest = {
        title: '',
      };

      expect(() => validateUpdateIssueRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateUpdateIssueRequest(invalidRequest)).toThrow('Title cannot be empty');
    });
  });

  describe('validateCreateCommentRequest', () => {
    it('should validate a valid create comment request', () => {
      const validRequest = {
        body: 'This is a comment',
      };

      const result = validateCreateCommentRequest(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should throw ValidationError for missing body', () => {
      const invalidRequest = {};

      expect(() => validateCreateCommentRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateCommentRequest(invalidRequest)).toThrow('Body is required and must be a non-empty string');
    });

    it('should throw ValidationError for empty body', () => {
      const invalidRequest = {
        body: '',
      };

      expect(() => validateCreateCommentRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateCommentRequest(invalidRequest)).toThrow('Body is required and must be a non-empty string');
    });

    it('should throw ValidationError for body too long', () => {
      const invalidRequest = {
        body: 'a'.repeat(65537),
      };

      expect(() => validateCreateCommentRequest(invalidRequest)).toThrow(ValidationError);
      expect(() => validateCreateCommentRequest(invalidRequest)).toThrow('Body must be 65536 characters or less');
    });
  });

  describe('validateIssueNumber', () => {
    it('should validate a valid issue number', () => {
      expect(validateIssueNumber('123')).toBe(123);
      expect(validateIssueNumber('1')).toBe(1);
    });

    it('should throw ValidationError for invalid issue number', () => {
      expect(() => validateIssueNumber('0')).toThrow(ValidationError);
      expect(() => validateIssueNumber('-1')).toThrow(ValidationError);
      expect(() => validateIssueNumber('abc')).toThrow(ValidationError);
      expect(() => validateIssueNumber('1.5')).toThrow(ValidationError);
    });
  });

  describe('validatePaginationParams', () => {
    it('should validate valid pagination params', () => {
      const validParams = {
        page: '2',
        per_page: '50',
        state: 'open',
        labels: 'bug,enhancement',
      };

      const result = validatePaginationParams(validParams);
      expect(result).toEqual({
        page: 2,
        per_page: 50,
        state: 'open',
        labels: 'bug,enhancement',
      });
    });

    it('should handle empty params', () => {
      const result = validatePaginationParams({});
      expect(result).toEqual({});
    });

    it('should throw ValidationError for invalid page', () => {
      expect(() => validatePaginationParams({ page: '0' })).toThrow(ValidationError);
      expect(() => validatePaginationParams({ page: '-1' })).toThrow(ValidationError);
      expect(() => validatePaginationParams({ page: 'abc' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid per_page', () => {
      expect(() => validatePaginationParams({ per_page: '0' })).toThrow(ValidationError);
      expect(() => validatePaginationParams({ per_page: '101' })).toThrow(ValidationError);
      expect(() => validatePaginationParams({ per_page: 'abc' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid state', () => {
      expect(() => validatePaginationParams({ state: 'invalid' })).toThrow(ValidationError);
    });
  });
});
