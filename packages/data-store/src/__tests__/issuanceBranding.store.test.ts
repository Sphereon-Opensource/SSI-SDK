import { DataSource, IsNull } from 'typeorm'
import { IssuanceBrandingStore } from '../issuanceBranding/IssuanceBrandingStore'
//import { DataStoreMigrations } from '../migrations';
import {
  DataStoreIssuanceBrandingEntities,
  IAddCredentialLocaleBrandingArgs,
  IAddIssuerLocaleBrandingArgs,
  IBasicCredentialBranding,
  IBasicCredentialLocaleBranding,
  IBasicIssuerBranding,
  IBasicIssuerLocaleBranding,
  ICredentialBranding,
  IGetCredentialLocaleBrandingArgs,
  IIssuerBranding,
  ILocaleBranding,
  IUpdateCredentialLocaleBrandingArgs,
  IUpdateIssuerLocaleBrandingArgs
} from '../index'

describe('Database entities test', (): void => {
  let dbConnection: DataSource
  let issuanceBrandingStore: IssuanceBrandingStore

  beforeEach(async (): Promise<void> => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      logging: 'all',
      migrationsRun: false,
      // migrations: DataStoreMigrations,
      synchronize: true, //false
      entities: DataStoreIssuanceBrandingEntities,
    }).initialize()
    // await dbConnection.runMigrations()
    // expect(await dbConnection.showMigrations()).toBeFalsy()
    issuanceBrandingStore = new IssuanceBrandingStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('should add credential branding', async (): Promise<void> => {
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const result: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)

    expect(result).toBeDefined()
    expect(result?.issuerCorrelationId).toEqual(credentialBranding.issuerCorrelationId)
    expect(result?.vcHash).toEqual(credentialBranding.vcHash)
    expect(result?.localeBranding.length).toEqual(2)
  })

  it('should throw error when adding credential branding with duplicate vc hash', async (): Promise<void> => {
    const credentialBranding1: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const result: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding1)
    expect(result).toBeDefined()

    const credentialBranding2: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    await expect(issuanceBrandingStore.addCredentialBranding(credentialBranding2)).rejects.toThrowError(
      `Credential branding already present for vc with hash: ${credentialBranding2.vcHash}`
    )
  })

  it('should throw error when adding credential branding with duplicates locales', async (): Promise<void> => {
    const credentialBranding1: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    await expect(issuanceBrandingStore.addCredentialBranding(credentialBranding1)).rejects.toThrowError(
      'Credential branding contains duplicate locales'
    )

    const credentialBranding2: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
        },
        {
          alias: 'credentialTypeAlias',
        },
      ],
    }

    await expect(issuanceBrandingStore.addCredentialBranding(credentialBranding2)).rejects.toThrowError(
      'Credential branding contains duplicate locales'
    )
  })

  it('should get all credential branding', async (): Promise<void> => {
    const credentialBranding1: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash1',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedCredentialBranding1: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding1)
    expect(savedCredentialBranding1).toBeDefined()

    const credentialBranding2: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash2',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedCredentialBranding2: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding2)
    expect(savedCredentialBranding2).toBeDefined()

    const result: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialBranding()

    expect(result.length).toEqual(2)
  })

  it('should get all credential branding for a certain locale', async (): Promise<void> => {
    const credentialBranding1: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash1',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedCredentialBranding1: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding1)
    expect(savedCredentialBranding1).toBeDefined()

    const credentialBranding2: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash2',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedCredentialBranding2: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding2)
    expect(savedCredentialBranding2).toBeDefined()

    const args = {
      filter: [
        {
          localeBranding: {
            locale: 'en-US',
          },
        },
      ],
    }

    const result: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialBranding(args)

    expect(result.length).toEqual(2)
  })

  it('should get credential branding with a certain locale', async (): Promise<void> => {
    const credentialBranding1: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash1',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedCredentialBranding1: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding1)
    expect(savedCredentialBranding1).toBeDefined()

    const credentialBranding2: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash2',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedCredentialBranding2: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding2)
    expect(savedCredentialBranding2).toBeDefined()

    const args = {
      filter: [
        {
          vcHash: 'vcHash1',
          localeBranding: {
            locale: 'en-US',
          },
        },
      ],
    }

    const result: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialBranding(args)

    expect(result.length).toEqual(1)
  })

  it('should get all credential branding with no locale', async (): Promise<void> => {
    const credentialBranding1: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash1',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
        },
      ],
    }

    const savedCredentialBranding1: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding1)
    expect(savedCredentialBranding1).toBeDefined()

    const credentialBranding2: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash2',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedCredentialBranding2: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding2)
    expect(savedCredentialBranding2).toBeDefined()

    const args = {
      filter: [
        {
          localeBranding: {
            locale: IsNull(),
          },
        },
      ],
    }

    const result: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialBranding(args)

    expect(result.length).toEqual(1)
  })

  it('should get all credential branding for multiple locales', async (): Promise<void> => {
    const credentialBranding1: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash1',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedCredentialBranding1: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding1)
    expect(savedCredentialBranding1).toBeDefined()

    const credentialBranding2: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash2',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedCredentialBranding2: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding2)
    expect(savedCredentialBranding2).toBeDefined()

    const args = {
      filter: [
        {
          localeBranding: {
            locale: 'en-US',
          },
        },
        {
          localeBranding: {
            locale: 'en-GB',
          },
        },
      ],
    }

    const result: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialBranding(args)

    expect(result.length).toEqual(2)
  })

  it('should return no credential branding with not matching filter', async (): Promise<void> => {
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedCredentialBranding: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)
    expect(savedCredentialBranding).toBeDefined()

    const args = {
      filter: [
        {
          localeBranding: {
            locale: 'en-US',
          },
        },
      ],
    }

    const result: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialBranding(args)

    expect(result.length).toEqual(0)
  })

  it('should update credential branding', async (): Promise<void> => {
    // TODO improve test
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedCredentialBranding: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)
    expect(savedCredentialBranding).toBeDefined()

    const updatedCredentialBranding = {
      id: savedCredentialBranding.id,
      issuerCorrelationId: 'newIssuerCorrelationId',
      vcHash: 'newVcHash',
    }
    const result: ICredentialBranding = await issuanceBrandingStore.updateCredentialBranding({ credentialBranding: updatedCredentialBranding })

    expect(result.localeBranding.length).toEqual(1)
  })

  it('should throw error when updating credential branding with unknown id', async (): Promise<void> => {
    const credentialBranding = {
      id: 'unknownId',
      issuerCorrelationId: 'newIssuerCorrelationId',
      vcHash: 'newVcHash',
    }

    await expect(issuanceBrandingStore.updateCredentialBranding({ credentialBranding })).rejects.toThrowError(
      `No credential branding found for id: ${credentialBranding.id}`
    )
  })

  it('should remove credential branding', async (): Promise<void> => {
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedCredentialBranding: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)
    expect(savedCredentialBranding).toBeDefined()
    const branding: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialBranding()
    expect(branding.length).toEqual(1)

    await issuanceBrandingStore.removeCredentialBranding({ credentialBrandingId: savedCredentialBranding.id })
    const result: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialBranding()

    expect(result.length).toEqual(0)
  })

  it('should throw error when removing credential branding with unknown id', async (): Promise<void> => {
    const credentialBrandingId = 'unknownId'

    await expect(issuanceBrandingStore.removeCredentialBranding({ credentialBrandingId  })).rejects.toThrowError(
      `No credential branding found for id: ${credentialBrandingId}`
    )
  })

  it('should add credential locale branding', async (): Promise<void> => {
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedCredentialBranding: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)
    expect(savedCredentialBranding).toBeDefined()

    const addCredentialLocaleBrandingArgs: IAddCredentialLocaleBrandingArgs = {
      credentialBrandingId: savedCredentialBranding.id,
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const result: ICredentialBranding = await issuanceBrandingStore.addCredentialLocaleBranding(addCredentialLocaleBrandingArgs)

    expect(result.localeBranding.length).toEqual(2)
  })

  // TODO test for id not found add locale branding

  it('should throw error when adding duplicate credential locale branding', async (): Promise<void> => {
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedCredentialBranding: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)
    expect(savedCredentialBranding).toBeDefined()

    const addCredentialLocaleBrandingArgs: IAddCredentialLocaleBrandingArgs = {
      credentialBrandingId: savedCredentialBranding.id,
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    await expect(issuanceBrandingStore.addCredentialLocaleBranding(addCredentialLocaleBrandingArgs)).rejects.toThrowError(
      `Credential branding already contains locales: ${addCredentialLocaleBrandingArgs.localeBranding.map(
        (localeBranding: IBasicCredentialLocaleBranding) => localeBranding.locale
      )}`
    )
  })

  it('should get all credential locale branding for a credential branding', async (): Promise<void> => {
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'credentialCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedCredentialBranding: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)
    expect(savedCredentialBranding).toBeDefined()

    const result: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialLocaleBranding()

    expect(result.length).toEqual(2)
  })

  it('should get credential locale branding for a credential branding', async (): Promise<void> => {
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'credentialCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedCredentialBranding: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)
    expect(savedCredentialBranding).toBeDefined()

    const getCredentialLocaleBrandingArgs: IGetCredentialLocaleBrandingArgs = {
      filter: [
        {
          credentialBranding: {
            id: savedCredentialBranding.id,
          },
          locale: 'en-US',
        },
      ],
    }

    const result: Array<ICredentialBranding> = await issuanceBrandingStore.getCredentialLocaleBranding(getCredentialLocaleBrandingArgs)

    expect(result.length).toEqual(1)
  })

  it('should update credential locale branding', async (): Promise<void> => {
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'credentialCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedCredentialBranding: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)
    expect(savedCredentialBranding).toBeDefined()

    const updateCredentialLocaleBrandingArgs: IUpdateCredentialLocaleBrandingArgs = {
      localeBranding: {
        id: savedCredentialBranding.localeBranding[0].id,
        alias: savedCredentialBranding.localeBranding[0].alias,
        locale: 'en-NL',
      },
    }

    const result: ICredentialBranding = await issuanceBrandingStore.updateCredentialLocaleBranding(updateCredentialLocaleBrandingArgs)

    expect(result).toBeDefined()
  })

  it('should throw error when updating credential branding with duplicate locale', async (): Promise<void> => {
    const credentialBranding: IBasicCredentialBranding = {
      issuerCorrelationId: 'credentialCorrelationId',
      vcHash: 'vcHash',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedCredentialBranding: ICredentialBranding = await issuanceBrandingStore.addCredentialBranding(credentialBranding)
    expect(savedCredentialBranding).toBeDefined()

    const updateCredentialLocaleBrandingArgs: IUpdateCredentialLocaleBrandingArgs = {
      localeBranding: {
        id: savedCredentialBranding.localeBranding[0].id,
        alias: savedCredentialBranding.localeBranding[0].alias,
        locale: 'en-GB',
      },
    }

    // TODO locale string refactor ( make var)
    await expect(issuanceBrandingStore.updateCredentialLocaleBranding(updateCredentialLocaleBrandingArgs)).rejects.toThrowError(
      `Credential branding: ${savedCredentialBranding.id} already contains locale: ${'en-GB'}`
    )
  })









  it('should add issuer branding', async (): Promise<void> => {
    const issuerBranding: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
        {
          alias: 'credentialTypeAlias',
          locale: 'en-GB',
        },
      ],
    }

    const result: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding)

    expect(result).toBeDefined()
    expect(result?.issuerCorrelationId).toEqual(issuerBranding.issuerCorrelationId)
    expect(result?.localeBranding.length).toEqual(2)
  })

  it('should throw error when adding issuer branding with duplicate issuer correlation id', async (): Promise<void> => {
    const issuerBranding1: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    const result: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding1)
    expect(result).toBeDefined()

    const issuerBranding2: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'credentialTypeAlias',
          locale: 'en-US',
        },
      ],
    }

    await expect(issuanceBrandingStore.addIssuerBranding(issuerBranding2)).rejects.toThrowError(
      `Issuer branding already present for issuer with correlation id: ${issuerBranding2.issuerCorrelationId}`
    )
  })

  it('should throw error when adding issuer branding with duplicates locales', async (): Promise<void> => {
    const issuerBranding1: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    await expect(issuanceBrandingStore.addIssuerBranding(issuerBranding1)).rejects.toThrowError(
      'Issuer branding contains duplicate locales'
    )

    const issuerBranding2: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
        },
        {
          alias: 'issuerAlias',
        },
      ],
    }

    await expect(issuanceBrandingStore.addIssuerBranding(issuerBranding2)).rejects.toThrowError(
      'Issuer branding contains duplicate locales'
    )
  })

  it('should get all issuer branding', async (): Promise<void> => {
    const issuerBranding1: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId1',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedIssuerBranding1: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding1)
    expect(savedIssuerBranding1).toBeDefined()

    const issuerBranding2: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId2',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedIssuerBranding2: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding2)
    expect(savedIssuerBranding2).toBeDefined()

    const result: Array<IIssuerBranding> = await issuanceBrandingStore.getIssuerBranding()

    expect(result.length).toEqual(2)
  })

  it('should get all issuer branding for a certain locale', async (): Promise<void> => {
    const issuerBranding1: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId1',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedIssuerBranding1: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding1)
    expect(savedIssuerBranding1).toBeDefined()

    const issuerBranding2: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId2',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedIssuerBranding2: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding2)
    expect(savedIssuerBranding2).toBeDefined()

    const args = {
      filter: [
        {
          localeBranding: {
            locale: 'en-US',
          },
        },
      ],
    }

    const result: Array<IIssuerBranding> = await issuanceBrandingStore.getIssuerBranding(args)

    expect(result.length).toEqual(2)
  })

  it('should get issuer branding with a certain locale', async (): Promise<void> => {
    const issuerBranding1: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId1',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedIssuerBranding1: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding1)
    expect(savedIssuerBranding1).toBeDefined()

    const issuerBranding2: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId2',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedIssuerBranding2: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding2)
    expect(savedIssuerBranding2).toBeDefined()

    const args = {
      filter: [
        {
          issuerCorrelationId: 'issuerCorrelationId1',
          localeBranding: {
            locale: 'en-US',
          },
        },
      ],
    }

    const result: Array<IIssuerBranding> = await issuanceBrandingStore.getIssuerBranding(args)

    expect(result.length).toEqual(1)
  })

  it('should get all issuer branding with no locale', async (): Promise<void> => {
    const issuerBranding1: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId1',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
        {
          alias: 'issuerAlias',
        },
      ],
    }

    const savedIssuerBranding1: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding1)
    expect(savedIssuerBranding1).toBeDefined()

    const issuerBranding2: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId2',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedIssuerBranding2: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding2)
    expect(savedIssuerBranding2).toBeDefined()

    const args = {
      filter: [
        {
          localeBranding: {
            locale: IsNull(),
          },
        },
      ],
    }

    const result: Array<IIssuerBranding> = await issuanceBrandingStore.getIssuerBranding(args)

    expect(result.length).toEqual(1)
  })

  it('should get all issuer branding for multiple locales', async (): Promise<void> => {
    const issuerBranding1: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId1',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedIssuerBranding1: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding1)
    expect(savedIssuerBranding1).toBeDefined()

    const credentialBranding2: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId2',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedIssuerBranding2: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(credentialBranding2)
    expect(savedIssuerBranding2).toBeDefined()

    const args = {
      filter: [
        {
          localeBranding: {
            locale: 'en-US',
          },
        },
        {
          localeBranding: {
            locale: 'en-GB',
          },
        },
      ],
    }

    const result: Array<IIssuerBranding> = await issuanceBrandingStore.getIssuerBranding(args)

    expect(result.length).toEqual(2)
  })

  it('should return no issuer branding with not matching filter', async (): Promise<void> => {
    const issuerBranding: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedIssuerBranding: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding)
    expect(savedIssuerBranding).toBeDefined()

    const args = {
      filter: [
        {
          localeBranding: {
            locale: 'en-US',
          },
        },
      ],
    }

    const result: Array<IIssuerBranding> = await issuanceBrandingStore.getIssuerBranding(args)

    expect(result.length).toEqual(0)
  })

  it('should update issuer branding', async (): Promise<void> => {
    // TODO improve test
    const issuerBranding: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedIssuerBranding: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding)
    expect(savedIssuerBranding).toBeDefined()

    const updatedIssuerBranding = {
      id: savedIssuerBranding.id,
      issuerCorrelationId: 'newIssuerCorrelationId',
    }
    const result: IIssuerBranding = await issuanceBrandingStore.updateIssuerBranding({ issuerBranding: updatedIssuerBranding })

    expect(result.localeBranding.length).toEqual(1)
  })

  it('should throw error when updating issuer branding with unknown id', async (): Promise<void> => {
    const issuerBranding = {
      id: 'unknownId',
      issuerCorrelationId: 'newIssuerCorrelationId',
      vcHash: 'newVcHash',
    }

    await expect(issuanceBrandingStore.updateIssuerBranding({ issuerBranding })).rejects.toThrowError(
      `No issuer branding found for id: ${issuerBranding.id}`
    )
  })

  it('should remove issuer branding', async (): Promise<void> => {
    const issuerBranding: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedIssuerBranding: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding)
    expect(savedIssuerBranding).toBeDefined()
    const branding: Array<IIssuerBranding> = await issuanceBrandingStore.getIssuerBranding()
    expect(branding.length).toEqual(1)

    await issuanceBrandingStore.removeIssuerBranding({ issuerBrandingId: savedIssuerBranding.id })
    const result: Array<IIssuerBranding> = await issuanceBrandingStore.getIssuerBranding()
    expect(result.length).toEqual(0)
  })

  it('should throw error when removing issuer branding with unknown id', async (): Promise<void> => {
    const issuerBrandingId = 'unknownId'

    await expect(issuanceBrandingStore.removeIssuerBranding({ issuerBrandingId  })).rejects.toThrowError(
      `No issuer branding found for id: ${issuerBrandingId}`
    )
  })

  it('should add issuer locale branding', async (): Promise<void> => {
    const issuerBranding: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    const savedIssuerBranding: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding)
    expect(savedIssuerBranding).toBeDefined()

    const addIssuerLocaleBrandingArgs: IAddIssuerLocaleBrandingArgs = {
      issuerBrandingId: savedIssuerBranding.id,
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
      ],
    }

    const result: IIssuerBranding = await issuanceBrandingStore.addIssuerLocaleBranding(addIssuerLocaleBrandingArgs)

    expect(result.localeBranding.length).toEqual(2)
  })

  // TODO test for id not found add locale branding

  it('should throw error when adding duplicate issuer locale branding', async (): Promise<void> => {
    const issuerBranding: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedIssuerBranding: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding)
    expect(savedIssuerBranding).toBeDefined()

    const addIssuerLocaleBrandingArgs: IAddIssuerLocaleBrandingArgs = {
      issuerBrandingId: savedIssuerBranding.id,
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
      ],
    }

    await expect(issuanceBrandingStore.addIssuerLocaleBranding(addIssuerLocaleBrandingArgs)).rejects.toThrowError(
      `Issuer branding already contains locales: ${addIssuerLocaleBrandingArgs.localeBranding.map(
        (localeBranding: IBasicIssuerLocaleBranding) => localeBranding.locale
      )}`
    )
  })

  it('should get all issuer locale branding for a credential branding', async (): Promise<void> => {
    const issuerBranding: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedIssuerBranding: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding)
    expect(savedIssuerBranding).toBeDefined()

    const result: Array<ILocaleBranding> = await issuanceBrandingStore.getIssuerLocaleBranding()

    expect(result.length).toEqual(2)
  })

  // TODO 'should get specific credential locale branding for a credential branding'

  it('should update issuer locale branding', async (): Promise<void> => {
    const issuerBranding: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedIssuerBranding: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding)
    expect(savedIssuerBranding).toBeDefined()

    const updateIssuerLocaleBrandingArgs: IUpdateIssuerLocaleBrandingArgs = {
      localeBranding: {
        id: savedIssuerBranding.localeBranding[0].id,
        alias: savedIssuerBranding.localeBranding[0].alias,
        locale: 'en-NL',
      },
    }

    const result: IIssuerBranding = await issuanceBrandingStore.updateIssuerLocaleBranding(updateIssuerLocaleBrandingArgs)

    expect(result).toBeDefined()
  })

  it('should throw error when updating issuer branding with duplicate locale', async (): Promise<void> => {
    const issuerBranding: IBasicIssuerBranding = {
      issuerCorrelationId: 'issuerCorrelationId',
      localeBranding: [
        {
          alias: 'issuerAlias',
          locale: 'en-US',
        },
        {
          alias: 'issuerAlias',
          locale: 'en-GB',
        },
      ],
    }

    const savedIssuerBranding: IIssuerBranding = await issuanceBrandingStore.addIssuerBranding(issuerBranding)
    expect(savedIssuerBranding).toBeDefined()

    const updateIssuerLocaleBrandingArgs: IUpdateIssuerLocaleBrandingArgs = {
      localeBranding: {
        id: savedIssuerBranding.localeBranding[0].id,
        alias: savedIssuerBranding.localeBranding[0].alias,
        locale: 'en-GB',
      },
    }

    // TODO locale string refactor ( make var)
    await expect(issuanceBrandingStore.updateIssuerLocaleBranding(updateIssuerLocaleBrandingArgs)).rejects.toThrowError(
      `Issuer branding: ${savedIssuerBranding.id} already contains locale: ${'en-GB'}`
    )
  })
})
