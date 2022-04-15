import { extendContextLoader } from '@digitalcredentials/jsonld-signatures'
import vc from '@digitalcredentials/vc'
import { DIDDocument, IAgentContext, IResolver } from '@veramo/core'

// import { DidKeyDriver } from '@digitalcredentials/did-method-key'
import Debug from 'debug'

import { LdContextLoader } from './ld-context-loader'
import { LdSuiteLoader } from './ld-suite-loader'

const debug = Debug('veramo:w3c:ld-credential-module-local')

/**
 * Initializes a list of Veramo-wrapped LD Signature suites and exposes those to the Agent Module
 */
export class LdDocumentLoader {
  private ldContextLoader: LdContextLoader
  ldSuiteLoader: LdSuiteLoader

  constructor(options: { ldContextLoader: LdContextLoader; ldSuiteLoader: LdSuiteLoader }) {
    this.ldContextLoader = options.ldContextLoader
    this.ldSuiteLoader = options.ldSuiteLoader
  }

  getLoader(context: IAgentContext<IResolver>, attemptToFetchContexts = false) {
    return extendContextLoader(async (url: string) => {
      // console.log(`resolving context for: ${url}`)

      // did resolution
      if (url.toLowerCase().startsWith('did:')) {
        let didDoc: DIDDocument | null
        /* if (url.toLowerCase().startsWith('did:key:')) {
          // const suite = this.ldSuiteLoader.getAllSignatureSuites()[0].getSuiteForVerification();
          didDoc = await new DidKeyDriver().get({url});
        } else {*/
        const resolutionResult = await context.agent.resolveDid({ didUrl: url })
        didDoc = resolutionResult.didDocument
        // }
        if (!didDoc) {
          throw new Error(`Could not fetch DID document with url: ${url}. Did you enable the the driver?`)
        }

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

        if (url.indexOf('#') > 0 && didDoc['@context']) {
          // Apparently we got a whole DID document, but we are looking for a verification method
          const component = await context.agent.getDIDComponentById({ didDocument: didDoc, didUrl: url })
          if (component && component.id) {
            // We have to provide a context
            const contexts = this.ldSuiteLoader
              .getAllSignatureSuites()
              .filter((x) => x.getSupportedVerificationType() === component.type /* || component.type === 'Ed25519VerificationKey2018'*/)
              .filter((value, index, self) => self.indexOf(value) === index)
              .map((value) => value.getContext())
            const fragment = { ...component, '@context': contexts }

            return {
              contextUrl: null,
              documentUrl: url,
              document: fragment,
            }
          }
        }

        // currently Veramo LD suites can modify the resolution response for DIDs from
        // the document Loader. This allows to fix incompatibilities between DID Documents
        // and LD suites to be fixed specifically within the Veramo LD Suites definition
        this.ldSuiteLoader.getAllSignatureSuites().forEach((x) => x.preDidResolutionModification(url, didDoc as DIDDocument))

        // console.log(`Returning from Documentloader: ${JSON.stringify(returnDocument)}`)
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
            const response = await fetch(url)
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
