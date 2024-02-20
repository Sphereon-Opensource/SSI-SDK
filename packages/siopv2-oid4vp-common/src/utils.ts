export function uriWithBase(path: string, opts?: { baseURI?: string; envVarName?: string }) {
  let baseUri = `${!!opts?.baseURI ? opts.baseURI : opts?.envVarName && process ? process.env[opts.envVarName!] : process?.env?.BACKEND_BASE_URI}`
  if (!baseUri || baseUri === 'undefined') {
    throw Error('No base URI provided as param or environment variable')
  } else if (!baseUri.startsWith('http')) {
    throw Error(`Base URI needs to start with http(s). Received: ${baseUri}`)
  }
  baseUri = baseUri.endsWith('/') ? baseUri.substring(0, baseUri.length - 1) : baseUri
  return `${baseUri}${path.startsWith('/') ? path : '/' + path}`
}
