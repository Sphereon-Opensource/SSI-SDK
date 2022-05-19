import { createAgent, IDIDManager, IIdentifier, IKeyManager, IResolver, PresentationPayload, TAgent } from '@veramo/core'
import { CredentialHandlerLDLocal } from '../../agent/CredentialHandlerLDLocal'
import { LdDefaultContexts } from '../../ld-default-contexts'
import { ICredentialHandlerLDLocal, MethodNames } from '../../types/ICredentialHandlerLDLocal'
import { SphereonBbsBlsSignature2020 } from '../../suites'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { BlsKeyManager } from '@sphereon/ssi-sdk-bls-key-manager'
import { BlsKeyManagementSystem } from '@sphereon/ssi-sdk-bls-kms-local'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk-core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { BlsKeyDidProvider, getDidKeyResolver } from '@sphereon/ssi-sdk-bls-did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { AssertionProofPurpose } from '../../types/types'

export default (testContext: { setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Issuer Agent Plugin', () => {
    let agent: TAgent<IResolver & IKeyManager & IDIDManager & ICredentialHandlerLDLocal>
    let didKeyIdentifier: IIdentifier
    let verifiableCredential: VerifiableCredentialSP
    let verifiablePresentation: VerifiablePresentationSP

    beforeAll(async () => {
      const keyStore = new MemoryPrivateKeyStore()
      agent = createAgent({
        plugins: [
          new BlsKeyManager({
            store: new MemoryKeyStore(),
            kms: {
              local: new BlsKeyManagementSystem(keyStore),
            },
          }),
          new DIDManager({
            providers: {
              'did:key': new BlsKeyDidProvider({ defaultKms: 'local' }),
            },
            store: new MemoryDIDStore(),
            defaultProvider: 'did:key',
          }),
          new DIDResolverPlugin({
            resolver: new Resolver({
              ...getDidKeyResolver(),
            }),
          }),
          new CredentialHandlerLDLocal({
            keyStore,
            contextMaps: [LdDefaultContexts /*, customContext*/],
            suites: [new SphereonBbsBlsSignature2020()],
            bindingOverrides: new Map([
              // Bindings to test overrides of credential-ld plugin methods
              ['createVerifiableCredentialLD', MethodNames.createVerifiableCredentialLDLocal],
              ['createVerifiablePresentationLD', MethodNames.createVerifiablePresentationLDLocal],
              // We test the verify methods by using the LDLocal versions directly in the tests
            ]),
          }),
        ],
      })
      didKeyIdentifier = await agent.didManagerCreate({
        kms: 'local',
        options: { type: 'Bls12381G2' },
        provider: 'did:key',
      })
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should issue a BBS+ signed 2018 VC', async () => {
      const credential = {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/citizenship/v1', 'https://w3id.org/security/bbs/v1'],
        id: 'https://issuer.oidp.uscis.gov/credentials/83627465',
        type: ['VerifiableCredential', 'PermanentResidentCard'],
        issuer: didKeyIdentifier.did,
        identifier: '83627465',
        name: 'Permanent Resident Card',
        description: 'Government of Example Permanent Resident Card.',
        issuanceDate: '2019-12-03T12:19:52Z',
        expirationDate: '2029-12-03T12:19:52Z',
        credentialSubject: {
          type: ['PermanentResident', 'Person'],
          givenName: 'JOHN',
          familyName: 'SMITH',
          gender: 'Male',
          image: 'data:image/png;base64,iVBORw0KGgokJggg==',
          residentSince: '2015-01-01',
          lprCategory: 'C09',
          lprNumber: '999-999-999',
          commuterClassification: 'C1',
          birthCountry: 'Bahamas',
          birthDate: '1958-07-17',
        },
      }

      verifiableCredential = await agent.createVerifiableCredentialLD({
        credential,
        keyRef: didKeyIdentifier.keys[0].kid,
        purpose: new AssertionProofPurpose(),
      })
      expect(verifiableCredential).toEqual(
        expect.objectContaining({
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/citizenship/v1', 'https://w3id.org/security/bbs/v1'],
          credentialSubject: {
            birthCountry: 'Bahamas',
            birthDate: '1958-07-17',
            commuterClassification: 'C1',
            familyName: 'SMITH',
            gender: 'Male',
            givenName: 'JOHN',
            image: 'data:image/png;base64,iVBORw0KGgokJggg==',
            lprCategory: 'C09',
            lprNumber: '999-999-999',
            residentSince: '2015-01-01',
            type: ['PermanentResident', 'Person'],
          },
          description: 'Government of Example Permanent Resident Card.',
          expirationDate: '2029-12-03T12:19:52Z',
          id: 'https://issuer.oidp.uscis.gov/credentials/83627465',
          identifier: '83627465',
          issuanceDate: '2019-12-03T12:19:52Z',
          issuer: didKeyIdentifier.did,
          name: 'Permanent Resident Card',
          proof: {
            created: expect.any(String),
            proofPurpose: 'assertionMethod',
            proofValue: expect.any(String),
            type: 'BbsBlsSignature2020',
            verificationMethod: expect.any(String),
          },
          type: ['VerifiableCredential', 'PermanentResidentCard'],
        })
      )
    })

    it('Should verify a BBS+ verifiable credential', async () => {
      await expect(agent.verifyCredentialLDLocal({ credential: verifiableCredential })).resolves.toEqual(true)
    })

    it('Should create a BBS+ verifiable presentation', async () => {
      const presentationPayload: PresentationPayload = {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/security/bbs/v1'],
        holder: didKeyIdentifier.did,
        verifiableCredential: [verifiableCredential],
      }

      verifiablePresentation = await agent.createVerifiablePresentationLDLocal({
        presentation: presentationPayload,
        keyRef: didKeyIdentifier.keys[0].kid,
        purpose: new AssertionProofPurpose(),
      })

      expect(verifiablePresentation).toEqual(
        expect.objectContaining({
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/security/bbs/v1'],
          holder: expect.any(String),
          proof: {
            created: expect.any(String),
            proofPurpose: 'assertionMethod',
            proofValue: expect.any(String),
            type: 'BbsBlsSignature2020',
            verificationMethod: expect.any(String),
          },
          type: ['VerifiablePresentation'],
          verifiableCredential: [
            {
              '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/citizenship/v1', 'https://w3id.org/security/bbs/v1'],
              credentialSubject: {
                birthCountry: 'Bahamas',
                birthDate: '1958-07-17',
                commuterClassification: 'C1',
                familyName: 'SMITH',
                gender: 'Male',
                givenName: 'JOHN',
                image: 'data:image/png;base64,iVBORw0KGgokJggg==',
                lprCategory: 'C09',
                lprNumber: '999-999-999',
                residentSince: '2015-01-01',
                type: ['PermanentResident', 'Person'],
              },
              description: 'Government of Example Permanent Resident Card.',
              expirationDate: '2029-12-03T12:19:52Z',
              id: 'https://issuer.oidp.uscis.gov/credentials/83627465',
              identifier: '83627465',
              issuanceDate: '2019-12-03T12:19:52Z',
              issuer: expect.any(String),
              name: 'Permanent Resident Card',
              proof: {
                created: expect.any(String),
                proofPurpose: 'assertionMethod',
                proofValue: expect.any(String),
                type: 'BbsBlsSignature2020',
                verificationMethod: expect.any(String),
              },
              type: ['VerifiableCredential', 'PermanentResidentCard'],
            },
          ],
        })
      )
    })

    it('Should verify a BBS+ verifiable presentation', async () => {
      await expect(agent.verifyPresentationLDLocal({ presentation: verifiablePresentation })).resolves.toEqual(true)
    })
  })
}
