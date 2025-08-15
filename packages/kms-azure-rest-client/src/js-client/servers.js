import { RequestContext } from './http/http'
export class ServerConfiguration {
  constructor(url, variableConfiguration) {
    this.url = url
    this.variableConfiguration = variableConfiguration
  }
  setVariables(variableConfiguration) {
    Object.assign(this.variableConfiguration, variableConfiguration)
  }
  getConfiguration() {
    return this.variableConfiguration
  }
  getUrl() {
    let replacedUrl = this.url
    for (const [key, value] of Object.entries(this.variableConfiguration)) {
      replacedUrl = replacedUrl.replaceAll(`{${key}}`, value)
    }
    return replacedUrl
  }
  makeRequestContext(endpoint, httpMethod) {
    return new RequestContext(this.getUrl() + endpoint, httpMethod)
  }
}
export const server1 = new ServerConfiguration('http://localhost:8080', {})
export const servers = [server1]
//# sourceMappingURL=servers.js.map
