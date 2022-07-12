import { IIssueRequest, IIssueRequestResponse } from './types/IMsRequestApi'

export async function fetchIssuanceRequestMs(
  issuanceInfo: IIssueRequest,
  accessToken: string,
  msIdentityHostName: string
): Promise<IIssueRequestResponse> {
  var client_api_request_endpoint = `${msIdentityHostName}${issuanceInfo.authenticationInfo.azTenantId}/verifiablecredentials/request`

  var payload = JSON.stringify(issuanceInfo.issuanceConfig)
  const fetchOptions = {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length.toString(),
      Authorization: `Bearer ${accessToken}`,
    },
  }
  const response = await fetch(client_api_request_endpoint, fetchOptions)
  return await response.json()
}

export function generatePin(digits: number) {
  var add = 1,
    max = 12 - add
  max = Math.pow(10, digits + add)
  var min = max / 10 // Math.pow(10, n) basically
  var number = Math.floor(Math.random() * (max - min + 1)) + min
  return ('' + number).substring(add)
}
