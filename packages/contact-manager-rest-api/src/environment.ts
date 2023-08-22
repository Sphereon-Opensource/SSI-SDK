import { env } from '@sphereon/ssi-sdk.express-support/dist/functions'

/**
 * Please see .env.example for an explanation of the different environment variables available
 *
 * This file takes all environment variables and assigns them to constants, with default values,
 * so the rest of the code doesn't have to know the exact environment values
 */
export const ENV_VAR_PREFIX = process.env.ENV_VAR_PREFIX ?? ''

export const INTERNAL_HOSTNAME_OR_IP = env('INTERNAL_HOSTNAME_OR_IP', ENV_VAR_PREFIX) ?? env('HOSTNAME', ENV_VAR_PREFIX) ?? '0.0.0.0'
export const INTERNAL_PORT = env('PORT', ENV_VAR_PREFIX) ? Number.parseInt(env('PORT', ENV_VAR_PREFIX)!) : 5000

export const AUTHENTICATION_ENABLED = env('AUTHENTICATION_ENABLED', ENV_VAR_PREFIX) === 'true'

export const ENABLED_EFATURES = env('ENABLED_EFATURES', ENV_VAR_PREFIX)
