import { DataSource } from 'typeorm'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DataStoreStatusListEntities, IBitstringStatusListEntity } from '../index'
import { DataStoreStatusListMigrations } from '../migrations'
import { StatusListStore } from '../statusList/StatusListStore'
import { IOAuthStatusListEntity, IStatusList2021Entity, IStatusListEntryEntity } from '../types'
import { StatusListCredentialIdMode, StatusListDriverType, StatusListType } from '@sphereon/ssi-types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('Status list store tests', () => {
  let dbConnection: DataSource
  let statusListStore: StatusListStore

  beforeEach(async () => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      migrationsRun: false,
      migrations: DataStoreStatusListMigrations,
      synchronize: false,
      entities: DataStoreStatusListEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    statusListStore = new StatusListStore(dbConnection)
  })

  afterEach(async () => {
    await dbConnection.destroy()
  })

  it('should store status list', async () => {
    const statusList: IStatusList2021Entity = {
      id: 'test-list-1',
      correlationId: 'correlation-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.StatusList2021,
      proofFormat: 'jwt',
      statusPurpose: 'revocation',
      indexingDirection: 'rightToLeft',
      issuer: 'did:example:123',
    }

    const result = await statusListStore.addStatusList(statusList)
    expect(result).toBeDefined()
    expect(result.id).toEqual(statusList.id)
    expect(result.correlationId).toEqual(statusList.correlationId)
  })

  it('should store status list entry', async () => {
    const statusList: IStatusList2021Entity = {
      id: 'test-list-1',
      correlationId: 'correlation-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.StatusList2021,
      proofFormat: 'jwt',
      statusPurpose: 'revocation',
      indexingDirection: 'rightToLeft',
      issuer: 'did:example:123',
    }

    await statusListStore.addStatusList(statusList)

    const entry: IStatusListEntryEntity = {
      statusListId: statusList.id,
      statusListIndex: 1,
      credentialId: 'credential-1',
      credentialHash: 'hash-1',
      correlationId: 'correlation-1',
      value: '1',
    }

    const result = await statusListStore.addStatusListEntry(entry)
    expect(result).toBeDefined()
    expect(result.statusListIndex).toEqual(entry.statusListIndex)
    expect(result.credentialId).toEqual(entry.credentialId)
  })

  it('should store OAuth status list', async () => {
    const statusList: IOAuthStatusListEntity = {
      id: 'oauth-list-1',
      correlationId: 'correlation-oauth-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.OAuthStatusList,
      proofFormat: 'jwt',
      bitsPerStatus: 1,
      expiresAt: new Date('2025-01-01T00:00:00Z'),
      issuer: 'did:example:123',
    }

    const result = (await statusListStore.addStatusList(statusList)) as IOAuthStatusListEntity
    expect(result).toBeDefined()
    expect(result.id).toEqual(statusList.id)
    expect(result.correlationId).toEqual(statusList.correlationId)
    expect(result.bitsPerStatus).toEqual(statusList.bitsPerStatus)
    expect(result.expiresAt).toEqual(statusList.expiresAt)
  })

  it('should store and retrieve both types of status lists', async () => {
    const statusList2021: IStatusList2021Entity = {
      id: 'test-list-1',
      correlationId: 'correlation-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.StatusList2021,
      proofFormat: 'jwt',
      statusPurpose: 'revocation',
      indexingDirection: 'rightToLeft',
      issuer: 'did:example:123',
    }

    const oauthStatusList: IOAuthStatusListEntity = {
      id: 'oauth-list-1',
      correlationId: 'correlation-oauth-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.OAuthStatusList,
      proofFormat: 'jwt',
      bitsPerStatus: 1,
      issuer: 'did:example:456',
    }

    await statusListStore.addStatusList(statusList2021)
    await statusListStore.addStatusList(oauthStatusList)

    const found2021 = (await statusListStore.getStatusList({ id: statusList2021.id })) as IStatusList2021Entity
    const foundOAuth = (await statusListStore.getStatusList({ id: oauthStatusList.id })) as IOAuthStatusListEntity

    expect(found2021.type).toEqual(StatusListType.StatusList2021)
    expect(found2021.statusPurpose).toEqual('revocation')
    expect(foundOAuth.type).toEqual(StatusListType.OAuthStatusList)
    expect((foundOAuth as IOAuthStatusListEntity).bitsPerStatus).toEqual(1)
  })

  it('should get status list by id', async () => {
    const statusList: IStatusList2021Entity = {
      id: 'test-list-1',
      correlationId: 'correlation-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.StatusList2021,
      proofFormat: 'jwt',
      statusPurpose: 'revocation',
      indexingDirection: 'rightToLeft',
      issuer: 'did:example:123',
    }

    await statusListStore.addStatusList(statusList)

    const result = await statusListStore.getStatusList({ id: statusList.id })
    expect(result).toBeDefined()
    expect(result.id).toEqual(statusList.id)
  })

  it('should get status lists with filter', async () => {
    const statusList1: IStatusList2021Entity = {
      id: 'test-list-1',
      correlationId: 'correlation-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.StatusList2021,
      proofFormat: 'jwt',
      statusPurpose: 'revocation',
      indexingDirection: 'rightToLeft',
      issuer: 'did:example:123',
    }

    const statusList2: IStatusList2021Entity = {
      id: 'test-list-2',
      correlationId: 'correlation-2',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.StatusList2021,
      proofFormat: 'jwt',
      statusPurpose: 'suspension',
      indexingDirection: 'rightToLeft',
      issuer: 'did:example:456',
    }

    await statusListStore.addStatusList(statusList1)
    await statusListStore.addStatusList(statusList2)

    const result = await statusListStore.getStatusLists({
      filter: [{ statusPurpose: 'revocation' }],
    })

    expect(result.length).toEqual(1)
    expect(result[0].id).toEqual(statusList1.id)
  })

  it('should delete status list', async () => {
    const statusList: IStatusList2021Entity = {
      id: 'test-list-1',
      correlationId: 'correlation-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.StatusList2021,
      proofFormat: 'jwt',
      statusPurpose: 'revocation',
      indexingDirection: 'rightToLeft',
      issuer: 'did:example:123',
    }

    await statusListStore.addStatusList(statusList)
    const entry: IStatusListEntryEntity = {
      statusListId: statusList.id,
      statusListIndex: 1,
      credentialId: 'credential-1',
      credentialHash: 'hash-1',
      correlationId: 'correlation-1',
      value: '1',
    }
    await statusListStore.addStatusListEntry(entry)

    const result = await statusListStore.removeStatusList({ id: statusList.id })
    expect(result).toEqual(true)

    await expect(statusListStore.getStatusList({ id: statusList.id })).rejects.toThrow(`No status list found for id ${statusList.id}`)
  })

  it('should store bitstring status list', async () => {
    const statusList: IBitstringStatusListEntity = {
      id: 'bitstring-list-1',
      correlationId: 'correlation-bitstring-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 131072,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.BitstringStatusList,
      proofFormat: 'lds',
      statusPurpose: 'revocation',
      bitsPerStatus: 1,
      ttl: 3600000,
      validFrom: new Date('2024-01-01T00:00:00Z'),
      validUntil: new Date('2025-01-01T00:00:00Z'),
      issuer: 'did:example:789',
    }

    const result = await statusListStore.addStatusList(statusList)
    expect(result).toBeDefined()
    expect(result.id).toEqual(statusList.id)
    expect((result as IBitstringStatusListEntity).statusPurpose).toEqual(statusList.statusPurpose)
    expect((result as IBitstringStatusListEntity).ttl).toEqual(statusList.ttl)
  })

  it('should store and retrieve all three types of status lists', async () => {
    const statusList2021: IStatusList2021Entity = {
      id: 'test-list-1',
      correlationId: 'correlation-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 100000,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.StatusList2021,
      proofFormat: 'jwt',
      statusPurpose: 'revocation',
      indexingDirection: 'rightToLeft',
      issuer: 'did:example:123',
    }

    const bitstringStatusList: IBitstringStatusListEntity = {
      id: 'bitstring-list-1',
      correlationId: 'correlation-bitstring-1',
      driverType: StatusListDriverType.AGENT_TYPEORM,
      length: 131072,
      credentialIdMode: StatusListCredentialIdMode.ISSUANCE,
      type: StatusListType.BitstringStatusList,
      proofFormat: 'lds',
      statusPurpose: 'suspension',
      ttl: 3600000,
      issuer: 'did:example:789',
    }

    await statusListStore.addStatusList(statusList2021)
    await statusListStore.addStatusList(bitstringStatusList)

    const found2021 = await statusListStore.getStatusList({ id: statusList2021.id })
    const foundBitstring = await statusListStore.getStatusList({ id: bitstringStatusList.id })

    expect(found2021.type).toEqual(StatusListType.StatusList2021)
    expect(foundBitstring.type).toEqual(StatusListType.BitstringStatusList)
    expect((foundBitstring as IBitstringStatusListEntity).statusPurpose).toEqual('suspension')
  })
})
