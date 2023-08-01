import {
  assertEntraCredentialManifestUrlInCorrectRegion,
  IMSClientCredentialAuthInfo,
  determineMSAuthId,
  getMSClientCredentialAccessToken,
  newMSClientCredentialAuthenticator,
} from '@sphereon/ssi-sdk.ms-authenticator'
import { IAgentPlugin } from '@veramo/core'
import { fetchIssuanceRequestMs, generatePin } from '../IssuerUtil'
import {
  IClientIssueRequest,
  IIssueRequest,
  IIssueRequestResponse,
  IMsRequestApi,
  IRequiredContext,
  Issuance,
  IssuanceConfig,
} from '../types/IMsRequestApi'

/**
 * {@inheritDoc IMsRequestApi}
 */
export class MsRequestApi implements IAgentPlugin {
  private clients: Map<string, IMSClientCredentialAuthInfo> = new Map<string, IMSClientCredentialAuthInfo>()

  readonly methods: IMsRequestApi = {
    issuanceRequestMsVc: this.issuanceRequestMsVc.bind(this),
  }

  /** {@inheritDoc IMsRequestApi.issuanceRequestMsVc} */
  private async issuanceRequestMsVc(clientIssueRequest: IClientIssueRequest, context: IRequiredContext): Promise<IIssueRequestResponse> {
    const id = determineMSAuthId(clientIssueRequest.authenticationInfo)
    if (!this.clients.has(id)) {
      this.clients.set(id, await newMSClientCredentialAuthenticator(clientIssueRequest.authenticationInfo))
    }
    const clientInfo = this.clients.get(id)
    if (!clientInfo) {
      throw Error(`Could not get client from arguments for id: ${id}`)
    }
    const authResult = await getMSClientCredentialAccessToken(clientIssueRequest.authenticationInfo, {
      confidentialClient: clientInfo.confidentialClient,
    })
    const accessToken = authResult.accessToken

    const msIdentityHostName = await assertEntraCredentialManifestUrlInCorrectRegion(clientIssueRequest.authenticationInfo)

    // Config Request and App Config File should be a parameter to this function
    if (!clientIssueRequest.authenticationInfo.azTenantId) {
      throw new Error('azTenantId is missing.')
    }

    // check if pin is required, if found make sure we set a new random pin
    // pincode is only used when the payload contains claim value pairs which results in an IDTokenhint
    if (clientIssueRequest.clientIssuanceConfig.issuance.pin) {
      clientIssueRequest.clientIssuanceConfig.issuance.pin.value = generatePin(clientIssueRequest.clientIssuanceConfig.issuance.pin.length)
    }

    const issuance: Issuance = {
      type: clientIssueRequest.clientIssuanceConfig.issuance.type,
      manifest: clientIssueRequest.clientIssuanceConfig.issuance.manifest,
      pin: clientIssueRequest.clientIssuanceConfig.issuance.pin,
      claims: clientIssueRequest.claims,
    }

    const issuanceConfig: IssuanceConfig = {
      authority: clientIssueRequest.clientIssuanceConfig.authority,
      includeQRCode: clientIssueRequest.clientIssuanceConfig.includeQRCode,
      registration: clientIssueRequest.clientIssuanceConfig.registration,
      callback: clientIssueRequest.clientIssuanceConfig.callback,
      issuance: issuance,
    }
    const issueRequest: IIssueRequest = {
      authenticationInfo: clientIssueRequest.authenticationInfo,
      issuanceConfig: issuanceConfig,
    }

    const resp = await fetchIssuanceRequestMs(issueRequest, accessToken, msIdentityHostName)

    // the response from the VC Request API call is returned to the caller (the UI). It contains the URI to the request which Authenticator can download after
    // it has scanned the QR code. If the payload requested the VC Request service to create the QR code that is returned as well
    // the javascript in the UI will use that QR code to display it on the screen to the user.
    resp.id = issueRequest.issuanceConfig.callback.state // add session id so browser can pull status
    if (issueRequest.issuanceConfig.issuance.pin) {
      resp.pin = issueRequest.issuanceConfig.issuance.pin.value // add pin code so browser can display it
    }
    return resp
  }
}
