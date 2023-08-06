import express, { NextFunction } from 'express'
export function sendErrorResponse(response: express.Response, statusCode: number, message: string | object, error?: Error) {
  console.log(`sendErrorResponse: ${message}`)
  if (error) {
    console.log(JSON.stringify(error))
  }
  if (response.headersSent) {
    console.log(`sendErrorResponse headers already sent`)
    return
  }
  if (response.headersSent) {
    return
  }
  response.statusCode = statusCode
  if (typeof message === 'string' && !message.startsWith('{')) {
    message = { error: message }
  }
  if (typeof message === 'string' && message.startsWith('{')) {
    return response.status(statusCode).end(message)
  }
  return response.status(statusCode).json(message)
}

export const jsonErrorHandler = (err: any, req: express.Request, res: express.Response, next: NextFunction) => {
  const statusCode: number = 'statusCode' in err ? err.statusCode : 500
  const errorMsg = typeof err === 'string' ? err : err.message
  if (res.headersSent) {
    console.log('Headers already sent, when calling error handler. Will defer to next error handler')
    console.log(`Error was: ${JSON.stringify(err)}`)
    return next(err)
  }
  return sendErrorResponse(res, statusCode, errorMsg, typeof err !== 'string' ? err : undefined)
}
