import {env} from "@sphereon/ssi-express-support"
import process from "process"

export const trimBoth = (value: string, trim: string): string => {
  return trimEnd(trimStart(value, trim), trim);
};

export const trimEnd = (value: string, trim: string): string => {
  return value.endsWith(trim) ? value.substring(0, value.length - trim.length) : value;
};

export const trimStart = (value: string, trim: string): string => {
  return value.startsWith(trim) ? value.substring(trim.length) : value;
};

export const adjustUrl = <T extends string | URL>(
  urlOrPath: T,
  opts?: {
    stripSlashEnd?: boolean;
    stripSlashStart?: boolean;
    prepend?: string;
    append?: string;
  },
): T => {
  let url = typeof urlOrPath === 'object' ? urlOrPath.toString() : (urlOrPath as string);
  if (opts?.append) {
    url = trimEnd(url, '/') + '/' + trimStart(opts.append, '/');
  }
  if (opts?.prepend) {
    if (opts.prepend.includes('://')) {
      // includes domain/hostname
      if (!url.startsWith(opts.prepend)) {
        url = trimEnd(opts.prepend, '/') + '/' + trimStart(url, '/');
      }
    } else {
      // path only for prepend
      let host = '';
      let path = url;
      if (url.includes('://')) {
        // includes domain/hostname
        host = new URL(url).host;
        path = new URL(url).pathname;
      }
      if (!path.startsWith(opts.prepend)) {
        if (host && host !== '') {
          url = trimEnd(host, '/');
        }
        url += trimEnd(url, '/') + '/' + trimBoth(opts.prepend, '/') + '/' + trimStart(path, '/');
      }
    }
  }
  if (opts?.stripSlashStart) {
    url = trimStart(url, '/');
  }
  if (opts?.stripSlashEnd) {
    url = trimEnd(url, '/');
  }

  if (typeof urlOrPath === 'string') {
    return url as T;
  }
  return new URL(url) as T;
};



export function determinePath(
    baseUrl: URL | string | undefined,
    endpoint: string,
    opts?: { skipBaseUrlCheck?: boolean; prependUrl?: string; stripBasePath?: boolean },
) {
  const basePath = baseUrl ? getBasePath(baseUrl) : ''
  let path = endpoint
  if (opts?.prependUrl) {
    path = adjustUrl(path, { prepend: opts.prependUrl })
  }
  if (opts?.skipBaseUrlCheck !== true) {
    assertEndpointHasIssuerBaseUrl(baseUrl, endpoint)
  }
  if (endpoint.includes('://')) {
    path = new URL(endpoint).pathname
  }
  path = `/${trimBoth(path, '/')}`
  if (opts?.stripBasePath) {
    if(path.startsWith(basePath)) {
      path = trimStart(path, basePath)
      path = `/${trimBoth(path, '/')}`
    }
  } else if (!opts?.stripBasePath && !path.endsWith(basePath)){
    path = basePath + path
  }
  return path
}

function assertEndpointHasIssuerBaseUrl(baseUrl: URL | string | undefined, endpoint: string) {
  if (!validateEndpointHasIssuerBaseUrl(baseUrl, endpoint)) {
    throw Error(`endpoint '${endpoint}' does not have base url '${baseUrl ? getBaseUrl(baseUrl) : '<no baseurl supplied>'}'`)
  }
}

function validateEndpointHasIssuerBaseUrl(baseUrl: URL | string | undefined, endpoint: string): boolean {
  if (!endpoint) {
    return false
  } else if (!endpoint.includes('://')) {
    return true //absolute or relative path, not containing a hostname
  } else if (!baseUrl) {
    return true
  }
  return endpoint.startsWith(getBaseUrl(baseUrl))
}

export function getBaseUrl(url?: URL | string | undefined) {
  let baseUrl = url
  if (!baseUrl) {
    const envUrl = env('BASE_URL', process?.env?.ENV_PREFIX)
    if (envUrl && envUrl.length > 0) {
      baseUrl = new URL(envUrl)
    }
  }
  if (!baseUrl) {
    throw Error(`Not base URL provided`)
  }
  return trimEnd(baseUrl.toString(), '/')
}

export function getBasePath(url?: URL | string) {
  const basePath = new URL(getBaseUrl(url)).pathname
  if (basePath === '' || basePath === '/') {
    return ''
  }
  return `/${trimBoth(basePath, '/')}`
}