import express from 'express'
import process from 'process'

export function env(key: string, prefix?: string): string | undefined {
  return process.env[`${prefix ? prefix.trim() : ''}${key}`]
}

export function sendErrorResponse(response: express.Response, statusCode: number, message: string, error?: Error) {
  console.log(message)
  if (error) {
    console.log(error)
  }
  response.statusCode = statusCode
  return response.status(statusCode).end(message)
}
