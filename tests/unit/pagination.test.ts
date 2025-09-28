import { parseLinkHeader, extractPaginationFromResponse, createPaginationHeaders } from '../../src/utils/pagination';

describe('Pagination Utils', () => {
  describe('parseLinkHeader', () => {
    it('should parse valid link header with all links', () => {
      const linkHeader = '<https://api.github.com/repos/owner/repo/issues?page=2>; rel="next", <https://api.github.com/repos/owner/repo/issues?page=5>; rel="last", <https://api.github.com/repos/owner/repo/issues?page=1>; rel="first", <https://api.github.com/repos/owner/repo/issues?page=1>; rel="prev"';
      
      const result = parseLinkHeader(linkHeader);
      
      expect(result).toEqual({
        next: 'https://api.github.com/repos/owner/repo/issues?page=2',
        last: 'https://api.github.com/repos/owner/repo/issues?page=5',
        first: 'https://api.github.com/repos/owner/repo/issues?page=1',
        prev: 'https://api.github.com/repos/owner/repo/issues?page=1',
      });
    });

    it('should parse link header with only next and last', () => {
      const linkHeader = '<https://api.github.com/repos/owner/repo/issues?page=2>; rel="next", <https://api.github.com/repos/owner/repo/issues?page=5>; rel="last"';
      
      const result = parseLinkHeader(linkHeader);
      
      expect(result).toEqual({
        next: 'https://api.github.com/repos/owner/repo/issues?page=2',
        last: 'https://api.github.com/repos/owner/repo/issues?page=5',
      });
    });

    it('should parse link header with only prev and first', () => {
      const linkHeader = '<https://api.github.com/repos/owner/repo/issues?page=1>; rel="first", <https://api.github.com/repos/owner/repo/issues?page=1>; rel="prev"';
      
      const result = parseLinkHeader(linkHeader);
      
      expect(result).toEqual({
        first: 'https://api.github.com/repos/owner/repo/issues?page=1',
        prev: 'https://api.github.com/repos/owner/repo/issues?page=1',
      });
    });

    it('should handle empty link header', () => {
      const result = parseLinkHeader('');
      
      expect(result).toEqual({});
    });

    it('should handle null link header', () => {
      const result = parseLinkHeader(null as any);
      
      expect(result).toEqual({});
    });

    it('should handle undefined link header', () => {
      const result = parseLinkHeader(undefined as any);
      
      expect(result).toEqual({});
    });

    it('should handle malformed link header', () => {
      const linkHeader = 'invalid link header';
      
      const result = parseLinkHeader(linkHeader);
      
      expect(result).toEqual({});
    });

    it('should handle link header with invalid rel', () => {
      const linkHeader = '<https://api.github.com/repos/owner/repo/issues?page=2>; rel="invalid"';
      
      const result = parseLinkHeader(linkHeader);
      
      expect(result).toEqual({
        invalid: 'https://api.github.com/repos/owner/repo/issues?page=2'
      });
    });

    it('should handle link header with missing rel', () => {
      const linkHeader = '<https://api.github.com/repos/owner/repo/issues?page=2>';
      
      const result = parseLinkHeader(linkHeader);
      
      expect(result).toEqual({});
    });

    it('should handle link header with missing url', () => {
      const linkHeader = 'rel="next"';
      
      const result = parseLinkHeader(linkHeader);
      
      expect(result).toEqual({});
    });

    it('should handle link header with extra spaces', () => {
      const linkHeader = ' <https://api.github.com/repos/owner/repo/issues?page=2> ; rel="next" , <https://api.github.com/repos/owner/repo/issues?page=5> ; rel="last" ';
      
      const result = parseLinkHeader(linkHeader);
      
      expect(result).toEqual({
        next: 'https://api.github.com/repos/owner/repo/issues?page=2',
        last: 'https://api.github.com/repos/owner/repo/issues?page=5',
      });
    });
  });

  describe('extractPaginationFromResponse', () => {
    it('should extract pagination from response with link header', () => {
      const response = {
        headers: {
          'link': '<https://api.github.com/repos/owner/repo/issues?page=2>; rel="next", <https://api.github.com/repos/owner/repo/issues?page=5>; rel="last"',
        },
      };
      
      const result = extractPaginationFromResponse(response);
      
      expect(result).toEqual({
        next: 'https://api.github.com/repos/owner/repo/issues?page=2',
        last: 'https://api.github.com/repos/owner/repo/issues?page=5',
      });
    });

    it('should return empty object when no link header', () => {
      const response = {
        headers: {},
      };
      
      const result = extractPaginationFromResponse(response);
      
      expect(result).toEqual({});
    });

    it('should return empty object when link header is null', () => {
      const response = {
        headers: {
          'link': null as any,
        },
      };
      
      const result = extractPaginationFromResponse(response);
      
      expect(result).toEqual({});
    });

    it('should return empty object when link header is undefined', () => {
      const response = {
        headers: {
          'link': undefined as any,
        },
      };
      
      const result = extractPaginationFromResponse(response);
      
      expect(result).toEqual({});
    });
  });

  describe('createPaginationHeaders', () => {
    it('should create pagination headers with link header', () => {
      const linkHeader = '<https://api.example.com/issues?page=2>; rel="next", <https://api.example.com/issues?page=5>; rel="last"';
      
      const result = createPaginationHeaders(linkHeader);
      
      expect(result).toEqual({
        'link': linkHeader,
      });
    });

    it('should create pagination headers with link and total count', () => {
      const linkHeader = '<https://api.example.com/issues?page=2>; rel="next"';
      const totalCount = '100';
      
      const result = createPaginationHeaders(linkHeader, totalCount);
      
      expect(result).toEqual({
        'link': linkHeader,
        'x-total-count': totalCount,
      });
    });

    it('should create pagination headers with only total count', () => {
      const totalCount = '50';
      
      const result = createPaginationHeaders(undefined, totalCount);
      
      expect(result).toEqual({
        'x-total-count': totalCount,
      });
    });

    it('should return empty object when no parameters', () => {
      const result = createPaginationHeaders();
      
      expect(result).toEqual({});
    });

    it('should return empty object when both parameters are undefined', () => {
      const result = createPaginationHeaders(undefined, undefined);
      
      expect(result).toEqual({});
    });
  });
});
