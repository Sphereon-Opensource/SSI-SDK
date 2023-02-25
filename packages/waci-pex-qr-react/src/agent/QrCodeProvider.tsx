import { IAgentPlugin } from '@veramo/core'

import {
  CreateElementArgs,
  CreateValueArgs,
  DIDCommV2OOBInvitationData,
  IQRCodeGenerator,
  IRequiredContext,
  QRType,
  SIOPv2DataWithScheme,
  URIData,
} from '../types/IQRCodeGenerator'
import { DidCommOutOfBandMessage, generateQRCodeReactElement } from './utils'
import { generateQRCodeReactElementImpl } from './utils/ReactQr'

/**
 * {@inheritDoc IQRCodeGenerator}
 */
export class QrCodeProvider implements IAgentPlugin {
  readonly methods: IQRCodeGenerator = {
    didCommOobInvitationElement: QrCodeProvider.didCommOobInvitationElement.bind(this),
    didCommOobInvitationValue: QrCodeProvider.didCommOobInvitationValue.bind(this),
    siopv2Element: QrCodeProvider.siopv2Element.bind(this),
    siopv2Value: QrCodeProvider.siopv2Value.bind(this),
    uriElement: QrCodeProvider.uriElement.bind(this),
  }

  /** {@inheritDoc IQRCodeGenerator.uriElement} */

  private static async uriElement(args: CreateElementArgs<QRType.URI, URIData>, context: IRequiredContext): Promise<JSX.Element> {
    return generateQRCodeReactElement(args, context)
  }

  /** {@inheritDoc IQRCodeGenerator.didCommOobInvitationValue} */
  private static async didCommOobInvitationValue(
    args: CreateValueArgs<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData>,
    context: IRequiredContext
  ): Promise<string> {
    const { object } = args.data
    const encoded = DidCommOutOfBandMessage.urlEncode(object.oobInvitation)
    const delim = object.baseURI.includes('?') ? '&' : '?'
    return object.baseURI.includes('oob=') ? object.baseURI.replace('oob=', `oob=${encoded}`) : `${object.baseURI}${delim}_oob=${encoded}`
  }

  /** {@inheritDoc IQRCodeGenerator.didCommOobInvitationElement} */
  private static async didCommOobInvitationElement(
    args: CreateElementArgs<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData>,
    context: IRequiredContext
  ): Promise<JSX.Element> {
    const content = await QrCodeProvider.didCommOobInvitationValue(args, context)
    return generateQRCodeReactElementImpl(
      {
        ...args,
        data: { ...args.data, object: content },
      } as CreateElementArgs<QRType.DIDCOMM_V2_OOB_INVITATION, string>,
      args,
      context
    )
  }

  /** {@inheritDoc IQRCodeGenerator.siopv2Value} */
  private static async siopv2Value(args: CreateValueArgs<QRType.SIOPV2, SIOPv2DataWithScheme>, context: IRequiredContext): Promise<string> {
    const { object } = args.data
    if (typeof object === 'string') {
      return object
    }

    const scheme = (object.scheme ?? 'openid-vc://').replace('://?', '').replace('://', '') + '://'
    const requestUri = `request_uri=${object.requestUri.replace('request_uri=', '')}`
    return `${scheme}?${requestUri}`
  }

  /** {@inheritDoc IQRCodeGenerator.siopv2Element} */
  private static async siopv2Element(args: CreateElementArgs<QRType.SIOPV2, SIOPv2DataWithScheme>, context: IRequiredContext): Promise<JSX.Element> {
    const content = await QrCodeProvider.siopv2Value(args, context)
    return generateQRCodeReactElementImpl(
      { ...args, data: { ...args.data, object: content } } as CreateElementArgs<QRType.SIOPV2, string>,
      args,
      context
    )
  }
}
