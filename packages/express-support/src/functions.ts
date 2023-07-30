import express, { NextFunction } from 'express'
import process from 'process'

export function env(key?: string, prefix?: string): string | undefined {
  if (!key) {
    return
  }
  return process.env[`${prefix ? prefix.trim() : ''}${key}`]
}

export function sendErrorResponse(response: express.Response, statusCode: number, message: string, error?: Error) {
  console.log(message)
  if (error) {
    console.log(error)
  }
  response.statusCode = statusCode
  return response.status(statusCode).json(message.startsWith('{') ? message : JSON.stringify(message, null, 2))
}

export const jsonErrorHandler = (err: any, req: express.Request, res: express.Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err)
  }
  return sendErrorResponse(res, 500, err.message, err)
}
