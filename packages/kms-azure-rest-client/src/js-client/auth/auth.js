export class ApiKeySchemeAuthentication {
  constructor(apiKey) {
    this.apiKey = apiKey
  }
  getName() {
    return 'apiKeyScheme'
  }
  applySecurityAuthentication(context) {
    context.setHeaderParam('X-API-KEY', this.apiKey)
  }
}
export function configureAuthMethods(config) {
  let authMethods = {}
  if (!config) {
    return authMethods
  }
  authMethods['default'] = config['default']
  if (config['apiKeyScheme']) {
    authMethods['apiKeyScheme'] = new ApiKeySchemeAuthentication(config['apiKeyScheme'])
  }
  return authMethods
}
//# sourceMappingURL=auth.js.map
