import { BbsBlsSignature2020 } from '@mattrglobal/jsonld-signatures-bbs'
import { SignatureSuiteOptions } from '@mattrglobal/jsonld-signatures-bbs/lib/types'

export class SphereonBbsBlsSignatureSuite2020 extends BbsBlsSignature2020 {
  /**
   * Default constructor
   * @param options {SignatureSuiteOptions} options for constructing the signature suite
   */
  constructor(options?: SignatureSuiteOptions) {
    super(options)
  }


  /**
   * Ensures the document to be signed contains the required signature suite
   * specific `@context`, by either adding it (if `addSuiteContext` is true),
   * or throwing an error if it's missing.
   *
   * @param {object} options - Options hashmap.
   * @param {object} options.document - JSON-LD document to be signed.
   * @param {boolean} options.addSuiteContext - Add suite context?
   */
  ensureSuiteContext({ document, addSuiteContext }: { document: any, addSuiteContext: any }) {
    // @ts-ignore
    const contextUrl = "https://w3id.org/security/bbs/v1"

    if (_includesContext({ document, contextUrl })) {
      // document already includes the required context
      return
    }

    if (!addSuiteContext) {
      throw new TypeError(
        `The document to be signed must contain this suite's @context, ` +
        `"${contextUrl}".`)
    }

    // enforce the suite's context by adding it to the document
    const existingContext = document['@context'] || []

    document['@context'] = Array.isArray(existingContext) ?
      [...existingContext, contextUrl] : [existingContext, contextUrl]
  }


}


/**
 * Tests whether a provided JSON-LD document includes a context URL in its
 * `@context` property.
 *
 * @param {object} options - Options hashmap.
 * @param {object} options.document - A JSON-LD document.
 * @param {string} options.contextUrl - A context URL.
 *
 * @returns {boolean} Returns true if document includes context.
 */
function _includesContext({ document, contextUrl }: { document: any; contextUrl: any }) {
  const context = document['@context']
  return context === contextUrl ||
    (Array.isArray(context) && context.includes(contextUrl))
}
