import sigpkg from '@digitalcredentials/jsonld-signatures'
import * as vc from '@digitalcredentials/vc'
import type { CredentialPayload, DIDDocument, IAgentContext, PresentationPayload, VerifiableCredential, VerifiablePresentation } from '@veramo/core'
import { fetch } from 'cross-fetch'
import Debug from 'debug'

import { LdContextLoader } from './ld-context-loader'
import { LdSuiteLoader } from './ld-suite-loader'
import { getAgentResolver } from '@sphereon/ssi-sdk-ext.did-utils'
import { IVcdmVerifierAgentContext } from '@sphereon/ssi-sdk.credential-vcdm'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'

const debug = Debug('sphereon:ssi-sdk:credential-jsonld')

/**
 * Initializes a list of Veramo-wrapped LD Signature suites and exposes those to the Agent Module
 */
export class LdDocumentLoader {
  private readonly ldContextLoader: LdContextLoader
  ldSuiteLoader: LdSuiteLoader
  private readonly localResolution?: boolean
  private readonly uniresolverResolution?: boolean
  private readonly resolverResolution?: boolean

  constructor(options: {
    ldContextLoader: LdContextLoader
    ldSuiteLoader: LdSuiteLoader
    documentLoader?: {
      localResolution?: boolean // Resolve identifiers hosted by the agent
      uniresolverResolution?: boolean // Resolve identifiers using universal resolver
      resolverResolution?: boolean // Use registered drivers
    }
  }) {
    this.ldContextLoader = options.ldContextLoader
    this.ldSuiteLoader = options.ldSuiteLoader
    this.localResolution = options?.documentLoader?.localResolution
    this.uniresolverResolution = options?.documentLoader?.uniresolverResolution
    this.resolverResolution = options?.documentLoader?.resolverResolution
  }

  getLoader(
    context: IVcdmVerifierAgentContext,
    {
      attemptToFetchContexts = false,
      verifiableData,
    }: {
      attemptToFetchContexts: boolean
      verifiableData:
        | VerifiableCredential
        | VerifiableCredentialSP
        | VerifiablePresentation
        | VerifiablePresentationSP
        | CredentialPayload
        | PresentationPayload
    },
  ) {
    return sigpkg.extendContextLoader(async (url: string) => {
      if (!url || url.trim().length === 0) {
        throw Error('URL needs to be provided to load a context!')
      }

      if (url.startsWith('#') && verifiableData.issuer !== undefined) {
        url = (typeof verifiableData.issuer === 'string' ? verifiableData.issuer : verifiableData.issuer.id) + url
        debug(url)
      }
      // did resolution
      if (url.toLowerCase().startsWith('did:')) {
        // const parsedDID = parseDid(url)
        const resolutionResult = await getAgentResolver(context as IAgentContext<any>, {
          localResolution: this.localResolution,
          resolverResolution: this.resolverResolution,
          uniresolverResolution: this.uniresolverResolution,
        }).resolve(url)
        // context.agent.resolveDid({didUrl: url})
        let didDoc: DIDDocument | null = resolutionResult.didDocument
        if (!didDoc) {
          throw new Error(`Could not fetch DID document with url: ${url}. Did you enable the the driver?`)
        }
        // currently Veramo LD suites can modify the resolution response for DIDs from
        // the document Loader. This allows to fix incompatibilities between DID Documents
        // and LD suites to be fixed specifically within the Veramo LD Suites definition
        this.ldSuiteLoader.getAllSignatureSuites().forEach((x) => x.preDidResolutionModification(url, didDoc as DIDDocument))

        // Move legacy publicKey to verificationMethod, so any dependency that does not support it, keeps functioning
        if (didDoc.publicKey) {
          if (!didDoc.verificationMethod) {
            didDoc.verificationMethod = []
          }
          didDoc.verificationMethod = [...didDoc.verificationMethod, ...didDoc.publicKey]
          if (didDoc.verificationMethod.length === 0) {
            throw new Error(`No verification method available for ${url}`)
          }
          delete didDoc.publicKey
        }

        const origUrl = url
        if (url.indexOf('#') > 0 && didDoc && typeof didDoc === 'object' && '@context' in didDoc /*&& url.startsWith('did:oyd:')*/) {
          // Apparently we got a whole DID document, but we are looking for a verification method
          // We use origUrl here, as that is how it was used in the VM
          const component = await context.agent.getDIDComponentById({ didDocument: didDoc, didUrl: origUrl })
          debug('OYD DID component:')
          debug(JSON.stringify(component))
          if (component && typeof component !== 'string' && component.id) {
            // We have to provide a context
            const contexts = this.ldSuiteLoader
              .getAllSignatureSuites()
              .filter((x) => x.getSupportedVerificationType() === component.type)
              .filter((value, index, self) => self.indexOf(value) === index)
              .map((value) => value.getContext())
            const fragment = {
              ...component,
              ...(Array.isArray(contexts) && contexts.length > 0 ? { '@context': contexts } : { '@context': didDoc['@context'] }),
            }

            return {
              contextUrl: null,
              documentUrl: url,
              document: fragment,
            }
          }
        }

        return {
          contextUrl: null,
          documentUrl: url,
          document: didDoc,
        }
      }

      if (this.ldContextLoader.has(url)) {
        const contextDoc = await this.ldContextLoader.get(url)
        return {
          contextUrl: null,
          documentUrl: url,
          document: contextDoc,
        }
      } else {
        if (attemptToFetchContexts) {
          debug('WARNING: attempting to fetch the doc directly for ', url)
          try {
            const response = await fetch(url, { redirect: 'follow' })
            if (response.status === 200) {
              const document = await response.json()
              // fixme: The VC API returns an _id object for RL Credentials, which is not allowed, so delete it here for now
              if (url.startsWith('https://vc-api.sphereon.io/services/credentials/')) {
                delete document._id
              }
              return {
                contextUrl: null,
                documentUrl: url,
                document,
              }
            }
          } catch (e) {
            debug('WARNING: unable to fetch the doc or interpret it as JSON', e)
          }
        }
      }

      debug(`WARNING: Possible unknown context/identifier for ${url} \n falling back to default documentLoader`)

      return vc.defaultDocumentLoader(url)
    })
  }
}
