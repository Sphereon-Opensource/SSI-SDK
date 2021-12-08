import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { FC } from 'react'
// import { QRCode } from 'react'

export interface IQRCodeCreator extends IPluginMethodMap {
  createQRCode(qrProps: QRProps, context: IRequiredContext): Promise<FC<QRProps>>
}

export interface IQRCodeCreatorArgs {
  qrCodeCreatorData: string
  authorizationToken: string
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

export interface QRProps {
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
  QR_CODE_CREATED = 'qrCodeCreated',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
