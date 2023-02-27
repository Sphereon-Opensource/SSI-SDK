import { IAgentContext, IPluginMethodMap } from '@veramo/core'

export interface IQRCodeGenerator extends IPluginMethodMap {
  didCommOobInvitationElement(
    args: CreateElementArgs<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData>,
    context: IRequiredContext
  ): Promise<JSX.Element>

  didCommOobInvitationValue(
    args: CreateValueArgs<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData>,
    context: IRequiredContext
  ): Promise<string>

  siopv2Element(args: CreateElementArgs<QRType.SIOPV2, SIOPv2DataWithScheme>, context: IRequiredContext): Promise<JSX.Element>

  siopv2Value(args: CreateValueArgs<QRType.SIOPV2, SIOPv2DataWithScheme>, context: IRequiredContext): Promise<string>

  uriElement(args: CreateElementArgs<QRType.URI, URIData>, context: IRequiredContext): Promise<JSX.Element>
}

export interface CreateValueArgs<T extends QRType, D> {
  onGenerate?: (result: ValueResult<T, D>) => void
  data: QRData<T, D>
}

export interface CreateElementArgs<T extends QRType, D> extends CreateValueArgs<T, D> {
  renderingProps: QRRenderingProps
}

export interface ValueResult<T extends QRType, D> {
  id: string
  value: string
  data: QRData<T, D>
  renderingProps?: QRRenderingProps
  context?: IRequiredContext
}

export enum QRType {
  // OIDC4VCI = 'openid-credential-offer',

  URI = 'uri',
  SIOPV2 = 'openid-vc',
  DIDCOMM_V2_OOB_INVITATION = 'https://didcomm.org/out-of-band/2.0/invitation',
}

/*

export interface QRContent {
  state?: string
  nonce?: string
  qrValue?: string
}
*/

export type SIOPv2Scheme = 'openid' | 'openid-vc' | string
export interface SIOPv2DataWithScheme {
  scheme?: SIOPv2Scheme
  requestUri: string
}

export interface DIDCommV2OOBInvitationData {
  baseURI: string
  oobInvitation: DIDCommV2OOBInvitation
}

/**
 * {
 *   "type": "https://didcomm.org/out-of-band/2.0/invitation",
 *   "id": "599f3638-b563-4937-9487-dfe55099d900",
 *   "from": "did:example:verifier",
 *   "body": {
 *       "goal_code": "streamlined-vp",
 *       "accept": ['didcomm/v2']
 *   }
 * }
 */
export interface DIDCommV2OOBInvitation {
  type: 'https://didcomm.org/out-of-band/2.0/invitation'
  id: string
  from: DID

  body: Body
}

export type URIData = string

export type DID = string

export interface Body {
  goal_code: GoalCode
  accept: [AcceptMode]
}

export type GoalCode = 'streamlined-vp' | 'streamlined-vc'

export type AcceptMode = 'didcomm/v2' | string

/*OIDC4VP = 'oidc4vp',
SIOPV2_WITH_OIDC4VP = 'siopv2+oidc4vp',
SIOP_V2 = 'siopv2',*/

export enum StatusCode {
  OK = 'OK',
  CREATED = 'CREATED',
}

export interface QRData<T extends QRType, D> {
  id: string
  type: T
  object: D
}

export interface QRRenderingProps {
  bgColor?: string
  fgColor?: string
  level?: 'L' | 'M' | 'Q' | 'H'
  size?: number
  title?: string
}

export enum events {
  QR_CODE_CODE_CREATED = 'QrCodeCreated',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
