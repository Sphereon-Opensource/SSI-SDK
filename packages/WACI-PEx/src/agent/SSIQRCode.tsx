import {QRProps} from "../types/IQRCodePlugin";
import React, {FC} from "react";
import QRCode from 'react-qr-code'
import shortUUID from 'short-uuid'

export const SSIQRCode: FC<QRProps> = (qrProps: QRProps) => {

  let {type, did, mode, redirectUrl, onGenerate, bgColor, fgColor, level, size, title} = qrProps
  const state = shortUUID.generate()
  const value = `{"state":"${state}","type":"${type}","did":"${did}","mode":"${mode}","redirectUrl":"${redirectUrl}"}`

  if (onGenerate) {
    onGenerate({
      state,
      type,
      did,
      mode,
      redirectUrl,
      qrValue: value,
    })
  }

  return <QRCode value={value} bgColor={bgColor} fgColor={fgColor} level={level} size={size} title={title}/>
}
