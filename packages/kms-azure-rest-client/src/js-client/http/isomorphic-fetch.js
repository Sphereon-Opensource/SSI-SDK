import { ResponseContext } from './http'
import { from } from '../rxjsStub'
import 'whatwg-fetch'
export class IsomorphicFetchHttpLibrary {
  send(request) {
    let method = request.getHttpMethod().toString()
    let body = request.getBody()
    const resultPromise = fetch(request.getUrl(), {
      method: method,
      body: body,
      headers: request.getHeaders(),
      credentials: 'same-origin',
    }).then((resp) => {
      const headers = {}
      resp.headers.forEach((value, name) => {
        headers[name] = value
      })
      const body = {
        text: () => resp.text(),
        binary: () => resp.blob(),
      }
      return new ResponseContext(resp.status, headers, body)
    })
    return from(resultPromise)
  }
}
//# sourceMappingURL=isomorphic-fetch.js.map
