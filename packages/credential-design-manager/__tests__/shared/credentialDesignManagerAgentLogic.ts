import { TAgent } from '@veramo/core'
import { AddCredentialDesignArgs, CredentialDesign, ValueType } from '@sphereon/ssi-sdk.data-store-types'
import { ICredentialDesignManager, UpdateCredentialDesignArgs } from '../../src'

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
        name: 'DefaultDesign',
        tenantId: 'tenant-default',
        design: {
          label: 'DefaultDesign',
          tenantId: 'tenant-default',
          metadataKeys: [
            {
              key: 'credentialType',
              valueType: ValueType.Text,
              metadataValues: [
                { index: 0, textValue: 'VerifiableCredential' },
                { index: 1, textValue: 'DefaultDesign' },
              ],
            },
            {
              key: 'credentialFormat',
              valueType: ValueType.Text,
              metadataValues: [{ index: 0, textValue: 'sd-jwt' }],
            },
          ],
          schemaDefinitions: [
            {
              correlationId: 'DefaultDesign',
              schemaType: 'Data',
              entityType: 'VC',
              schema: JSON.stringify({ type: 'object', properties: { age: { type: 'number' } } }),
            },
          ],
          branding: {
            textColor: '#000000',
            backgroundColor: '#EEEEEE',
            logo: {
              uri: 'https://example.com/default-logo.png',
              mediaType: 'image/png',
              alt: 'Default Logo',
            },
          },
        },
      })
    })

    afterAll(async (): Promise<void> => {
      await testContext.tearDown()
    })

    it('should add a credential design', async (): Promise<void> => {
      const credentialDesign: AddCredentialDesignArgs = {
        name: 'TestDesign',
        tenantId: 'tenant-123',
        design: {
          label: 'TestDesign',
          tenantId: 'tenant-123',
          metadataKeys: [
            {
              key: 'credentialType',
              valueType: ValueType.Text,
              metadataValues: [
                { index: 0, textValue: 'VerifiableCredential' },
                { index: 1, textValue: 'TestDesign' },
              ],
            },
            {
              key: 'credentialFormat',
              valueType: ValueType.Text,
              metadataValues: [{ index: 0, textValue: 'jwt_vc_json' }],
            },
            {
              key: 'advancedSchema',
              valueType: ValueType.Boolean,
              metadataValues: [{ index: 0, booleanValue: false }],
            },
          ],
          schemaDefinitions: [
            {
              correlationId: 'TestDesign',
              schemaType: 'Data',
              entityType: 'VC',
              schema: JSON.stringify({ type: 'object', properties: { name: { type: 'string' } } }),
            },
            {
              correlationId: 'TestDesign',
              schemaType: 'UI_Form',
              entityType: 'VC',
              schema: JSON.stringify({ type: 'VerticalLayout', elements: [] }),
            },
          ],
          branding: {
            textColor: '#FFFFFF',
            backgroundColor: '#003399',
            logo: {
              uri: 'https://example.com/logo.png',
              mediaType: 'image/png',
              alt: 'Company Logo',
              dimensions: { width: 200, height: 100 },
            },
            backgroundImage: {
              uri: 'https://example.com/bg.jpg',
              mediaType: 'image/jpeg',
              alt: 'Background',
              dimensions: { width: 1920, height: 1080 },
            },
          },
        },
      }

      const result: CredentialDesign = await agent.cdmAddCredentialDesign(credentialDesign)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.label).toEqual(credentialDesign.name)
      expect(result.tenantId).toEqual(credentialDesign.tenantId)

      expect(result.metadataKeys).toBeDefined()
      expect(result.metadataKeys.length).toEqual(3)

      const credentialTypeKey = result.metadataKeys.find((k) => k.key === 'credentialType')
      expect(credentialTypeKey).toBeDefined()
      expect(credentialTypeKey!.valueType).toEqual(ValueType.Text)
      expect(credentialTypeKey!.metadataValues.length).toEqual(2)
      expect(credentialTypeKey!.metadataValues[0].textValue).toEqual('VerifiableCredential')
      expect(credentialTypeKey!.metadataValues[1].textValue).toEqual('TestDesign')

      const credentialFormatKey = result.metadataKeys.find((k) => k.key === 'credentialFormat')
      expect(credentialFormatKey).toBeDefined()
      expect(credentialFormatKey!.metadataValues.length).toEqual(1)
      expect(credentialFormatKey!.metadataValues[0].textValue).toEqual('jwt_vc_json')

      const advancedSchemaKey = result.metadataKeys.find((k) => k.key === 'advancedSchema')
      expect(advancedSchemaKey).toBeDefined()
      expect(advancedSchemaKey!.valueType).toEqual(ValueType.Boolean)
      expect(advancedSchemaKey!.metadataValues[0].booleanValue).toEqual(false)

      expect(result.schemaDefinitions).toBeDefined()
      expect(result.schemaDefinitions.length).toEqual(2)

      const dataSchema = result.schemaDefinitions.find((s) => s.schemaType === 'Data')
      expect(dataSchema).toBeDefined()
      expect(dataSchema!.correlationId).toEqual('TestDesign')
      expect(dataSchema!.entityType).toEqual('VC')
      expect(dataSchema!.schema).toEqual(credentialDesign.design!.schemaDefinitions![0].schema)

      const uiSchema = result.schemaDefinitions.find((s) => s.schemaType === 'UI_Form')
      expect(uiSchema).toBeDefined()
      expect(uiSchema!.correlationId).toEqual('TestDesign')
      expect(uiSchema!.schema).toEqual(credentialDesign.design!.schemaDefinitions![1].schema)

      expect(result.branding).toBeDefined()
      expect(result.branding!.textColor).toEqual('#FFFFFF')
      expect(result.branding!.backgroundColor).toEqual('#003399')

      expect(result.branding!.logo).toBeDefined()
      expect(result.branding!.logo!.uri).toEqual('https://example.com/logo.png')
      expect(result.branding!.logo!.mediaType).toEqual('image/png')
      expect(result.branding!.logo!.alt).toEqual('Company Logo')
      expect(result.branding!.logo!.dimensions).toBeDefined()
      expect(result.branding!.logo!.dimensions!.width).toEqual(200)
      expect(result.branding!.logo!.dimensions!.height).toEqual(100)

      expect(result.branding!.backgroundImage).toBeDefined()
      expect(result.branding!.backgroundImage!.uri).toEqual('https://example.com/bg.jpg')
      expect(result.branding!.backgroundImage!.mediaType).toEqual('image/jpeg')
      expect(result.branding!.backgroundImage!.alt).toEqual('Background')
      expect(result.branding!.backgroundImage!.dimensions).toBeDefined()
      expect(result.branding!.backgroundImage!.dimensions!.width).toEqual(1920)
      expect(result.branding!.backgroundImage!.dimensions!.height).toEqual(1080)

    })

    it('should get a credential design by id', async (): Promise<void> => {
      const result: CredentialDesign = await agent.cdmGetCredentialDesign({ credentialDesignId: defaultCredentialDesign.id })

      expect(result).toBeDefined()
      expect(result.id).toEqual(defaultCredentialDesign.id)
      expect(result.label).toEqual('DefaultDesign')
      expect(result.tenantId).toEqual('tenant-default')
      expect(result.metadataKeys.length).toEqual(2)
      expect(result.schemaDefinitions.length).toEqual(1)
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
      expect(result[0].label).toEqual('DefaultDesign')
    })

    it('should return no credential designs if filter does not match', async (): Promise<void> => {
      const result: Array<CredentialDesign> = await agent.cdmGetCredentialDesigns({ filter: { tenantId: 'non-existent-tenant' } })

      expect(result.length).toBe(0)
    })

    it('should update credential design by id', async (): Promise<void> => {
      const updatedName = 'UpdatedDefaultDesign'
      const args: UpdateCredentialDesignArgs = {
        credentialDesignId: defaultCredentialDesign.id,
        name: updatedName,
        design: {
          metadataKeys: [
            {
              key: 'credentialType',
              valueType: ValueType.Text,
              metadataValues: [
                { index: 0, textValue: 'VerifiableCredential' },
                { index: 1, textValue: updatedName },
              ],
            },
            {
              key: 'credentialFormat',
              valueType: ValueType.Text,
              metadataValues: [{ index: 0, textValue: 'jwt_vc_json' }],
            },
          ],
        },
      }

      const result: CredentialDesign = await agent.cdmUpdateCredentialDesign(args)

      expect(result.label).toEqual(updatedName)
      expect(result.metadataKeys.length).toEqual(2)

      const credentialFormatKey = result.metadataKeys.find((k) => k.key === 'credentialFormat')
      expect(credentialFormatKey).toBeDefined()
      expect(credentialFormatKey!.metadataValues[0].textValue).toEqual('jwt_vc_json')
    })

    it('should throw error when updating credential design with unknown id', async (): Promise<void> => {
      const credentialDesignId = 'unknownCredentialDesignId'

      await expect(agent.cdmUpdateCredentialDesign({ credentialDesignId, name: 'ShouldFail' })).rejects.toThrow(
        `No credential design found for id: ${credentialDesignId}`,
      )
    })

    it('should remove a credential design', async (): Promise<void> => {
      const credentialDesign = await agent.cdmAddCredentialDesign({ name: 'ToBeRemoved' })
      expect(credentialDesign).toBeDefined()

      const removeCredentialDesignResult: boolean = await agent.cdmRemoveCredentialDesign({ credentialDesignId: credentialDesign.id })
      expect(removeCredentialDesignResult).toBeTruthy()

      await expect(agent.cdmGetCredentialDesign({ credentialDesignId: credentialDesign.id })).rejects.toThrow(
        `No credential design found for id: ${credentialDesign.id}`,
      )
    })
  })
}
