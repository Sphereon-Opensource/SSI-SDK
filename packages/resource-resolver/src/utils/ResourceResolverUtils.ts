import { Headers, Response, Request } from 'cross-fetch'
import * as u8a from 'uint8arrays'
import { ResolveOptions, Resource, SerializedResponse } from '../types/IResourceResolver'

export const getResourceIdentifier = (input: Request | string | URL): string => {
  if (typeof input === 'string') {
    return input;
  } else if (input instanceof Request) {
    return input.url;
  } else if (input instanceof URL) {
    return input.toString();
  }

  throw new Error('Invalid input type. Expected Request, string, or URL.');
}

export const serializeResponse = async (response: Response): Promise<SerializedResponse> => {
  const arrayBuffer = await response.arrayBuffer();
  const base64Url = u8a.toString(new Uint8Array(arrayBuffer), 'base64url');

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: base64Url
  }
}

export const deserializeResponse = async (data: SerializedResponse): Promise<Response> => {
  const {
    status,
    statusText,
    headers,
    body
  } = data

  const uint8Array = u8a.fromString(body, 'base64url')
  const arrayBuffer = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength);

  return new Response(arrayBuffer, {
    status,
    statusText,
    headers: new Headers(headers)
  })
}

// Check if the cache is still within the acceptable age
export const isCacheWithinMaxAge = (cachedResource: Resource, resolveOpts?: ResolveOptions): boolean => {
  return cachedResource && (resolveOpts?.maxAgeMs === undefined || (Date.now() - cachedResource.insertedAt < resolveOpts.maxAgeMs))
}
