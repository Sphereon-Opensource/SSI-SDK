import { IAgentContext, IPluginMethodMap } from '@veramo/core'

export interface WaciTypes extends IPluginMethodMap {
  createOobQrCode(oobQRProps: OobQRProps, context: IRequiredContext): Promise<JSX.Element>
}

export enum QRType {
  DID_AUTH_SIOP_V2 = 'siopv2',
  DIDCOMM_V2_OOB = 'https://didcomm.org/out-of-band/2.0/invitation',
}

export interface QRContent {
  state?: string
  nonce?: string
  qrValue?: string
}

export enum GoalCode {
  STREAMLINED_VP = 'streamlined-vp',
  STREAMLINED_VC = 'streamlined-vc',
}

export enum AcceptMode {
  OIDC4VP = 'oidc4vp',
  SIOPV2_WITH_OIDC4VP = 'siopv2+oidc4vp',
  SIOP_V2 = 'siopv2',
  DIDCOMM_V2 = 'didcomm/v2',
}

export enum StatusCode {
  OK = 'OK',
  CREATED = 'CREATED',
}

/*
TODO: See whether we need this. Not in the spec currently
export interface WebRedirect {
  status: StatusCode | string
  redirectUrl: string
}
*/

export interface Body {
  goalCode: GoalCode
  accept: [AcceptMode]
}

export interface OobQRProps {
  oobBaseUrl: string
  type: QRType
  // webRedirect?: WebRedirect Not in spec for OOB, do we really need it?
  body: Body
  id: string
  from: string
  onGenerate?: (props: OobQRProps, payload: OobPayload) => void
  bgColor?: string
  fgColor?: string
  level?: 'L' | 'M' | 'Q' | 'H'
  size?: number
  title?: string
}

export interface OobPayload {
  type: QRType
  id: string
  from: string
  body: Body
  // webRedirect?: WebRedirect Not in spec for OOB, do we really need it?
}

export enum events {
  WACI_OOB_QR_CODE_CODE_CREATED = 'WaciOobQrCodeCreated',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
