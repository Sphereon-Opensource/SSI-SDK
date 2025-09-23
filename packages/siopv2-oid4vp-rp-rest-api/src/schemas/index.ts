import { CallbackOptsSchema, RequestUriMethod, ResponseMode, ResponseType } from '@sphereon/did-auth-siop'
import { z } from 'zod'

export const ResponseTypeSchema = z.enum([ResponseType.VP_TOKEN])

export const ResponseModeSchema = z.enum([ResponseMode.DIRECT_POST, ResponseMode.DIRECT_POST_JWT])

const requestUriMethods = [RequestUriMethod.GET, RequestUriMethod.POST] as const satisfies Array<RequestUriMethod>
export const RequestUriMethodSchema = z.enum(requestUriMethods)

export const QRCodeOptsSchema = z.object({
  size: z.number().optional(),
  color_dark: z.string().optional(),
  color_light: z.string().optional(),
})

export const CreateAuthorizationRequestBodySchema = z.object({
  query_id: z.string(),
  client_id: z.string().optional(),
  request_uri_base: z.string().optional(),
  correlation_id: z.string().optional(),
  request_uri_method: RequestUriMethodSchema.optional(),
  response_type: ResponseTypeSchema.optional(),
  response_mode: ResponseModeSchema.optional(),
  transaction_data: z.array(z.string()).optional(),
  qr_code: QRCodeOptsSchema.optional(),
  direct_post_response_redirect_uri: z.string().optional(),
  callback: CallbackOptsSchema.optional(),
})

export const CreateAuthorizationResponseSchema = z.object({
  correlation_id: z.string(),
  query_id: z.string(),
  request_uri: z.string(),
  status_uri: z.string(),
  qr_uri: z.string().optional(),
})
