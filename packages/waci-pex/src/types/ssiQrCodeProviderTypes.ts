import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { SIOP } from '@sphereon/did-auth-siop'

export interface SsiQrCodeProviderTypes extends IPluginMethodMap {
  ssiQrCode(ssiQrCodeProps: SsiQrCodeProps, context: IRequiredContext): Promise<JSX.Element>
}

export enum QRType {
  AUTHENTICATION = 'auth',
}

export enum QRMode {
  DID_AUTH_SIOP_V2 = 'didauth',
}

export interface QRContent {
  state?: string
  nonce?: string
  qrValue?: string
}

export enum AcceptValue {
  OIDC4VP = 'oidc4vp',
  SIOP_OVER_OIDC4VP = 'siop+oidc4vp',
  SIOP_V2 = 'siopv2',
}

export interface SsiQrCodeProps {
  accept: AcceptValue
  mode: QRMode
  authenticationRequestOpts: SIOP.AuthenticationRequestOpts
  onGenerate?: (content: QRContent) => void
  bgColor?: string
  fgColor?: string
  level?: 'L' | 'M' | 'Q' | 'H'
  size?: number
  title?: string
}

export enum events {
  SSI_QR_CODE_CODE_CREATED = 'SsiQrCodeCreated',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
