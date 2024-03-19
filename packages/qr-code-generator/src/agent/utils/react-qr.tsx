import { CreateElementArgs, CreateValueArgs, events, IRequiredContext, QRType, ValueResult } from '../../types/IQRCodeGenerator'
import QRCode from 'react-qr-code'
import React from 'react'

export async function generateQRCodeValue<T extends QRType>(
  args: CreateValueArgs<T, string> | CreateElementArgs<T, string>,
  context?: IRequiredContext,
): Promise<ValueResult<T, string>> {
  return generateQRCodeValueImpl(args, args, context)
}

export async function generateQRCodeValueImpl<T extends QRType>(
  args: CreateValueArgs<T, string> | CreateElementArgs<T, string>,
  orig: CreateValueArgs<T, any> | CreateElementArgs<T, any>,
  context?: IRequiredContext,
): Promise<ValueResult<T, string>> {
  const { onGenerate } = orig
  const { id } = orig.data

  const value = args.data.object

  const result: ValueResult<T, string> = {
    id,
    value,
    data: orig.data,
    renderingProps: 'renderingProps' in orig ? orig.renderingProps : undefined,
    context,
  }

  if (onGenerate) {
    onGenerate(result)
  }
  if (context) {
    context.agent.emit(events.QR_CODE_CODE_CREATED, result)
  }

  return result
}

export async function generateQRCodeReactElement<T extends QRType>(
  args: CreateElementArgs<T, string>,
  context: IRequiredContext,
): Promise<JSX.Element> {
  return generateQRCodeReactElementImpl(args, args, context)
}

export async function generateQRCodeReactElementImpl<T extends QRType>(
  args: CreateElementArgs<T, string>,
  orig: CreateElementArgs<T, any>,
  context: IRequiredContext,
): Promise<JSX.Element> {
  const { renderingProps } = args
  const { bgColor, fgColor, level, size, title } = renderingProps
  const result: ValueResult<T, string> = await generateQRCodeValueImpl(args, orig, context)

  // @ts-ignore
  return <QRCode value={result.value} bgColor={bgColor} fgColor={fgColor} level={level} size={size} title={title} />
}
