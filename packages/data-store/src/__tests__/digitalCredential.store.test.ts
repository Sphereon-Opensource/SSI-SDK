import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { IVerifiablePresentation } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'
import { DataStoreDigitalCredentialMigrations } from '../migrations'
import { CredentialRole, DataStoreDigitalCredentialEntities } from '../index'
import { DigitalCredentialStore } from '../digitalCredential/DigitalCredentialStore'
import {
  AddCredentialArgs,
  CredentialCorrelationType,
  CredentialDocumentFormat,
  CredentialStateType,
  DocumentType,
  DigitalCredential,
  GetCredentialsArgs,
  GetCredentialsResponse,
} from '../types'
import { defaultHasher } from '@sphereon/ssi-sdk.core'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource
  let digitalCredentialStore: DigitalCredentialStore

  beforeEach(async (): Promise<void> => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      migrations: DataStoreDigitalCredentialMigrations,
      synchronize: false,
      entities: DataStoreDigitalCredentialEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    digitalCredentialStore = new DigitalCredentialStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('should store digital credential', async (): Promise<void> => {
    const rawCredential: string =
      'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw'
    const digitalCredential: AddCredentialArgs = {
      rawDocument: rawCredential,
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const savedDigitalCredential: DigitalCredential = await digitalCredentialStore.addCredential(digitalCredential)
    expect(savedDigitalCredential).toBeDefined()
  })

  it('should throw error on storing digital credential sd_jwt with not-provided hasher', async (): Promise<void> => {
    const digitalCredential: AddCredentialArgs = {
      rawDocument:
        'eyJhbGciOiJFZERTQSIsInR5cCI6InZjK3NkLWp3dCIsImtpZCI6IiN6Nk1rdHF0WE5HOENEVVk5UHJydG9TdEZ6ZUNuaHBNbWd4WUwxZ2lrY1czQnp2TlcifQ.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwiLCJmYW1pbHlfbmFtZSI6IkRvZSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsImxvY2FsaXR5IjoiQW55dG93biIsIl9zZCI6WyJOSm5tY3QwQnFCTUUxSmZCbEM2alJRVlJ1ZXZwRU9OaVl3N0E3TUh1SnlRIiwib201Wnp0WkhCLUdkMDBMRzIxQ1ZfeE00RmFFTlNvaWFPWG5UQUpOY3pCNCJdfSwiY25mIjp7Imp3ayI6eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6Im9FTlZzeE9VaUg1NFg4d0pMYVZraWNDUmswMHdCSVE0c1JnYms1NE44TW8ifX0sImlzcyI6ImRpZDprZXk6ejZNa3RxdFhORzhDRFVZOVBycnRvU3RGemVDbmhwTW1neFlMMWdpa2NXM0J6dk5XIiwiaWF0IjoxNjk4MTUxNTMyLCJfc2RfYWxnIjoic2hhLTI1NiIsIl9zZCI6WyIxQ3VyMmsyQTJvSUI1Q3NoU0lmX0FfS2ctbDI2dV9xS3VXUTc5UDBWZGFzIiwiUjF6VFV2T1lIZ2NlcGowakh5cEdIejlFSHR0VktmdDB5c3diYzlFVFBiVSIsImVEcVFwZFRYSlhiV2hmLUVzSTd6dzVYNk92WW1GTi1VWlFRTWVzWHdLUHciLCJwZERrMl9YQUtIbzdnT0Fmd0YxYjdPZENVVlRpdDJrSkhheFNFQ1E5eGZjIiwicHNhdUtVTldFaTA5bnUzQ2w4OXhLWGdtcFdFTlpsNXV5MU4xbnluX2pNayIsInNOX2dlMHBIWEY2cW1zWW5YMUE5U2R3SjhjaDhhRU5reGJPRHNUNzRZd0kiXX0.coOK8NzJmEWz4qx-qRhjo-RK7aejrSkQM9La9Cw3eWmzcja9DXrkBoQZKbIJtNoSzSPLjwK2V71W78z0miZsDQ~WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0~WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0~WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0~WyJzYWx0IiwiY291bnRyeSIsIlVTIl0~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ~eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA',
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    await expect(digitalCredentialStore.addCredential(digitalCredential)).rejects.toThrowError(
      'No hasher function is provided for SD_JWT credential.',
    )
  })

  it('should get all digital credentials', async (): Promise<void> => {
    const addCredentialArgs1: AddCredentialArgs = {
      rawDocument:
        'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw',
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }
    const addCredentialArgs2: AddCredentialArgs = {
      rawDocument:
        'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDkyMTQxNzgsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJHdWVzdENyZWRlbnRpYWwiXSwiY3JlZGVudGlhbFN1YmplY3QiOnsiZmlyc3ROYW1lIjoiUyIsImxhc3ROYW1lIjoiSyIsIkUtbWFpbCI6IiIsInR5cGUiOiJTcGhlcmVvbiBHdWVzdCIsImlkIjoiZGlkOmp3azpleUpoYkdjaU9pSkZVekkxTmtzaUxDSjFjMlVpT2lKemFXY2lMQ0pyZEhraU9pSkZReUlzSW1OeWRpSTZJbk5sWTNBeU5UWnJNU0lzSW5naU9pSldjWGhIZVhWUk5WUTBXVEpzZGpKSFkybE9TaTFEYURCVWFGVm1kVk5RWm0wdFJYVlNZbGRNWlVOM0lpd2llU0k2SW01T1FWQnBiR0V5VDBRNGRXOXBXbk5LVm1aUmFrbDJTMUZUZWxBelFqVlBXbVZSYkVoQ1VUbHliVFFpZlEifX0sIkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJHdWVzdENyZWRlbnRpYWwiXSwiZXhwaXJhdGlvbkRhdGUiOiIyMDI0LTAyLTI5VDEzOjQyOjU4LjgzNVoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiRS1tYWlsIjoiIiwidHlwZSI6IlNwaGVyZW9uIEd1ZXN0IiwiaWQiOiJkaWQ6andrOmV5SmhiR2NpT2lKRlV6STFOa3NpTENKMWMyVWlPaUp6YVdjaUxDSnJkSGtpT2lKRlF5SXNJbU55ZGlJNkluTmxZM0F5TlRack1TSXNJbmdpT2lKV2NYaEhlWFZSTlZRMFdUSnNkakpIWTJsT1NpMURhREJVYUZWbWRWTlFabTB0UlhWU1lsZE1aVU4zSWl3aWVTSTZJbTVPUVZCcGJHRXlUMFE0ZFc5cFduTktWbVpSYWtsMlMxRlRlbEF6UWpWUFdtVlJiRWhDVVRseWJUUWlmUSJ9LCJpc3N1ZXIiOiJkaWQ6andrOmV5SmhiR2NpT2lKRlV6STFOaUlzSW5WelpTSTZJbk5wWnlJc0ltdDBlU0k2SWtWRElpd2lZM0oySWpvaVVDMHlOVFlpTENKNElqb2lWRWN5U0RKNE1tUlhXRTR6ZFVOeFduQnhSakY1YzBGUVVWWkVTa1ZPWDBndFEwMTBZbWRxWWkxT1p5SXNJbmtpT2lJNVRUaE9lR1F3VUU0eU1rMDViRkJFZUdSd1JIQnZWRXg2TVRWM1pubGFTbk0yV21oTFNWVktNek00SW4wIiwiaXNzdWFuY2VEYXRlIjoiMjAyNC0wMi0yMlQxMzo0Mjo1OC44MzVaIiwic3ViIjoiZGlkOmp3azpleUpoYkdjaU9pSkZVekkxTmtzaUxDSjFjMlVpT2lKemFXY2lMQ0pyZEhraU9pSkZReUlzSW1OeWRpSTZJbk5sWTNBeU5UWnJNU0lzSW5naU9pSldjWGhIZVhWUk5WUTBXVEpzZGpKSFkybE9TaTFEYURCVWFGVm1kVk5RWm0wdFJYVlNZbGRNWlVOM0lpd2llU0k2SW01T1FWQnBiR0V5VDBRNGRXOXBXbk5LVm1aUmFrbDJTMUZUZWxBelFqVlBXbVZSYkVoQ1VUbHliVFFpZlEiLCJuYmYiOjE3MDg2MDkzNzgsImlzcyI6ImRpZDpqd2s6ZXlKaGJHY2lPaUpGVXpJMU5pSXNJblZ6WlNJNkluTnBaeUlzSW10MGVTSTZJa1ZESWl3aVkzSjJJam9pVUMweU5UWWlMQ0o0SWpvaVZFY3lTREo0TW1SWFdFNHpkVU54V25CeFJqRjVjMEZRVVZaRVNrVk9YMGd0UTAxMFltZHFZaTFPWnlJc0lua2lPaUk1VFRoT2VHUXdVRTR5TWswNWJGQkVlR1J3UkhCdlZFeDZNVFYzWm5sYVNuTTJXbWhMU1ZWS016TTRJbjAifQ.GgLRWHO674wu6QF_xUGbCi_2zDD8jNf_xoWNvH5K605xvBoz6qKx0ndmxLeGQWWUA-4VuAkznf3ROcp9wpgbEw',
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const digitalCredential1: DigitalCredential = await digitalCredentialStore.addCredential(addCredentialArgs1)
    expect(digitalCredential1).toBeDefined()
    const digitalCredential2: DigitalCredential = await digitalCredentialStore.addCredential(addCredentialArgs2)
    expect(digitalCredential2).toBeDefined()

    const result: GetCredentialsResponse = await digitalCredentialStore.getCredentials()
    expect(result.total).toEqual(2)
  })

  it('should get digital credentials by filters and pagination', async (): Promise<void> => {
    const addCredentialArgs1: AddCredentialArgs = {
      rawDocument:
        'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw',
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
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
    const addCredentialArgs2: AddCredentialArgs = {
      rawDocument: JSON.stringify(sampleVP),
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:example:holder',
      subjectCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationId: 'did:example:holder',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }
    const addCredentialArgs3: AddCredentialArgs = {
      rawDocument:
        'eyJhbGciOiJFZERTQSIsInR5cCI6InZjK3NkLWp3dCIsImtpZCI6IiN6Nk1rdHF0WE5HOENEVVk5UHJydG9TdEZ6ZUNuaHBNbWd4WUwxZ2lrY1czQnp2TlcifQ.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwiLCJmYW1pbHlfbmFtZSI6IkRvZSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsImxvY2FsaXR5IjoiQW55dG93biIsIl9zZCI6WyJOSm5tY3QwQnFCTUUxSmZCbEM2alJRVlJ1ZXZwRU9OaVl3N0E3TUh1SnlRIiwib201Wnp0WkhCLUdkMDBMRzIxQ1ZfeE00RmFFTlNvaWFPWG5UQUpOY3pCNCJdfSwiY25mIjp7Imp3ayI6eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6Im9FTlZzeE9VaUg1NFg4d0pMYVZraWNDUmswMHdCSVE0c1JnYms1NE44TW8ifX0sImlzcyI6ImRpZDprZXk6ejZNa3RxdFhORzhDRFVZOVBycnRvU3RGemVDbmhwTW1neFlMMWdpa2NXM0J6dk5XIiwiaWF0IjoxNjk4MTUxNTMyLCJfc2RfYWxnIjoic2hhLTI1NiIsIl9zZCI6WyIxQ3VyMmsyQTJvSUI1Q3NoU0lmX0FfS2ctbDI2dV9xS3VXUTc5UDBWZGFzIiwiUjF6VFV2T1lIZ2NlcGowakh5cEdIejlFSHR0VktmdDB5c3diYzlFVFBiVSIsImVEcVFwZFRYSlhiV2hmLUVzSTd6dzVYNk92WW1GTi1VWlFRTWVzWHdLUHciLCJwZERrMl9YQUtIbzdnT0Fmd0YxYjdPZENVVlRpdDJrSkhheFNFQ1E5eGZjIiwicHNhdUtVTldFaTA5bnUzQ2w4OXhLWGdtcFdFTlpsNXV5MU4xbnluX2pNayIsInNOX2dlMHBIWEY2cW1zWW5YMUE5U2R3SjhjaDhhRU5reGJPRHNUNzRZd0kiXX0.coOK8NzJmEWz4qx-qRhjo-RK7aejrSkQM9La9Cw3eWmzcja9DXrkBoQZKbIJtNoSzSPLjwK2V71W78z0miZsDQ~WyJzYWx0IiwiaXNfb3Zlcl82NSIsdHJ1ZV0~WyJzYWx0IiwiaXNfb3Zlcl8yMSIsdHJ1ZV0~WyJzYWx0IiwiZW1haWwiLCJqb2huZG9lQGV4YW1wbGUuY29tIl0~WyJzYWx0IiwiY291bnRyeSIsIlVTIl0~WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIkpvaG4iXQ~eyJhbGciOiJFZERTQSIsInR5cCI6ImtiK2p3dCJ9.eyJpYXQiOjE2OTgxNTE1MzIsIm5vbmNlIjoic2FsdCIsImF1ZCI6ImRpZDprZXk6elVDNzRWRXFxaEVIUWNndjR6YWdTUGtxRkp4dU5XdW9CUEtqSnVIRVRFVWVITG9TcVd0OTJ2aVNzbWFXank4MnkiLCJfc2RfaGFzaCI6Ii1kTUd4OGZhUnpOQm91a2EwU0R6V2JkS3JYckw1TFVmUlNQTHN2Q2xPMFkifQ.TQQLqc4ZzoKjQfAghAzC_4aaU3KCS8YqzxAJtzT124guzkv9XSHtPN8d3z181_v-ca2ATXjTRoRciozitE6wBA',
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
      opts: {
        hasher: defaultHasher,
      },
    }

    const savedDigitalCredential1: DigitalCredential = await digitalCredentialStore.addCredential(addCredentialArgs1)
    expect(savedDigitalCredential1).toBeDefined()
    const savedDigitalCredential2: DigitalCredential = await digitalCredentialStore.addCredential(addCredentialArgs2)
    expect(savedDigitalCredential2).toBeDefined()
    const savedDigitalCredential3: DigitalCredential = await digitalCredentialStore.addCredential(addCredentialArgs3)
    expect(savedDigitalCredential3).toBeDefined()
    const args1: GetCredentialsArgs = {
      filter: [{ documentType: DocumentType.VP }],
    }
    const result1: GetCredentialsResponse = await digitalCredentialStore.getCredentials(args1)
    expect(result1.total).toEqual(1)
    const args2: GetCredentialsArgs = {
      offset: 1,
      limit: 10,
    }
    const result2: GetCredentialsResponse = await digitalCredentialStore.getCredentials(args2)
    expect(result2.data.length).toEqual(2)
    expect(result2.total).toEqual(3)
    const args3: GetCredentialsArgs = {
      order: 'createdAt.DESC',
    }
    const result3: GetCredentialsResponse = await digitalCredentialStore.getCredentials(args3)
    expect(result3.data.length).toEqual(3)
    expect(result3.data[1].documentFormat).toEqual(CredentialDocumentFormat.JSON_LD)
    expect(result3.data[1].credentialId).toEqual('ebc6f1c2')
  })

  it('should return no digital credentials if filter does not match', async (): Promise<void> => {
    const args: GetCredentialsArgs = {
      filter: [{ issuerCorrelationId: 'unknown_id' }],
    }
    const result: GetCredentialsResponse = await digitalCredentialStore.getCredentials(args)

    expect(result.data.length).toEqual(0)
    expect(result.total).toEqual(0)
  })

  it('should delete stored digital credential', async (): Promise<void> => {
    const rawCredential: string =
      'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw'
    const digitalCredential: AddCredentialArgs = {
      rawDocument: rawCredential,
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const savedDigitalCredential: DigitalCredential = await digitalCredentialStore.addCredential(digitalCredential)
    let result = await digitalCredentialStore.removeCredential({ id: savedDigitalCredential.id })
    expect(result).toEqual(true)
  })

  it('should delete stored digital credential and children', async (): Promise<void> => {
    const digitalCredentialParent: AddCredentialArgs = {
      rawDocument:
        'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw',
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }
    const parentCredential: DigitalCredential = await digitalCredentialStore.addCredential(digitalCredentialParent)
    expect(parentCredential).toBeDefined()

    const digitalCredentialChild: AddCredentialArgs = {
      rawDocument:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksiLCJraWQiOiJkaWQ6dmVsb2NpdHk6djI6MHhjMTY3MTUxNmMyMTQ1ZDcwYjM0MGY1NjBhYjFjYjU4Y2M0ZDhhMDUyOjE2Mzc4MjY4NTEwMzM4MToxOTg2I2tleS0xIn0.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIk9wZW5CYWRnZUNyZWRlbnRpYWwiLCJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlkIjoiZGlkOnZlbG9jaXR5OnYyOjB4YzE2NzE1MTZjMjE0NWQ3MGIzNDBmNTYwYWIxY2I1OGNjNGQ4YTA1MjoxNjM3ODI2ODUxMDMzODE6MTk4NiIsImNyZWRlbnRpYWxTdGF0dXMiOnsidHlwZSI6IlZlbG9jaXR5UmV2b2NhdGlvbkxpc3RKYW4yMDIxIiwiaWQiOiJldGhlcmV1bToweDFDMjk0NjFDNzQ4MGQxZDg1NzBkZjdjMEE0RjMxNEQwYkU4Y0Q1QmYvZ2V0UmV2b2tlZFN0YXR1cz9hZGRyZXNzPTB4YzE2NzE1MTZDMjE0NUQ3MEIzNDBGNTYwQUIxQ0I1OENjNEQ4YTA1MiZsaXN0SWQ9NTI5NDcyODgxNzIzMTQmaW5kZXg9NTYyNCJ9LCJsaW5rQ29kZUNvbW1pdG1lbnQiOnsidHlwZSI6IlZlbG9jaXR5Q3JlZGVudGlhbExpbmtDb2RlQ29tbWl0bWVudDIwMjIiLCJ2YWx1ZSI6IkVpQ3dJQmRUcmE4MVkyMjEzSVNJSXo0UDh5ejNvNDlXMStYczRmczVIc1BvMXc9PSJ9LCJpc3N1ZXIiOnsiaWQiOiJkaWQ6aW9uOkVpQmFLaWRocEhma2ZzZWpaT1UxY09YVnlhdnE4WUtfaFJfTGgwX1dCNTVQX0EifSwiY29udGVudEhhc2giOnsidHlwZSI6IlZlbG9jaXR5Q29udGVudEhhc2gyMDIwIiwidmFsdWUiOiJkNWUzMGI5Y2FlNDljYjM5MjRjZjVhZjIwMDUwOTE4ZWZjZDQ4ZTk2MzAzZTZhMDQ4NmQzZmE0ODk4NjQ1NDFlIn0sImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3N0YWdpbmdyZWdpc3RyYXIudmVsb2NpdHluZXR3b3JrLmZvdW5kYXRpb24vc2NoZW1hcy9vcGVuLWJhZGdlLWNyZWRlbnRpYWwuc2NoZW1hLmpzb24iLCJ0eXBlIjoiSnNvblNjaGVtYVZhbGlkYXRvcjIwMTgifSwiY29uc2VudGVkQXQiOiIyMDIyLTExLTA3VDIxOjI0OjQ3LjcwM1oiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDpqd2s6ZXlKamNuWWlPaUp6WldOd01qVTJhekVpTENKcmRIa2lPaUpGUXlJc0luVnpaU0k2SW5OcFp5SXNJbmdpT2lKRFdVdEdjbmxOVWpOc2RubHpiemQ0UjBKeVN6QnJRMkZZYUdwSGFXdFdMV3MxT0dGSE1GSTBTWGh6SWl3aWVTSTZJakV0TkhoTFowcFBkRlZyYjNablJqVnFjVWMxTm1KeGFtbG5UMEpUTVdGT09FZEJOMUV5YURsUlJtc2lmUSJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTExLTA3VDIxOjI5OjI5LjIzNVoifSwibmJmIjoxNjY3ODU2NTY5LCJqdGkiOiJkaWQ6dmVsb2NpdHk6djI6MHhjMTY3MTUxNmMyMTQ1ZDcwYjM0MGY1NjBhYjFjYjU4Y2M0ZDhhMDUyOjE2Mzc4MjY4NTEwMzM4MToxOTg2IiwiaXNzIjoiZGlkOmlvbjpFaUJhS2lkaHBIZmtmc2VqWk9VMWNPWFZ5YXZxOFlLX2hSX0xoMF9XQjU1UF9BIiwic3ViIjoiZGlkOmp3azpleUpqY25ZaU9pSnpaV053TWpVMmF6RWlMQ0pyZEhraU9pSkZReUlzSW5WelpTSTZJbk5wWnlJc0luZ2lPaUpEV1V0R2NubE5Vak5zZG5semJ6ZDRSMEp5U3pCclEyRllhR3BIYVd0V0xXczFPR0ZITUZJMFNYaHpJaXdpZVNJNklqRXROSGhMWjBwUGRGVnJiM1puUmpWcWNVYzFObUp4YW1sblQwSlRNV0ZPT0VkQk4xRXlhRGxSUm1zaWZRIiwiaWF0IjoxNjY3ODU2NTY5fQ.-SiM5d7UrYn1gdj2hU5T5LnLQzhIklOtoexbyebLMeha0K89vkujsbFN4HNFP2TSfRYFt0-jXwDaZ8RNKESwFA',
      parentId: parentCredential.id,
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z1Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }
    const childCredential: DigitalCredential = await digitalCredentialStore.addCredential(digitalCredentialChild)
    expect(childCredential).toBeDefined()

    let deleteResult: boolean = await digitalCredentialStore.removeCredential({ id: parentCredential.id })
    expect(deleteResult).toEqual(true)

    await expect(digitalCredentialStore.getCredential({ id: childCredential.id })).rejects.toThrow(
      `No credential found for arg: ${JSON.stringify({ id: childCredential.id })}`,
    )
  })

  it('should not delete stored parent digital credential if a child gets deleted', async (): Promise<void> => {
    const digitalCredentialParent: AddCredentialArgs = {
      rawDocument:
        'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw',
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }
    const parentCredential: DigitalCredential = await digitalCredentialStore.addCredential(digitalCredentialParent)
    expect(parentCredential).toBeDefined()

    const digitalCredentialChild: AddCredentialArgs = {
      rawDocument:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksiLCJraWQiOiJkaWQ6dmVsb2NpdHk6djI6MHhjMTY3MTUxNmMyMTQ1ZDcwYjM0MGY1NjBhYjFjYjU4Y2M0ZDhhMDUyOjE2Mzc4MjY4NTEwMzM4MToxOTg2I2tleS0xIn0.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIk9wZW5CYWRnZUNyZWRlbnRpYWwiLCJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlkIjoiZGlkOnZlbG9jaXR5OnYyOjB4YzE2NzE1MTZjMjE0NWQ3MGIzNDBmNTYwYWIxY2I1OGNjNGQ4YTA1MjoxNjM3ODI2ODUxMDMzODE6MTk4NiIsImNyZWRlbnRpYWxTdGF0dXMiOnsidHlwZSI6IlZlbG9jaXR5UmV2b2NhdGlvbkxpc3RKYW4yMDIxIiwiaWQiOiJldGhlcmV1bToweDFDMjk0NjFDNzQ4MGQxZDg1NzBkZjdjMEE0RjMxNEQwYkU4Y0Q1QmYvZ2V0UmV2b2tlZFN0YXR1cz9hZGRyZXNzPTB4YzE2NzE1MTZDMjE0NUQ3MEIzNDBGNTYwQUIxQ0I1OENjNEQ4YTA1MiZsaXN0SWQ9NTI5NDcyODgxNzIzMTQmaW5kZXg9NTYyNCJ9LCJsaW5rQ29kZUNvbW1pdG1lbnQiOnsidHlwZSI6IlZlbG9jaXR5Q3JlZGVudGlhbExpbmtDb2RlQ29tbWl0bWVudDIwMjIiLCJ2YWx1ZSI6IkVpQ3dJQmRUcmE4MVkyMjEzSVNJSXo0UDh5ejNvNDlXMStYczRmczVIc1BvMXc9PSJ9LCJpc3N1ZXIiOnsiaWQiOiJkaWQ6aW9uOkVpQmFLaWRocEhma2ZzZWpaT1UxY09YVnlhdnE4WUtfaFJfTGgwX1dCNTVQX0EifSwiY29udGVudEhhc2giOnsidHlwZSI6IlZlbG9jaXR5Q29udGVudEhhc2gyMDIwIiwidmFsdWUiOiJkNWUzMGI5Y2FlNDljYjM5MjRjZjVhZjIwMDUwOTE4ZWZjZDQ4ZTk2MzAzZTZhMDQ4NmQzZmE0ODk4NjQ1NDFlIn0sImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3N0YWdpbmdyZWdpc3RyYXIudmVsb2NpdHluZXR3b3JrLmZvdW5kYXRpb24vc2NoZW1hcy9vcGVuLWJhZGdlLWNyZWRlbnRpYWwuc2NoZW1hLmpzb24iLCJ0eXBlIjoiSnNvblNjaGVtYVZhbGlkYXRvcjIwMTgifSwiY29uc2VudGVkQXQiOiIyMDIyLTExLTA3VDIxOjI0OjQ3LjcwM1oiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDpqd2s6ZXlKamNuWWlPaUp6WldOd01qVTJhekVpTENKcmRIa2lPaUpGUXlJc0luVnpaU0k2SW5OcFp5SXNJbmdpT2lKRFdVdEdjbmxOVWpOc2RubHpiemQ0UjBKeVN6QnJRMkZZYUdwSGFXdFdMV3MxT0dGSE1GSTBTWGh6SWl3aWVTSTZJakV0TkhoTFowcFBkRlZyYjNablJqVnFjVWMxTm1KeGFtbG5UMEpUTVdGT09FZEJOMUV5YURsUlJtc2lmUSJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTExLTA3VDIxOjI5OjI5LjIzNVoifSwibmJmIjoxNjY3ODU2NTY5LCJqdGkiOiJkaWQ6dmVsb2NpdHk6djI6MHhjMTY3MTUxNmMyMTQ1ZDcwYjM0MGY1NjBhYjFjYjU4Y2M0ZDhhMDUyOjE2Mzc4MjY4NTEwMzM4MToxOTg2IiwiaXNzIjoiZGlkOmlvbjpFaUJhS2lkaHBIZmtmc2VqWk9VMWNPWFZ5YXZxOFlLX2hSX0xoMF9XQjU1UF9BIiwic3ViIjoiZGlkOmp3azpleUpqY25ZaU9pSnpaV053TWpVMmF6RWlMQ0pyZEhraU9pSkZReUlzSW5WelpTSTZJbk5wWnlJc0luZ2lPaUpEV1V0R2NubE5Vak5zZG5semJ6ZDRSMEp5U3pCclEyRllhR3BIYVd0V0xXczFPR0ZITUZJMFNYaHpJaXdpZVNJNklqRXROSGhMWjBwUGRGVnJiM1puUmpWcWNVYzFObUp4YW1sblQwSlRNV0ZPT0VkQk4xRXlhRGxSUm1zaWZRIiwiaWF0IjoxNjY3ODU2NTY5fQ.-SiM5d7UrYn1gdj2hU5T5LnLQzhIklOtoexbyebLMeha0K89vkujsbFN4HNFP2TSfRYFt0-jXwDaZ8RNKESwFA',
      parentId: parentCredential.id,
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z1Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }
    const childCredential: DigitalCredential = await digitalCredentialStore.addCredential(digitalCredentialChild)
    expect(childCredential).toBeDefined()

    let deleteResult: boolean = await digitalCredentialStore.removeCredential({ id: childCredential.id })
    expect(deleteResult).toEqual(true)

    const fetchedCredential: DigitalCredential = await digitalCredentialStore.getCredential({ id: parentCredential.id })
    expect(fetchedCredential).toBeDefined()
  })

  it('should not delete stored digital credential if id not found', async (): Promise<void> => {
    const result = await digitalCredentialStore.removeCredential({ id: 'unknown_id' })
    expect(result).toEqual(false)
  })

  it('should update stored digital credential', async (): Promise<void> => {
    const rawCredential: string =
      'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw'
    const digitalCredential: AddCredentialArgs = {
      rawDocument: rawCredential,
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const savedDigitalCredential: DigitalCredential = await digitalCredentialStore.addCredential(digitalCredential)

    const result = await digitalCredentialStore.updateCredentialState({
      id: savedDigitalCredential.id,
      verifiedState: CredentialStateType.VERIFIED,
      verifiedAt: new Date(),
    })
    expect(result.verifiedState).toEqual(CredentialStateType.VERIFIED)
  })

  it('should throw exception on updating stored digital credential to revoked', async (): Promise<void> => {
    const rawCredential: string =
      'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw'
    const digitalCredential: AddCredentialArgs = {
      rawDocument: rawCredential,
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const savedDigitalCredential: DigitalCredential = await digitalCredentialStore.addCredential(digitalCredential)

    await expect(
      digitalCredentialStore.updateCredentialState({
        id: savedDigitalCredential.id,
        verifiedState: CredentialStateType.REVOKED,
      }),
    ).rejects.toThrowError('No revokedAt param is provided.')
  })

  it('should revoke stored digital credential', async (): Promise<void> => {
    const rawCredential: string =
      'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw'
    const digitalCredential: AddCredentialArgs = {
      rawDocument: rawCredential,
      kmsKeyRef: 'testRef',
      identifierMethod: 'did',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      credentialRole: CredentialRole.VERIFIER,
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const savedDigitalCredential: DigitalCredential = await digitalCredentialStore.addCredential(digitalCredential)
    const currentDate = new Date()
    const result = await digitalCredentialStore.updateCredentialState({
      id: savedDigitalCredential.id,
      verifiedState: CredentialStateType.REVOKED,
      revokedAt: currentDate,
    })
    expect(result.verifiedState).toEqual(CredentialStateType.REVOKED)
    expect(result.revokedAt).toEqual(currentDate)
  })
})
