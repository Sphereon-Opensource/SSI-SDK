import { DataSource } from 'typeorm'
import { DataStoreUniformCredentialEntities, uniformCredentialEntityFromAddArgs } from '../index'
import { DataStoreUniformCredentialMigrations } from '../migrations'
import { UniformCredentialEntity } from '../entities/uniformCredential/UniformCredentialEntity'
import { CredentialCorrelationType, CredentialDocumentFormat, CredentialTypeEnum } from '../types/uniformCredential/uniformCredential'
import { computeEntryHash } from '@veramo/utils'
import { AddUniformCredentialArgs } from '../types/uniformCredential/IAbstractUniformCredentialStore'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource

  beforeEach(async (): Promise<void> => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      migrations: DataStoreUniformCredentialMigrations,
      synchronize: false,
      entities: [...DataStoreUniformCredentialEntities],
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('should save uniform credential to database', async (): Promise<void> => {
    console.log(`going to save the credential...`)
    const rawCredential: string =
      'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw'
    const uniformCredential: AddUniformCredentialArgs = {
      credentialType: CredentialTypeEnum.VC,
      documentFormat: CredentialDocumentFormat.JWT,
      raw: rawCredential,
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const uniformCredentialEntity: UniformCredentialEntity = uniformCredentialEntityFromAddArgs(uniformCredential)
    const fromDb: UniformCredentialEntity = await dbConnection.getRepository(UniformCredentialEntity).save(uniformCredentialEntity)
    console.log(`saved uniformCredential: ${JSON.stringify(fromDb, null, 2)}`)
    expect(fromDb).toBeDefined()
    expect(fromDb?.id).not.toBeNull()
    expect(fromDb?.credentialType).toEqual(CredentialTypeEnum.VC)
    expect(fromDb?.documentFormat).toEqual(CredentialDocumentFormat.JWT)
    expect(fromDb?.raw).toEqual(rawCredential)
    expect(fromDb?.hash).toEqual(computeEntryHash(rawCredential))
    expect(fromDb?.issuerCorrelationType).toEqual(CredentialCorrelationType.DID)
    expect(fromDb?.subjectCorrelationType).toEqual(CredentialCorrelationType.DID)
    expect(fromDb?.issuerCorrelationId).toEqual('did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj')
    expect(fromDb?.subjectCorrelationId).toEqual('did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj')
    expect(fromDb?.tenantId).toEqual('urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj')
  })
})
