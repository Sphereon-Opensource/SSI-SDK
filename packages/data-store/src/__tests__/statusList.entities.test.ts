import { DataSource } from 'typeorm'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DataStoreStatusListEntities, StatusListEntryEntity } from '../index'
import { DataStoreStatusListMigrations } from '../migrations'
import { OAuthStatusListEntity, StatusList2021Entity } from '../entities/statusList/StatusListEntities'
import { StatusListCredentialIdMode, StatusListDriverType } from '@sphereon/ssi-types'

describe('Status list entities tests', () => {
  let dbConnection: DataSource

  beforeEach(async () => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      migrationsRun: false,
      migrations: DataStoreStatusListMigrations,
      synchronize: false,
      entities: [...DataStoreStatusListEntities],
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async () => {
    await dbConnection.destroy()
  })

  it('should save status list to database', async () => {
    const statusList = new StatusList2021Entity()
    statusList.id = 'test-list-1'
    statusList.correlationId = 'correlation-1'
    statusList.driverType = StatusListDriverType.AGENT_TYPEORM
    statusList.length = 100000
    statusList.credentialIdMode = StatusListCredentialIdMode.ISSUANCE
    statusList.proofFormat = 'jwt'
    statusList.statusPurpose = 'revocation'
    statusList.indexingDirection = 'rightToLeft'
    statusList.issuer = 'did:example:123'

    const fromDb = await dbConnection.getRepository(StatusList2021Entity).save(statusList)
    expect(fromDb).toBeDefined()
    expect(fromDb.id).toEqual(statusList.id)
    expect(fromDb.correlationId).toEqual(statusList.correlationId)
    expect(fromDb.length).toEqual(statusList.length)
    expect(fromDb.credentialIdMode).toEqual(statusList.credentialIdMode)
    expect(fromDb.statusPurpose).toEqual(statusList.statusPurpose)
    expect(fromDb.indexingDirection).toEqual(statusList.indexingDirection)
    expect(fromDb.issuer).toEqual(statusList.issuer)
  })

  it('should save status list entry to database', async () => {
    const statusList = new StatusList2021Entity()
    statusList.id = 'test-list-1'
    statusList.correlationId = 'correlation-1'
    statusList.driverType = StatusListDriverType.AGENT_TYPEORM
    statusList.length = 100000
    statusList.credentialIdMode = StatusListCredentialIdMode.ISSUANCE
    statusList.proofFormat = 'jwt'
    statusList.statusPurpose = 'revocation'
    statusList.indexingDirection = 'rightToLeft'
    statusList.issuer = 'did:example:123'

    await dbConnection.getRepository(StatusList2021Entity).save(statusList)

    const entry = new StatusListEntryEntity()
    entry.statusList = statusList
    entry.statusListIndex = 1
    entry.credentialId = 'credential-1'
    entry.credentialHash = 'hash-1'
    entry.correlationId = 'correlation-1'
    entry.value = '1'

    const fromDb = await dbConnection.getRepository(StatusListEntryEntity).save(entry)
    expect(fromDb).toBeDefined()
    expect(fromDb.statusListIndex).toEqual(entry.statusListIndex)
    expect(fromDb.credentialId).toEqual(entry.credentialId)
    expect(fromDb.credentialHash).toEqual(entry.credentialHash)
    expect(fromDb.correlationId).toEqual(entry.correlationId)
    expect(fromDb.value).toEqual(entry.value)
  })

  it('should handle complex issuer object', async () => {
    const statusList = new StatusList2021Entity()
    statusList.id = 'test-list-1'
    statusList.correlationId = 'correlation-1'
    statusList.driverType = StatusListDriverType.AGENT_TYPEORM
    statusList.length = 100000
    statusList.credentialIdMode = StatusListCredentialIdMode.ISSUANCE
    statusList.proofFormat = 'jwt'
    statusList.statusPurpose = 'revocation'
    statusList.indexingDirection = 'rightToLeft'
    statusList.issuer = { id: 'did:example:123', name: 'Test Issuer' }

    const fromDb = await dbConnection.getRepository(StatusList2021Entity).save(statusList)
    expect(fromDb).toBeDefined()
    expect(fromDb.issuer).toEqual(statusList.issuer)
    expect(typeof fromDb.issuer).toEqual('object')
    expect((fromDb.issuer as any).id).toEqual('did:example:123')
    expect((fromDb.issuer as any).name).toEqual('Test Issuer')
  })

  it('should save OAuth status list to database', async () => {
    const statusList = new OAuthStatusListEntity()
    statusList.id = 'oauth-list-1'
    statusList.correlationId = 'correlation-oauth-1'
    statusList.driverType = StatusListDriverType.AGENT_TYPEORM
    statusList.length = 100000
    statusList.credentialIdMode = StatusListCredentialIdMode.ISSUANCE
    statusList.proofFormat = 'jwt'
    statusList.bitsPerStatus = 1
    statusList.expiresAt = new Date('2025-01-01T00:00:00Z')
    statusList.issuer = 'did:example:123'

    const fromDb = await dbConnection.getRepository(OAuthStatusListEntity).save(statusList)
    expect(fromDb).toBeDefined()
    expect(fromDb.id).toEqual(statusList.id)
    expect(fromDb.correlationId).toEqual(statusList.correlationId)
    expect(fromDb.length).toEqual(statusList.length)
    expect(fromDb.credentialIdMode).toEqual(statusList.credentialIdMode)
    expect(fromDb.bitsPerStatus).toEqual(statusList.bitsPerStatus)
    expect(fromDb.expiresAt).toEqual(statusList.expiresAt)
    expect(fromDb.issuer).toEqual(statusList.issuer)
  })

  it('should handle both status list types having entries', async () => {
    const statusList2021 = new StatusList2021Entity()
    statusList2021.id = 'test-list-1'
    statusList2021.correlationId = 'correlation-1'
    statusList2021.driverType = StatusListDriverType.AGENT_TYPEORM
    statusList2021.length = 100000
    statusList2021.credentialIdMode = StatusListCredentialIdMode.ISSUANCE
    statusList2021.proofFormat = 'jwt'
    statusList2021.statusPurpose = 'revocation'
    statusList2021.indexingDirection = 'rightToLeft'
    statusList2021.issuer = 'did:example:123'
    await dbConnection.getRepository(StatusList2021Entity).save(statusList2021)

    const oauthStatusList = new OAuthStatusListEntity()
    oauthStatusList.id = 'oauth-list-1'
    oauthStatusList.correlationId = 'correlation-oauth-1'
    oauthStatusList.driverType = StatusListDriverType.AGENT_TYPEORM
    oauthStatusList.length = 100000
    oauthStatusList.credentialIdMode = StatusListCredentialIdMode.ISSUANCE
    oauthStatusList.proofFormat = 'jwt'
    oauthStatusList.bitsPerStatus = 1
    oauthStatusList.issuer = 'did:example:456'
    await dbConnection.getRepository(OAuthStatusListEntity).save(oauthStatusList)

    const entry2021 = new StatusListEntryEntity()
    entry2021.statusList = statusList2021
    entry2021.statusListIndex = 1
    entry2021.credentialId = 'credential-1'
    entry2021.credentialHash = 'hash-1'
    entry2021.value = '1'
    await dbConnection.getRepository(StatusListEntryEntity).save(entry2021)

    const entryOAuth = new StatusListEntryEntity()
    entryOAuth.statusList = oauthStatusList
    entryOAuth.statusListIndex = 1
    entryOAuth.credentialId = 'credential-2'
    entryOAuth.credentialHash = 'hash-2'
    entryOAuth.value = '1'
    await dbConnection.getRepository(StatusListEntryEntity).save(entryOAuth)

    const found2021Entry = await dbConnection.getRepository(StatusListEntryEntity).findOne({
      where: { statusList: statusList2021.id, statusListIndex: 1 },
    })
    const foundOAuthEntry = await dbConnection.getRepository(StatusListEntryEntity).findOne({
      where: { statusList: oauthStatusList.id, statusListIndex: 1 },
    })

    expect(found2021Entry).toBeDefined()
    expect(found2021Entry?.credentialId).toEqual('credential-1')
    expect(foundOAuthEntry).toBeDefined()
    expect(foundOAuthEntry?.credentialId).toEqual('credential-2')
  })

  it('should cascade delete entries when status list is deleted', async () => {
    const statusList = new StatusList2021Entity()
    statusList.id = 'test-list-1'
    statusList.correlationId = 'correlation-1'
    statusList.driverType = StatusListDriverType.AGENT_TYPEORM
    statusList.length = 100000
    statusList.credentialIdMode = StatusListCredentialIdMode.ISSUANCE
    statusList.proofFormat = 'jwt'
    statusList.statusPurpose = 'revocation'
    statusList.indexingDirection = 'rightToLeft'
    statusList.issuer = 'did:example:123'

    const savedStatusList = await dbConnection.getRepository(StatusList2021Entity).save(statusList)

    const entry = new StatusListEntryEntity()
    entry.statusList = statusList
    entry.statusListIndex = 1
    entry.credentialId = 'credential-1'
    entry.credentialHash = 'hash-1'
    entry.correlationId = 'correlation-1'
    entry.value = '1'

    await dbConnection.getRepository(StatusListEntryEntity).save(entry)

    // First delete entry, otherwise constraint fails
    await dbConnection.getRepository(StatusListEntryEntity).delete({ statusList: savedStatusList.id })
    await dbConnection.getRepository(StatusList2021Entity).remove(savedStatusList)

    const foundEntry = await dbConnection.getRepository(StatusListEntryEntity).findOne({
      where: {
        statusList: statusList.id,
        statusListIndex: entry.statusListIndex,
      },
    })
    expect(foundEntry).toBeNull()
  })
})
