import { DataSource } from 'typeorm'
import { DataStoreUniformCredentialMigrations } from '../migrations'
import { DataStoreUniformCredentialEntities, UniformCredentialEntity } from '../index'
import { UniformCredentialStore } from '../uniformCredential/UniformCredentialStore'
import {
  CredentialCorrelationType,
  CredentialDocumentFormat,
  CredentialStateType,
  CredentialTypeEnum,
  UniformCredential,
} from '../types/uniformCredential/uniformCredential'
import { AddUniformCredentialArgs, GetUniformCredentialsArgs } from '../types/uniformCredential/IAbstractUniformCredentialStore'
import { IVerifiablePresentation } from '@sphereon/ssi-types'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource
  let uniformCredentialStore: UniformCredentialStore

  beforeEach(async (): Promise<void> => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      migrations: DataStoreUniformCredentialMigrations,
      synchronize: false,
      entities: DataStoreUniformCredentialEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    uniformCredentialStore = new UniformCredentialStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('should store uniform credential', async (): Promise<void> => {
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

    const savedUniformCredential: UniformCredential = await uniformCredentialStore.addUniformCredential(uniformCredential)
    expect(savedUniformCredential).toBeDefined()
  })

  it('should get all uniform credentials', async (): Promise<void> => {
    const addCredentialArgs1: AddUniformCredentialArgs = {
      credentialType: CredentialTypeEnum.VC,
      documentFormat: CredentialDocumentFormat.JWT,
      raw: 'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }
    const addCredentialArgs2: AddUniformCredentialArgs = {
      credentialType: CredentialTypeEnum.VC,
      documentFormat: CredentialDocumentFormat.JWT,
      raw: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDkyMTQxNzgsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJHdWVzdENyZWRlbnRpYWwiXSwiY3JlZGVudGlhbFN1YmplY3QiOnsiZmlyc3ROYW1lIjoiUyIsImxhc3ROYW1lIjoiSyIsIkUtbWFpbCI6IiIsInR5cGUiOiJTcGhlcmVvbiBHdWVzdCIsImlkIjoiZGlkOmp3azpleUpoYkdjaU9pSkZVekkxTmtzaUxDSjFjMlVpT2lKemFXY2lMQ0pyZEhraU9pSkZReUlzSW1OeWRpSTZJbk5sWTNBeU5UWnJNU0lzSW5naU9pSldjWGhIZVhWUk5WUTBXVEpzZGpKSFkybE9TaTFEYURCVWFGVm1kVk5RWm0wdFJYVlNZbGRNWlVOM0lpd2llU0k2SW01T1FWQnBiR0V5VDBRNGRXOXBXbk5LVm1aUmFrbDJTMUZUZWxBelFqVlBXbVZSYkVoQ1VUbHliVFFpZlEifX0sIkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJHdWVzdENyZWRlbnRpYWwiXSwiZXhwaXJhdGlvbkRhdGUiOiIyMDI0LTAyLTI5VDEzOjQyOjU4LjgzNVoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiRS1tYWlsIjoiIiwidHlwZSI6IlNwaGVyZW9uIEd1ZXN0IiwiaWQiOiJkaWQ6andrOmV5SmhiR2NpT2lKRlV6STFOa3NpTENKMWMyVWlPaUp6YVdjaUxDSnJkSGtpT2lKRlF5SXNJbU55ZGlJNkluTmxZM0F5TlRack1TSXNJbmdpT2lKV2NYaEhlWFZSTlZRMFdUSnNkakpIWTJsT1NpMURhREJVYUZWbWRWTlFabTB0UlhWU1lsZE1aVU4zSWl3aWVTSTZJbTVPUVZCcGJHRXlUMFE0ZFc5cFduTktWbVpSYWtsMlMxRlRlbEF6UWpWUFdtVlJiRWhDVVRseWJUUWlmUSJ9LCJpc3N1ZXIiOiJkaWQ6andrOmV5SmhiR2NpT2lKRlV6STFOaUlzSW5WelpTSTZJbk5wWnlJc0ltdDBlU0k2SWtWRElpd2lZM0oySWpvaVVDMHlOVFlpTENKNElqb2lWRWN5U0RKNE1tUlhXRTR6ZFVOeFduQnhSakY1YzBGUVVWWkVTa1ZPWDBndFEwMTBZbWRxWWkxT1p5SXNJbmtpT2lJNVRUaE9lR1F3VUU0eU1rMDViRkJFZUdSd1JIQnZWRXg2TVRWM1pubGFTbk0yV21oTFNWVktNek00SW4wIiwiaXNzdWFuY2VEYXRlIjoiMjAyNC0wMi0yMlQxMzo0Mjo1OC44MzVaIiwic3ViIjoiZGlkOmp3azpleUpoYkdjaU9pSkZVekkxTmtzaUxDSjFjMlVpT2lKemFXY2lMQ0pyZEhraU9pSkZReUlzSW1OeWRpSTZJbk5sWTNBeU5UWnJNU0lzSW5naU9pSldjWGhIZVhWUk5WUTBXVEpzZGpKSFkybE9TaTFEYURCVWFGVm1kVk5RWm0wdFJYVlNZbGRNWlVOM0lpd2llU0k2SW01T1FWQnBiR0V5VDBRNGRXOXBXbk5LVm1aUmFrbDJTMUZUZWxBelFqVlBXbVZSYkVoQ1VUbHliVFFpZlEiLCJuYmYiOjE3MDg2MDkzNzgsImlzcyI6ImRpZDpqd2s6ZXlKaGJHY2lPaUpGVXpJMU5pSXNJblZ6WlNJNkluTnBaeUlzSW10MGVTSTZJa1ZESWl3aVkzSjJJam9pVUMweU5UWWlMQ0o0SWpvaVZFY3lTREo0TW1SWFdFNHpkVU54V25CeFJqRjVjMEZRVVZaRVNrVk9YMGd0UTAxMFltZHFZaTFPWnlJc0lua2lPaUk1VFRoT2VHUXdVRTR5TWswNWJGQkVlR1J3UkhCdlZFeDZNVFYzWm5sYVNuTTJXbWhMU1ZWS016TTRJbjAifQ.GgLRWHO674wu6QF_xUGbCi_2zDD8jNf_xoWNvH5K605xvBoz6qKx0ndmxLeGQWWUA-4VuAkznf3ROcp9wpgbEw',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const uniformCredential1: UniformCredential = await uniformCredentialStore.addUniformCredential(addCredentialArgs1)
    expect(uniformCredential1).toBeDefined()
    const uniformCredential2: UniformCredential = await uniformCredentialStore.addUniformCredential(addCredentialArgs2)
    expect(uniformCredential2).toBeDefined()

    const result: Array<UniformCredential> = await uniformCredentialStore.getUniformCredentials()
    expect(result.length).toEqual(2)
  })

  it('should get uniform credentials by filter', async (): Promise<void> => {
    const addCredentialArgs1: AddUniformCredentialArgs = {
      credentialType: CredentialTypeEnum.VC,
      documentFormat: CredentialDocumentFormat.JWT,
      raw: 'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const sampleVP: IVerifiablePresentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
          id: 'https://example.com/credentials/1872',
          type: ['VerifiableCredential', 'IDCardCredential'],
          issuer: {
            id: 'did:example:issuer',
          },
          issuanceDate: '2010-01-01T19:23:24Z',
          credentialSubject: {
            given_name: 'Fredrik',
            family_name: 'Strömberg',
            birthdate: '1949-01-22',
          },
          proof: {
            type: 'Ed25519Signature2018',
            created: '2021-03-19T15:30:15Z',
            jws: 'eyJhb...IAoDA',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:issuer#keys-1',
          },
        },
      ],
      id: 'ebc6f1c2',
      holder: 'did:example:holder',
      proof: {
        type: 'Ed25519Signature2018',
        created: '2021-03-19T15:30:15Z',
        challenge: 'n-0S6_WzA2Mj',
        domain: 'https://client.example.org/cb',
        jws: 'eyJhb...JQdBw',
        proofPurpose: 'authentication',
        verificationMethod: 'did:example:holder#key-1',
      },
    }
    const addCredentialArgs2: AddUniformCredentialArgs = {
      credentialType: CredentialTypeEnum.VP,
      raw: JSON.stringify(sampleVP),
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
      documentFormat: CredentialDocumentFormat.JSON_LD,
      issuerCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:example:holder',
      subjectCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationId: 'did:example:holder',
    }
    const savedUniformCredential1: UniformCredential = await uniformCredentialStore.addUniformCredential(addCredentialArgs1)
    expect(savedUniformCredential1).toBeDefined()
    const savedUniformCredential2: UniformCredential = await uniformCredentialStore.addUniformCredential(addCredentialArgs2)
    expect(savedUniformCredential2).toBeDefined()
    const args: GetUniformCredentialsArgs = {
      filter: [{ credentialType: CredentialTypeEnum.VC }],
    }
    const result: Array<UniformCredentialEntity> = await uniformCredentialStore.getUniformCredentials(args)

    expect(result.length).toEqual(1)
  })

  it('should return no uniform credentials if filter does not match', async (): Promise<void> => {
    const args: GetUniformCredentialsArgs = {
      filter: [{ issuerCorrelationId: 'unknown_id' }],
    }
    const result: Array<UniformCredentialEntity> = await uniformCredentialStore.getUniformCredentials(args)

    expect(result.length).toEqual(0)
  })

  it('should delete stored uniform credential', async (): Promise<void> => {
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

    const savedUniformCredential: UniformCredential = await uniformCredentialStore.addUniformCredential(uniformCredential)
    let result = await uniformCredentialStore.removeUniformCredential({ id: savedUniformCredential.id })
    expect(result).toEqual(true)
  })

  it('should not delete stored uniform credential if id not found', async (): Promise<void> => {
    const result = await uniformCredentialStore.removeUniformCredential({ id: 'unknown_id' })
    expect(result).toEqual(false)
  })

  it('should update stored uniform credential', async (): Promise<void> => {
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

    const savedUniformCredential: UniformCredential = await uniformCredentialStore.addUniformCredential(uniformCredential)

    const result = await uniformCredentialStore.updateUniformCredentialState({
      id: savedUniformCredential.id,
      verifiedState: CredentialStateType.REVOKED,
    })
    expect(result.lastVerifiedState).toEqual(CredentialStateType.REVOKED)
  })
})
