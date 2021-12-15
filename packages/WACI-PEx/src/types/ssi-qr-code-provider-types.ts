import { IAgentContext, IPluginMethodMap } from '@veramo/core'

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
  state: string
  type: QRType
  did: string
  mode: QRMode
  redirectUrl?: string
  qrValue: string
}

export interface SsiQrCodeProps {
  type: QRType
  did: string
  mode: QRMode
  redirectUrl?: string
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
