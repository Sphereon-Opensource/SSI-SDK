import { CredentialPayload, VerifiableCredential } from '@veramo/core'
import { W3CVerifiableCredential } from '@veramo/core/src/types/vc-data-model'
import { Request, Response, Router } from 'express'
import { v4 } from 'uuid'
import { IRequiredContext, IVCAPIIssueOpts } from './types'

export function issueCredentialEndpoint(
  router: Router,
  context: IRequiredContext,
  opts?: {
    issueCredentialOpts?: IVCAPIIssueOpts
    issueCredentialPath?: string
    persistIssuedCredentials?: boolean
  }
) {
  router.post(opts?.issueCredentialPath ?? '/credentials/issue', async (request: Request, response: Response) => {
    try {
      const credential: CredentialPayload = request.body.credential
      if (!credential) {
        return sendErrorResponse(response, 400, 'No credential supplied')
      }
      if (!credential.id) {
        credential.id = `urn:uuid:${v4()}`
      }
      const issueOpts: IVCAPIIssueOpts | undefined = opts?.issueCredentialOpts
      const vc = await context.agent.createVerifiableCredential({
        credential,
        save: opts?.persistIssuedCredentials ?? true,
        proofFormat: issueOpts?.proofFormat ?? 'lds',
        fetchRemoteContexts: issueOpts?.fetchRemoteContexts || true,
      })
      response.statusCode = 201
      return response.send({ verifiableCredential: vc })
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function getCredentialsEndpoint(
  router: Router,
  context: IRequiredContext,
  opts?: {
    getCredentialsPath?: string
  }
) {
  router.get(opts?.getCredentialsPath ?? '/credentials', async (request: Request, response: Response) => {
    try {
      const uniqueVCs = await context.agent.dataStoreORMGetVerifiableCredentials()
      response.statusCode = 202
      return response.send(uniqueVCs.map((uVC) => uVC.verifiableCredential))
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function getCredentialEndpoint(
  router: Router,
  context: IRequiredContext,
  opts?: {
    getCredentialPath?: string
  }
) {
  router.get(opts?.getCredentialPath ?? '/credentials/:id', async (request: Request, response: Response) => {
    try {
      const id = request.params.id
      if (!id) {
        return sendErrorResponse(response, 400, 'no id provided')
      }
      let vcInfo = await getCredentialByIdOrHash(context, id)
      if (!vcInfo.vc) {
        return sendErrorResponse(response, 404, `id ${id} not found`)
      }
      response.statusCode = 200
      return response.send(vcInfo.vc)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function verifyCredentialEndpoint(
  router: Router,
  context: IRequiredContext,
  opts?: {
    verifyCredentialPath?: string
    fetchRemoteContexts?: boolean
  }
) {
  router.post(opts?.verifyCredentialPath ?? '/credentials/verify', async (request: Request, response: Response) => {
    try {
      console.log(request.body)
      const credential: W3CVerifiableCredential = request.body.verifiableCredential
      // const options: IIssueOptionsPayload = request.body.options
      if (!credential) {
        return sendErrorResponse(response, 400, 'No verifiable credential supplied')
      }
      const verifyResult = await context.agent.verifyCredential({
        credential,
        fetchRemoteContexts: opts?.fetchRemoteContexts !== false,
      })

      response.statusCode = 200
      return response.send(verifyResult)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function deleteCredentialEndpoint(
  router: Router,
  context: IRequiredContext,
  opts?: {
    deleteCredentialsPath?: string
  }
) {
  router.delete(opts?.deleteCredentialsPath ?? '/credentials/:id', async (request: Request, response: Response) => {
    try {
      const id = request.params.id
      if (!id) {
        return sendErrorResponse(response, 400, 'no id provided')
      }
      let vcInfo = await getCredentialByIdOrHash(context, id)
      if (!vcInfo.vc || !vcInfo.hash) {
        return sendErrorResponse(response, 404, `id ${id} not found`)
      }
      const success = context.agent.dataStoreDeleteVerifiableCredential({ hash: vcInfo.hash })
      if (!success) {
        return sendErrorResponse(response, 400, `Could not delete Verifiable Credential with id ${id}`)
      }
      response.statusCode = 200
      return response.send()
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

function sendErrorResponse(response: Response, statusCode: number, message: string, error?: Error) {
  console.log(message)
  if (error) {
    console.log(error)
  }
  response.statusCode = statusCode
  return response.status(statusCode).send(message)
}

export async function getCredentialByIdOrHash(
  context: IRequiredContext,
  idOrHash: string
): Promise<{
  id: string
  hash?: string
  vc?: VerifiableCredential
}> {
  let vc: VerifiableCredential
  let hash: string
  const uniqueVCs = await context.agent.dataStoreORMGetVerifiableCredentials({
    where: [
      {
        column: 'id',
        value: [idOrHash],
        op: 'Equal',
      },
    ],
  })
  if (uniqueVCs.length === 0) {
    hash = idOrHash
    vc = await context.agent.dataStoreGetVerifiableCredential({ hash })
  } else {
    const uniqueVC = uniqueVCs[0]
    hash = uniqueVC.hash
    vc = uniqueVC.verifiableCredential
  }

  return {
    vc,
    id: idOrHash,
    hash,
  }
}
