import express, { NextFunction } from 'express'
export function sendErrorResponse(response: express.Response, statusCode: number, message: string | object, error?: any) {
  let msg = message
  if (!msg) {
    console.error('Message was null when calling sendErrorResponse. This should not happen')
    msg = 'An unexpected error occurred'
    statusCode = 500
  } else {
    console.error(`sendErrorResponse (${statusCode}): ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`)
  }
  if (error) {
    if (error instanceof Error) {
      console.error(`error message: ${error.message}`)
    }
    console.error(`error object: ${JSON.stringify(error)}`)
  }
  if (statusCode >= 500) {
    console.error('Original error stack (if any) and REST API error stack:')
    console.error(error?.stack)
    console.error(Error().stack)
  }
  if (response.headersSent) {
    console.error(`sendErrorResponse headers already sent`)
    return response
  }
  response.statusCode = statusCode
  if (typeof msg === 'string' && !msg.startsWith('{')) {
    msg = { error: msg }
  }
  if (typeof msg === 'string' && msg.startsWith('{')) {
    response.header('Content-Type', 'application/json')
    return response.status(statusCode).end(msg)
  }
  return response.status(statusCode).json(msg)
}

export const jsonErrorHandler = (err: any, req: express.Request, res: express.Response, next: NextFunction) => {
  const statusCode: number = 'statusCode' in err ? err.statusCode : 500
  let errorMsg = typeof err === 'string' ? err : (err.message ?? err)
  if (typeof errorMsg !== 'string') {
    errorMsg = JSON.stringify(errorMsg)
  }
  if (res.headersSent) {
    console.log('Headers already sent, when calling error handler. Will defer to next error handler')
    console.log(`Error was: ${JSON.stringify(err)}`)
    return next(err)
  }
  return sendErrorResponse(res, statusCode, errorMsg, err)
}
