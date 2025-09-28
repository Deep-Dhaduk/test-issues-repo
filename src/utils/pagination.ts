import { PaginationHeaders } from '../types';

export function parseLinkHeader(linkHeader: string): { [rel: string]: string } {
  const links: { [rel: string]: string } = {};
  
  if (!linkHeader) {
    return links;
  }

  // Parse Link header format: <url>; rel="next", <url>; rel="prev"
  const linkEntries = linkHeader.split(',');
  
  for (const entry of linkEntries) {
    const trimmedEntry = entry.trim();
    const match = trimmedEntry.match(/<([^>]+)>\s*;\s*rel="([^"]+)"/);
    if (match) {
      const [, url, rel] = match;
      if (rel && url) {
        links[rel] = url;
      }
    }
  }

  return links;
}

export function createPaginationHeaders(
  linkHeader?: string,
  totalCount?: string
): PaginationHeaders {
  const headers: PaginationHeaders = {};
  
  if (linkHeader) {
    headers.link = linkHeader;
  }
  
  if (totalCount) {
    headers['x-total-count'] = totalCount;
  }

  return headers;
}

export function extractPaginationFromResponse(response: {
  headers: Record<string, string>;
}): { [rel: string]: string } {
  const linkHeader = response.headers['link'];
  if (!linkHeader) {
    return {};
  }
  return parseLinkHeader(linkHeader);
}
