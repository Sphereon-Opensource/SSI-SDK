import { Headers, Response, Request } from 'cross-fetch'
import { SerializedResponse } from '../types/IResourceResolver'

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
  const body = Buffer.from(arrayBuffer);

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body
  }
}

export const deserializeResponse = async (data: SerializedResponse): Promise<Response> => {
  const {
    status,
    statusText,
    headers,
    body
  } = data

  const responseBody = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);

  return new Response(responseBody, {
    status,
    statusText,
    headers: new Headers(headers)
  })
}
