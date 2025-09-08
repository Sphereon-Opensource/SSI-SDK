import { HttpLibrary, RequestContext, ResponseContext } from './http'
import { Observable } from '../rxjsStub'
import 'whatwg-fetch'
export declare class IsomorphicFetchHttpLibrary implements HttpLibrary {
  send(request: RequestContext): Observable<ResponseContext>
}
