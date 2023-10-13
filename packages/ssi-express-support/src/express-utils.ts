import express, { NextFunction } from 'express'
export function sendErrorResponse(response: express.Response, statusCode: number, message: string | object, error?: any) {
  if (!message) {
    console.error('Message was null when calling sendErrorResponse. This should not happen')
    message = 'An unexpected error occurred'
    statusCode = 500
  } else {
    console.error(`sendErrorResponse: ${typeof message === 'string' ? message : JSON.stringify(message)}`)
  }
  if (error) {
    console.error(JSON.stringify(error))
  }
  if (statusCode == 500) {
    console.error(Error().stack)
  }
  if (response.headersSent) {
    console.error(`sendErrorResponse headers already sent`)
    return response
  }
  response.statusCode = statusCode
  if (typeof message === 'string' && !message.startsWith('{')) {
    message = { error: message }
  }
  if (typeof message === 'string' && message.startsWith('{')) {
    response.header('Content-Type', 'application/json')
    return response.status(statusCode).end(message)
  }
  return response.status(statusCode).json(message)
}

export const jsonErrorHandler = (err: any, req: express.Request, res: express.Response, next: NextFunction) => {
  const statusCode: number = 'statusCode' in err ? err.statusCode : 500
  const errorMsg = typeof err === 'string' ? err : err.message ?? err
  if (res.headersSent) {
    console.log('Headers already sent, when calling error handler. Will defer to next error handler')
    console.log(`Error was: ${JSON.stringify(err)}`)
    return next(err)
  }
  return sendErrorResponse(res, statusCode, errorMsg, typeof err !== 'string' ? err : undefined)
}
