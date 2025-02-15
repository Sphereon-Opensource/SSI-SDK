import { Request, Response, Router } from 'express'
import { checkAuth, sendErrorResponse } from '@sphereon/ssi-express-support'
import { LOG, VcIssuer } from '@sphereon/oid4vci-issuer'
import { determinePath } from '@sphereon/oid4vci-issuer-server/lib/oid4vci-api-functions'
import { IGetIssueStatusEndpointOpts } from '@sphereon/oid4vci-issuer-server/lib/OID4VCIServer'
import { IRequiredContext } from './types'
import { CredentialConfigurationSupportedV1_0_13 } from '@sphereon/oid4vci-common/lib/types/v1_0_13.types'
import { IssuerInstance } from '@sphereon/ssi-sdk.oid4vci-issuer'
import { IssuerMetadataV1_0_13 } from '@sphereon/oid4vci-common'

export function getCredentialConfigurationsEndpoint<DIDDoc extends object>(
  router: Router,
  context: IRequiredContext,
  instance: IssuerInstance,
  issuer: VcIssuer<DIDDoc>,
  opts: IGetIssueStatusEndpointOpts,
) {
  const path = determinePath(opts.baseUrl, opts?.path ?? '/webapp/issuer-metadata/credential-configurations', { stripBasePath: true })
  LOG.log(`[OID4VCI] getCredentialConfigurations endpoint enabled at ${path}`)
  if (opts?.enabled === false) {
    console.log(`"getCredentialConfigurations" Endpoint is disabled`)
    return
  }

  router.get(`${path}`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const metadata = instance.issuerMetadata as IssuerMetadataV1_0_13
      response.statusCode = 200

      return response.json({ credential_configurations_supported: metadata?.credential_configurations_supported ?? [] })
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function getCredentialConfigurationByIdEndpoint<DIDDoc extends object>(
  router: Router,
  context: IRequiredContext,
  instance: IssuerInstance,
  issuer: VcIssuer<DIDDoc>,
  opts: IGetIssueStatusEndpointOpts,
) {
  const path = determinePath(opts.baseUrl, opts?.path ?? '/webapp/issuer-metadata/credential-configurations/:configurationId', { stripBasePath: true })
  LOG.log(`[OID4VCI] getCredentialConfigurations endpoint enabled at ${path}`)
  if (opts?.enabled === false) {
    console.log(`"getCredentialConfigurations" Endpoint is disabled`)
    return
  }

  router.get(`${path}`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const configurationId = request.params.configurationId
      if (!configurationId) {
        return sendErrorResponse(response, 400, 'Missing configurationId')
      }

      LOG.log(`[OID4VCI] getCredentialConfigurations endpoint called with configurationId: ${configurationId}`)
      const metadata = instance.issuerMetadata as IssuerMetadataV1_0_13
      if (!metadata?.credential_configurations_supported || !metadata?.credential_configurations_supported?.[configurationId]) {
        return sendErrorResponse(response, 404, `Credential configuration ${configurationId} not found`)
      }

      const config = metadata.credential_configurations_supported[configurationId]
      return response.json({ ...config })
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function deleteCredentialConfigurationByIdEndpoint<DIDDoc extends object>(
  router: Router,
  context: IRequiredContext,
  instance: IssuerInstance,
  issuer: VcIssuer<DIDDoc>,
  opts: IGetIssueStatusEndpointOpts,
) {
  const path = determinePath(opts.baseUrl, opts?.path ?? '/webapp/issuer-metadata/credential-configurations/:configurationId', { stripBasePath: true })
  LOG.log(`[OID4VCI] deleteCredentialConfigurationById endpoint enabled at ${path}`)
  if (opts?.enabled === false) {
    console.log(`"deleteCredentialConfigurationById" Endpoint is disabled`)
    return
  }

  router.delete(`${path}`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const configurationId = request.params.configurationId
      if (!configurationId) {
        return sendErrorResponse(response, 400, 'Missing configurationId')
      }

      LOG.log(`[OID4VCI] deleteCredentialConfigurationById endpoint called with configurationId: ${configurationId}`)
      const storeMetadata = (await context.agent.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        storeId: instance.metadataOptions.storeId,
        namespace: instance.metadataOptions.storeNamespace,
        correlationId: instance.metadataOptions.credentialIssuer,
      })) as IssuerMetadataV1_0_13
      if (!storeMetadata?.credential_configurations_supported || !storeMetadata?.credential_configurations_supported?.[configurationId]) {
        return sendErrorResponse(response, 404, `Credential configuration ${configurationId} not found`)
      }
      const updateMetadata = JSON.parse(JSON.stringify(storeMetadata)) as IssuerMetadataV1_0_13
      delete updateMetadata.credential_configurations_supported[configurationId]
      await context.agent.oid4vciStorePersistMetadata({
        metadata: updateMetadata,
        metadataType: 'issuer',
        storeId: instance.metadataOptions.storeId,
        namespace: instance.metadataOptions.storeNamespace,
        correlationId: instance.metadataOptions.credentialIssuer,
        overwriteExisting: true,
        validation: true,
      })
      instance.issuerMetadata = updateMetadata
      return response.json({})
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function updateCredentialConfigurationByIdEndpoint<DIDDoc extends object>(
  router: Router,
  context: IRequiredContext,
  instance: IssuerInstance,
  issuer: VcIssuer<DIDDoc>,
  opts: IGetIssueStatusEndpointOpts,
) {
  const path = determinePath(opts.baseUrl, opts?.path ?? '/webapp/issuer-metadata/credential-configurations/:configurationId', { stripBasePath: true })
  LOG.log(`[OID4VCI] updateCredentialConfigurationById endpoint enabled at ${path}`)
  if (opts?.enabled === false) {
    console.log(`"updateCredentialConfigurationById" Endpoint is disabled`)
    return
  }

  router.put(`${path}`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const configurationId = request.params.configurationId
      if (!configurationId) {
        return sendErrorResponse(response, 400, 'Missing configurationId')
      }
      LOG.log(`[OID4VCI] updateCredentialConfigurationById endpoint called with configurationId: ${configurationId}`)
      const updatedCredentialConfiguration = request.body as CredentialConfigurationSupportedV1_0_13
      if (!updatedCredentialConfiguration || !updatedCredentialConfiguration.format) {
        return sendErrorResponse(response, 400, 'Missing credential configuration in the body, or required format missing')
      }

      const storeMetadata = (await context.agent.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        storeId: instance.metadataOptions.storeId,
        namespace: instance.metadataOptions.storeNamespace,
        correlationId: instance.metadataOptions.credentialIssuer,
      })) as IssuerMetadataV1_0_13
      if (!storeMetadata?.credential_configurations_supported || !storeMetadata?.credential_configurations_supported?.[configurationId]) {
        return sendErrorResponse(response, 404, `Credential configuration ${configurationId} not found`)
      }
      const updateMetadata = JSON.parse(JSON.stringify(storeMetadata)) as IssuerMetadataV1_0_13
      updateMetadata.credential_configurations_supported[configurationId] = updatedCredentialConfiguration
      await context.agent.oid4vciStorePersistMetadata({
        metadata: updateMetadata,
        metadataType: 'issuer',
        storeId: instance.metadataOptions.storeId,
        namespace: instance.metadataOptions.storeNamespace,
        correlationId: instance.metadataOptions.credentialIssuer,
        overwriteExisting: true,
        validation: true,
      })
      instance.issuerMetadata = updateMetadata
      return response.json({...updatedCredentialConfiguration})
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

export function newCredentialConfigurationEndpoint<DIDDoc extends object>(
    router: Router,
    context: IRequiredContext,
    instance: IssuerInstance,
    issuer: VcIssuer<DIDDoc>,
    opts: IGetIssueStatusEndpointOpts,
) {
  const path = determinePath(opts.baseUrl, opts?.path ?? '/webapp/issuer-metadata/credential-configurations/:configurationId', { stripBasePath: true })
  LOG.log(`[OID4VCI] newCredentialConfigurationById endpoint enabled at ${path}`)
  if (opts?.enabled === false) {
    console.log(`"newCredentialConfigurationById" Endpoint is disabled`)
    return
  }

  router.put(`${path}`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const configurationId = request.params.configurationId
      if (!configurationId) {
        return sendErrorResponse(response, 400, 'Missing configurationId')
      }
      LOG.log(`[OID4VCI] newCredentialConfigurationById endpoint called with configurationId: ${configurationId}`)
      const newCredentialConfiguration = request.body as CredentialConfigurationSupportedV1_0_13
      if (!newCredentialConfiguration || !newCredentialConfiguration.format) {
        return sendErrorResponse(response, 400, 'Missing credential configuration in the body, or required format missing')
      }

      const storeMetadata = (await context.agent.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        storeId: instance.metadataOptions.storeId,
        namespace: instance.metadataOptions.storeNamespace,
        correlationId: instance.metadataOptions.credentialIssuer,
      })) as IssuerMetadataV1_0_13
      if (storeMetadata?.credential_configurations_supported?.[configurationId]) {
        return sendErrorResponse(response, 400, `Credential configuration ${configurationId} already exists, cannot create new one. Please update instead.`)
      }
      const updateMetadata = JSON.parse(JSON.stringify(storeMetadata)) as IssuerMetadataV1_0_13
      updateMetadata.credential_configurations_supported[configurationId] = newCredentialConfiguration
      await context.agent.oid4vciStorePersistMetadata({
        metadata: updateMetadata,
        metadataType: 'issuer',
        storeId: instance.metadataOptions.storeId,
        namespace: instance.metadataOptions.storeNamespace,
        correlationId: instance.metadataOptions.credentialIssuer,
        overwriteExisting: true,
        validation: true,
      })
      instance.issuerMetadata = updateMetadata
      return response.json({...newCredentialConfiguration})
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}
