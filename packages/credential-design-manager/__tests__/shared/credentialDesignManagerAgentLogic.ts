import { TAgent } from '@veramo/core'
import { CredentialDesign } from '@sphereon/ssi-sdk.data-store-types'
import {
  AddCredentialDesignArgs,
  ICredentialDesignManager,
  UpdateCredentialDesignArgs,
} from '../../src'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

type ConfiguredAgent = TAgent<ICredentialDesignManager>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Credential Design Manager Agent Plugin', (): void => {
    let agent: ConfiguredAgent
    let defaultCredentialDesign: CredentialDesign

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()

      defaultCredentialDesign = await agent.cdmAddCredentialDesign({
        identifier: 'DefaultDesign',
        tenantId: 'tenant-default',
        schema: { type: 'object', properties: { age: { type: 'number' } } },
        uiSchema: { type: 'VerticalLayout', elements: [] },
        options: {
          format: 'sd-jwt',
        },
        branding: {
          textColor: '#000000',
          backgroundColor: '#EEEEEE',
          logo: {
            uri: 'https://example.com/default-logo.png',
          },
        },
      })
    })

    afterAll(async (): Promise<void> => {
      await testContext.tearDown()
    })

    it('should add a credential design', async (): Promise<void> => {
      const args: AddCredentialDesignArgs = {
        identifier: 'TestDesign',
        tenantId: 'tenant-123',
        schema: { type: 'object', properties: { name: { type: 'string' } } },
        uiSchema: { type: 'VerticalLayout', elements: [] },
        options: {
          format: 'jwt_vc_json',
          vct: 'TestVCT',
          scope: 'test_scope',
          cryptographicBindingMethodsSupported: ['did:key', 'did:jwk'],
          credentialSigningAlgValuesSupported: ['ES256', 'EdDSA'],
          proofTypesSupported: { jwt: { proof_signing_alg_values_supported: ['ES256'] } },
        },
        isAdvancedSchema: false,
        branding: {
          textColor: '#FFFFFF',
          backgroundColor: '#003399',
          logo: {
            uri: 'https://example.com/logo.png',
            dimensions: { width: 200, height: 100 },
          },
          backgroundImage: {
            uri: 'https://example.com/bg.jpg',
            dimensions: { width: 1920, height: 1080 },
          },
        },
      }

      const result: CredentialDesign = await agent.cdmAddCredentialDesign(args)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.identifier).toEqual(args.identifier)
      expect(result.tenantId).toEqual(args.tenantId)

      // Verify metadata keys are built from options
      expect(result.metadataKeys).toBeDefined()

      const formatKey = result.metadataKeys.find((k) => k.key === 'format')
      expect(formatKey).toBeDefined()
      expect(formatKey!.metadataValues[0].textValue).toEqual('jwt_vc_json')

      const vctKey = result.metadataKeys.find((k) => k.key === 'vct')
      expect(vctKey).toBeDefined()
      expect(vctKey!.metadataValues[0].textValue).toEqual('TestVCT')

      const scopeKey = result.metadataKeys.find((k) => k.key === 'scope')
      expect(scopeKey).toBeDefined()
      expect(scopeKey!.metadataValues[0].textValue).toEqual('test_scope')

      const bindingMethodsKey = result.metadataKeys.find((k) => k.key === 'cryptographicBindingMethodsSupported')
      expect(bindingMethodsKey).toBeDefined()
      expect(bindingMethodsKey!.metadataValues.length).toEqual(2)
      expect(bindingMethodsKey!.metadataValues[0].textValue).toEqual('did:key')
      expect(bindingMethodsKey!.metadataValues[1].textValue).toEqual('did:jwk')

      const signingAlgKey = result.metadataKeys.find((k) => k.key === 'credentialSigningAlgValuesSupported')
      expect(signingAlgKey).toBeDefined()
      expect(signingAlgKey!.metadataValues.length).toEqual(2)

      const proofTypesKey = result.metadataKeys.find((k) => k.key === 'proofTypesSupported')
      expect(proofTypesKey).toBeDefined()
      expect(JSON.parse(proofTypesKey!.metadataValues[0].textValue!)).toEqual(args.options.proofTypesSupported)

      const advancedSchemaKey = result.metadataKeys.find((k) => k.key === 'isAdvancedSchema')
      expect(advancedSchemaKey).toBeDefined()
      expect(advancedSchemaKey!.metadataValues[0].booleanValue).toEqual(false)

      // Verify schema definitions are built from schema + uiSchema
      expect(result.schemaDefinitions).toBeDefined()
      expect(result.schemaDefinitions.length).toEqual(2)

      const dataSchema = result.schemaDefinitions.find((s) => s.schemaType === 'Data')
      expect(dataSchema).toBeDefined()
      expect(dataSchema!.correlationId).toEqual('TestDesign')
      expect(dataSchema!.entityType).toEqual('VC')
      expect(JSON.parse(dataSchema!.schema)).toEqual(args.schema)

      const uiSchema = result.schemaDefinitions.find((s) => s.schemaType === 'UI_Form')
      expect(uiSchema).toBeDefined()
      expect(JSON.parse(uiSchema!.schema)).toEqual(args.uiSchema)

      // Verify branding
      expect(result.branding).toBeDefined()
      expect(result.branding!.textColor).toEqual('#FFFFFF')
      expect(result.branding!.backgroundColor).toEqual('#003399')

      expect(result.branding!.logo).toBeDefined()
      expect(result.branding!.logo!.uri).toEqual('https://example.com/logo.png')
      expect(result.branding!.logo!.dimensions).toBeDefined()
      expect(result.branding!.logo!.dimensions!.width).toEqual(200)
      expect(result.branding!.logo!.dimensions!.height).toEqual(100)

      expect(result.branding!.backgroundImage).toBeDefined()
      expect(result.branding!.backgroundImage!.uri).toEqual('https://example.com/bg.jpg')
      expect(result.branding!.backgroundImage!.dimensions).toBeDefined()
      expect(result.branding!.backgroundImage!.dimensions!.width).toEqual(1920)
      expect(result.branding!.backgroundImage!.dimensions!.height).toEqual(1080)
    })

    it('should get a credential design by id', async (): Promise<void> => {
      const result: CredentialDesign = await agent.cdmGetCredentialDesign({ credentialDesignId: defaultCredentialDesign.id })

      expect(result).toBeDefined()
      expect(result.id).toEqual(defaultCredentialDesign.id)
      expect(result.identifier).toEqual('DefaultDesign')
      expect(result.tenantId).toEqual('tenant-default')
      expect(result.schemaDefinitions.length).toEqual(2)
      expect(result.branding).toBeDefined()
      expect(result.branding!.textColor).toEqual('#000000')
      expect(result.branding!.logo).toBeDefined()
      expect(result.branding!.logo!.uri).toEqual('https://example.com/default-logo.png')
    })

    it('should throw error when getting credential design with unknown id', async (): Promise<void> => {
      const credentialDesignId = 'unknownCredentialDesignId'

      await expect(agent.cdmGetCredentialDesign({ credentialDesignId })).rejects.toThrow(`No credential design found for id: ${credentialDesignId}`)
    })

    it('should get all credential designs', async (): Promise<void> => {
      const result = await agent.cdmGetCredentialDesigns()

      expect(result.length).toBeGreaterThan(0)
    })

    it('should get credential designs by filter', async (): Promise<void> => {
      const result: Array<CredentialDesign> = await agent.cdmGetCredentialDesigns({ filter: { tenantId: 'tenant-default' } })

      expect(result.length).toBe(1)
      expect(result[0].identifier).toEqual('DefaultDesign')
    })

    it('should return no credential designs if filter does not match', async (): Promise<void> => {
      const result: Array<CredentialDesign> = await agent.cdmGetCredentialDesigns({ filter: { tenantId: 'non-existent-tenant' } })

      expect(result.length).toBe(0)
    })

    it('should get credential designs with pagination using limit', async (): Promise<void> => {
      // Add extra designs for pagination testing
      await agent.cdmAddCredentialDesign({
        identifier: 'PaginationDesign1',
        tenantId: 'tenant-pagination',
        schema: { type: 'object' },
        uiSchema: { type: 'VerticalLayout', elements: [] },
        options: { format: 'sd-jwt' },
      })
      await agent.cdmAddCredentialDesign({
        identifier: 'PaginationDesign2',
        tenantId: 'tenant-pagination',
        schema: { type: 'object' },
        uiSchema: { type: 'VerticalLayout', elements: [] },
        options: { format: 'sd-jwt' },
      })
      await agent.cdmAddCredentialDesign({
        identifier: 'PaginationDesign3',
        tenantId: 'tenant-pagination',
        schema: { type: 'object' },
        uiSchema: { type: 'VerticalLayout', elements: [] },
        options: { format: 'sd-jwt' },
      })

      const page1 = await agent.cdmGetCredentialDesigns({ filter: { tenantId: 'tenant-pagination' }, limit: 2, offset: 0 })
      expect(page1.length).toBe(2)

      const page2 = await agent.cdmGetCredentialDesigns({ filter: { tenantId: 'tenant-pagination' }, limit: 2, offset: 2 })
      expect(page2.length).toBe(1)

      // Ensure no overlap between pages
      const page1Ids = page1.map((d) => d.id)
      const page2Ids = page2.map((d) => d.id)
      for (const id of page2Ids) {
        expect(page1Ids).not.toContain(id)
      }
    })

    it('should get credential designs with offset only', async (): Promise<void> => {
      const all = await agent.cdmGetCredentialDesigns({ filter: { tenantId: 'tenant-pagination' } })
      const offset1 = await agent.cdmGetCredentialDesigns({ filter: { tenantId: 'tenant-pagination' }, offset: 1 })

      expect(offset1.length).toBe(all.length - 1)
    })

    it('should return empty array when offset exceeds total', async (): Promise<void> => {
      const result = await agent.cdmGetCredentialDesigns({ filter: { tenantId: 'tenant-pagination' }, offset: 1000 })

      expect(result.length).toBe(0)
    })

    it('should count credential designs', async (): Promise<void> => {
      const total = await agent.cdmCredentialDesignCount({})
      expect(total.count).toBeGreaterThan(0)

      const tenantCount = await agent.cdmCredentialDesignCount({ filter: { tenantId: 'tenant-pagination' } })
      expect(tenantCount.count).toBe(3)

      const emptyCount = await agent.cdmCredentialDesignCount({ filter: { tenantId: 'non-existent-tenant' } })
      expect(emptyCount.count).toBe(0)
    })

    it('should get or create a form step', async (): Promise<void> => {
      const result = await agent.cdmFormStepGetOrCreate({ formId: 'credentialIssuanceWizard' })
      expect(result.formStepId).toBeDefined()
      expect(typeof result.formStepId).toBe('string')

      // Calling again should return the same ID
      const sameResult = await agent.cdmFormStepGetOrCreate({ formId: 'credentialIssuanceWizard' })
      expect(sameResult.formStepId).toEqual(result.formStepId)

      // Different formId should return a different ID
      const otherResult = await agent.cdmFormStepGetOrCreate({ formId: 'anotherForm' })
      expect(otherResult.formStepId).toBeDefined()
      expect(otherResult.formStepId).not.toEqual(result.formStepId)
    })

    it('should update credential design by id', async (): Promise<void> => {
      const args: UpdateCredentialDesignArgs = {
        credentialDesignId: defaultCredentialDesign.id,
        identifier: 'UpdatedDefaultDesign',
        schema: { type: 'object', properties: { updatedField: { type: 'string' } } },
        uiSchema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/updatedField' }] },
        options: {
          format: 'jwt_vc_json',
          vct: 'UpdatedVCT',
        },
        isAdvancedSchema: true,
      }

      const result: CredentialDesign = await agent.cdmUpdateCredentialDesign(args)

      expect(result.identifier).toEqual('UpdatedDefaultDesign')

      const formatKey = result.metadataKeys.find((k) => k.key === 'format')
      expect(formatKey).toBeDefined()
      expect(formatKey!.metadataValues[0].textValue).toEqual('jwt_vc_json')

      const vctKey = result.metadataKeys.find((k) => k.key === 'vct')
      expect(vctKey).toBeDefined()
      expect(vctKey!.metadataValues[0].textValue).toEqual('UpdatedVCT')

      const advancedSchemaKey = result.metadataKeys.find((k) => k.key === 'isAdvancedSchema')
      expect(advancedSchemaKey).toBeDefined()
      expect(advancedSchemaKey!.metadataValues[0].booleanValue).toEqual(true)

      const dataSchema = result.schemaDefinitions.find((s) => s.schemaType === 'Data')
      expect(dataSchema).toBeDefined()
      expect(JSON.parse(dataSchema!.schema)).toEqual(args.schema)
    })

    it('should throw error when updating credential design with unknown id', async (): Promise<void> => {
      const credentialDesignId = 'unknownCredentialDesignId'

      await expect(
        agent.cdmUpdateCredentialDesign({
          credentialDesignId,
          identifier: 'ShouldFail',
          schema: { type: 'object' },
          uiSchema: { type: 'VerticalLayout', elements: [] },
          options: { format: 'sd-jwt' },
        }),
      ).rejects.toThrow(`No credential design found for id: ${credentialDesignId}`)
    })

    it('should remove a credential design', async (): Promise<void> => {
      const credentialDesign = await agent.cdmAddCredentialDesign({
        identifier: 'ToBeRemoved',
        schema: { type: 'object' },
        uiSchema: { type: 'VerticalLayout', elements: [] },
        options: { format: 'sd-jwt' },
      })
      expect(credentialDesign).toBeDefined()

      const removeResult = await agent.cdmRemoveCredentialDesign({ credentialDesignId: credentialDesign.id })
      expect(removeResult.result).toBe(true)

      await expect(agent.cdmGetCredentialDesign({ credentialDesignId: credentialDesign.id })).rejects.toThrow(
        `No credential design found for id: ${credentialDesign.id}`,
      )
    })
  })
}
