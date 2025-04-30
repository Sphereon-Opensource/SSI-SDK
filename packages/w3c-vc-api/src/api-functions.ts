import { checkAuth, type ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import type { CredentialPayload, ProofFormat } from '@veramo/core'
import { type Request, type Response, Router } from 'express'
import { v4 } from 'uuid'
import type { IIssueCredentialEndpointOpts, IRequiredContext, IVCAPIIssueOpts, IVerifyCredentialEndpointOpts } from './types'
import Debug from 'debug'
import { AddCredentialArgs, CredentialCorrelationType, DocumentType, type FindDigitalCredentialArgs } from '@sphereon/ssi-sdk.credential-store'
import type { IStatusListPlugin } from '@sphereon/ssi-sdk.vc-status-list'
import { CredentialRole } from '@sphereon/ssi-sdk.data-store'
import { CredentialMapper, CredentialProofFormat, OriginalVerifiableCredential } from '@sphereon/ssi-types'
import { extractIssuer } from '@sphereon/ssi-sdk.credential-vcdm'
import { isDidIdentifier, isIIdentifier } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import type { VerifiableCredentialSP } from '@sphereon/ssi-sdk.core'

const debug = Debug('sphereon:ssi-sdk:w3c-vc-api')

export function issueCredentialEndpoint(router: Router, context: IRequiredContext, opts?: IIssueCredentialEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Issue credential endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/credentials/issue'

  router.post(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const credential: CredentialPayload = request.body.credential
      const reqOpts = request.body.options ?? {}
      const inputFormat = reqOpts.proofFormat?.toLocaleLowerCase() ?? opts?.issueCredentialOpts?.proofFormat?.toLocaleLowerCase()
      let proofFormat: CredentialProofFormat = 'lds' // TODO: Update to vc+jwt once stable
      if (inputFormat) {
        if (inputFormat === 'jwt') {
          proofFormat = 'jwt'
        } else if (inputFormat?.includes('jose') || inputFormat?.includes('vc+jwt')) {
          proofFormat = 'vc+jwt'
        } else if (inputFormat?.includes('ld')) {
          proofFormat = 'lds'
        } else {
          // TODO: Update to VDCM SD-JWT in the future
          proofFormat = 'jwt'
        }
      }
      if (!credential) {
        return sendErrorResponse(response, 400, 'No credential supplied')
      }
      if (!credential.id) {
        credential.id = `urn:uuid:${v4()}`
      }
      if (contextHasPlugin<IStatusListPlugin>(context, 'slAddStatusToCredential')) {
        // Add status list if enabled (and when the input has a credentialStatus object (can be empty))
        const credentialStatusVC = await context.agent.slAddStatusToCredential({ credential })
        if (credential.credentialStatus && !credential.credentialStatus.statusListCredential) {
          credential.credentialStatus = credentialStatusVC.credentialStatus
        }
      }
      const issueOpts: IVCAPIIssueOpts | undefined = opts?.issueCredentialOpts
      const vc = await context.agent.createVerifiableCredential({
        credential,
        proofFormat: proofFormat as ProofFormat,
        fetchRemoteContexts: issueOpts?.fetchRemoteContexts !== false,
      })
      const save = opts?.persistIssuedCredentials !== false
      if (save) {
        const issuer = extractIssuer(credential)
        const identifier = await context.agent.identifierManagedGet({ identifier: issuer, issuer: issuer, vmRelationship: 'assertionMethod' })
        const rawDocument = CredentialMapper.storedCredentialToOriginalFormat(vc as OriginalVerifiableCredential)
        let issuerCorrelationId: string | undefined = identifier.issuer
        if (!issuerCorrelationId && isDidIdentifier(identifier.identifier)) {
          if (isIIdentifier(identifier.identifier)) {
            issuerCorrelationId = identifier.identifier.did
          } else if (typeof identifier.identifier === 'string') {
            issuerCorrelationId = identifier.identifier
          }
        }
        if (!issuerCorrelationId) {
          if (typeof vc.issuer === 'string') {
            issuerCorrelationId = vc.issuer
          } else if (typeof vc.issuer?.id === 'string') {
            issuerCorrelationId = vc.issuer.id
          } else {
            issuerCorrelationId = 'unknown'
          }
        }

        const dc: AddCredentialArgs = {
          credential: {
            credentialRole: CredentialRole.HOLDER,
            // tenantId: 'test-tenant',
            kmsKeyRef: identifier.kmsKeyRef,
            identifierMethod: identifier.method,
            issuerCorrelationId: issuerCorrelationId,
            issuerCorrelationType: CredentialCorrelationType.DID,
            rawDocument: typeof rawDocument === 'string' ? rawDocument : JSON.stringify(rawDocument),
          },
        }
        await context.agent.crsAddCredential(dc)
      }
      response.statusCode = 201
      return response.send({ verifiableCredential: vc })
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function getCredentialsEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Get credentials endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/credentials'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const credentialRole = (request.query.credentialRole as CredentialRole) || CredentialRole.HOLDER
      if (!Object.values(CredentialRole).includes(credentialRole)) {
        return sendErrorResponse(response, 400, `Invalid credentialRole: ${credentialRole}`)
      }

      const documentType = (request.query.documentType as DocumentType) || DocumentType.VC
      if (!Object.values(DocumentType).includes(documentType)) {
        return sendErrorResponse(response, 400, `Invalid documentType: ${documentType}`)
      }

      const filter: FindDigitalCredentialArgs = [
        {
          documentType: documentType,
          credentialRole: credentialRole,
        },
      ]
      const uniqueVCs = await context.agent.crsGetUniqueCredentials({ filter })
      response.statusCode = 202
      return response.send(uniqueVCs.map((uVC) => uVC.uniformVerifiableCredential))
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function getCredentialEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Get credential endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/credentials/:id'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const id = request.params.id
      if (!id) {
        return sendErrorResponse(response, 400, 'no id provided')
      }
      const credentialRole = (request.query.credentialRole as CredentialRole) || CredentialRole.HOLDER
      if (!Object.values(CredentialRole).includes(credentialRole)) {
        return sendErrorResponse(response, 400, `Invalid credentialRole: ${credentialRole}`)
      }

      const vcInfo = await context.agent.crsGetUniqueCredentialByIdOrHash({
        credentialRole: credentialRole,
        idOrHash: id,
      })
      if (!vcInfo) {
        return sendErrorResponse(response, 403, `id ${id} not found`)
      }
      response.statusCode = 200
      return response.send(vcInfo.uniformVerifiableCredential)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function verifyCredentialEndpoint(router: Router, context: IRequiredContext, opts?: IVerifyCredentialEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Verify credential endpoint is disabled`)
    return
  }
  router.post(opts?.path ?? '/credentials/verify', checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      debug(JSON.stringify(request.body, null, 2))
      const credential: VerifiableCredentialSP = request.body.verifiableCredential
      // const options: IIssueOptionsPayload = request.body.options
      if (!credential) {
        return sendErrorResponse(response, 400, 'No verifiable credential supplied')
      }
      const verifyResult = await context.agent.verifyCredential({
        credential,
        policies: {
          credentialStatus: false, // Do not use built-in. We have our own statusList implementations
        },
        fetchRemoteContexts: opts?.fetchRemoteContexts !== false,
      })

      response.statusCode = 200
      return response.send(verifyResult)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function deleteCredentialEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Delete credential endpoint is disabled`)
    return
  }
  router.delete(opts?.path ?? '/credentials/:id', checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const id = request.params.id
      if (!id) {
        return sendErrorResponse(response, 400, 'no id provided')
      }
      const credentialRole = request.query.credentialRole as CredentialRole
      if (credentialRole === undefined) {
        return sendErrorResponse(response, 400, 'credentialRole query parameter is missing')
      }
      if (!Object.values(CredentialRole).includes(credentialRole)) {
        return sendErrorResponse(response, 400, `Invalid credentialRole: ${credentialRole}`)
      }

      const vcInfo = await context.agent.crsGetUniqueCredentialByIdOrHash({
        credentialRole: credentialRole,
        idOrHash: id,
      })
      if (!vcInfo) {
        return sendErrorResponse(response, 404, `id ${id} not found`)
      }
      const success = await context.agent.crsDeleteCredentials({ filter: [{ hash: vcInfo.hash }] })
      if (success === 0) {
        return sendErrorResponse(response, 400, `Could not delete Verifiable Credential with id ${id}`)
      }
      response.statusCode = 200
      return response.send()
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}
