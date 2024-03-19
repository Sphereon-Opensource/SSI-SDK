import { IIssueRequest, IIssueRequestResponse } from './types/IMsRequestApi'

import { fetch } from 'cross-fetch'
export async function fetchIssuanceRequestMs(
  issuanceInfo: IIssueRequest,
  accessToken: string,
  msIdentityHostName: string,
): Promise<IIssueRequestResponse> {
  const requestEndpoint = `${msIdentityHostName}${issuanceInfo.authenticationInfo.azTenantId}/verifiablecredentials/request`

  const payload = JSON.stringify(issuanceInfo.issuanceConfig)
  const fetchOptions = {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length.toString(),
      Authorization: `Bearer ${accessToken}`,
    },
  }
  const response = await fetch(requestEndpoint, fetchOptions)
  return await response.json()
}

export function generatePin(digits: number) {
  const add = 1
  let max = 12 - add
  max = Math.pow(10, digits + add)
  const min = max / 10 // Math.pow(10, n) basically
  const number = Math.floor(Math.random() * (max - min + 1)) + min
  return ('' + number).substring(add)
}
