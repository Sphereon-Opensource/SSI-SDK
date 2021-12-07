import { IAgentContext, IPluginMethodMap } from '@veramo/core'
// import { QRCode } from 'react'

export interface IQRCodeCreator extends IPluginMethodMap {
  createQRCode(args: IQRCodeArgs, context: IRequiredContext): Promise</*QRCode*/ string>
}

export interface IQRCodeCreatorArgs {
  qrCodeCreatorData: string
  authorizationToken: string
}

export interface IQRCodeArgs {
  data: string
}

export enum events {
  QR_CODE_CREATED = 'qrCodeCreated',
}

export type IRequiredContext = IAgentContext<Record<string, never>>
