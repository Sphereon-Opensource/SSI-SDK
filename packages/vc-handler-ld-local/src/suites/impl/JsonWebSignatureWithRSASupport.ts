// @ts-ignore
import jsonld from 'jsonld'

import { subtle } from '@transmute/web-crypto-key-pair'
import { JsonWebKey } from './JsonWebKeyWithRSASupport'
import * as u8a from 'uint8arrays'
import { Verifier } from '@transmute/jose-ld'

import sec from '@transmute/security-context'

const sha256 = async (data: any) => {
  return Buffer.from(await subtle.digest('SHA-256', Buffer.from(data)))
}

export interface JsonWebSignatureOptions {
  key?: JsonWebKey
  date?: any
  verifier?: Verifier
}

export class JsonWebSignature {
  public useNativeCanonize: boolean = false
  public key?: JsonWebKey
  public proof: any
  public date: any
  public type: string = 'JsonWebSignature2020'
  public verificationMethod?: string
  public verifier?: Verifier

  constructor(options: JsonWebSignatureOptions = {}) {
    this.date = options.date
    if (options.key) {
      this.key = options.key
      this.verificationMethod = this.key.id
    }
    if (options.verifier) {
      this.verifier = options.verifier
    }
  }

  ensureSuiteContext({ document }: any) {
    const contextUrl = sec.constants.JSON_WEB_SIGNATURE_2020_V1_URL
    if (document['@context'] === contextUrl || (Array.isArray(document['@context']) && document['@context'].includes(contextUrl))) {
      // document already includes the required context
      return
    }
    throw new TypeError(`The document to be signed must contain this suite's @context, ` + `"${contextUrl}".`)
  }

  async canonize(input: any, { documentLoader, expansionMap, skipExpansion }: any) {
    return jsonld.canonize(input, {
      algorithm: 'URDNA2015',
      format: 'application/n-quads',
      documentLoader,
      expansionMap,
      skipExpansion,
      useNative: this.useNativeCanonize,
    })
  }

  async canonizeProof(proof: any, { documentLoader, expansionMap }: any) {
    // `jws`,`signatureValue`,`proofValue` must not be included in the proof
    // options
    proof = { ...proof }
    delete proof.jws
    return this.canonize(proof, {
      documentLoader,
      expansionMap,
      skipExpansion: false,
    })
  }

  async createVerifyData({ document, proof, documentLoader, expansionMap }: any) {
    // concatenate hash of c14n proof options and hash of c14n document
    const c14nProofOptions = await this.canonizeProof(proof, {
      documentLoader,
      expansionMap,
    })
    const c14nDocument = await this.canonize(document, {
      documentLoader,
      expansionMap,
    })
    return Buffer.concat([await sha256(c14nProofOptions), await sha256(c14nDocument)])
  }

  async matchProof({ proof }: any) {
    return proof.type === 'JsonWebSignature2020'
  }

  async sign({ verifyData, proof }: any) {
    try {
      const signer: any = await this.key?.signer()
      const detachedJws = await signer.sign({ data: verifyData })
      proof.jws = detachedJws
      return proof
    } catch (e) {
      console.warn('Failed to sign.')
      throw e
    }
  }

  async createProof({ document, purpose, documentLoader, expansionMap, compactProof }: any) {
    let proof

    const context = document['@context']

    if (this.proof) {
      // use proof JSON-LD document passed to API
      proof = await jsonld.compact(this.proof, context, {
        documentLoader,
        expansionMap,
        compactToRelative: false,
      })
    } else {
      // create proof JSON-LD document
      proof = {
        '@context': context,
      }
    }

    // console.log(document);

    // ensure proof type is set
    proof.type = this.type

    // set default `now` date if not given in `proof` or `options`
    let date = this.date
    if (proof.created === undefined && date === undefined) {
      date = new Date()
    }

    // ensure date is in string format
    if (date !== undefined && typeof date !== 'string') {
      date = new Date(date).toISOString()
      date = date.substr(0, date.length - 5) + 'Z'
    }

    // add API overrides
    if (date !== undefined) {
      proof.created = date
    }
    // `verificationMethod` is for newer suites, `creator` for legacy
    if (this.verificationMethod !== undefined) {
      proof.verificationMethod = this.verificationMethod
    }

    // allow purpose to update the proof; the `proof` is in the
    // SECURITY_CONTEXT_URL `@context` -- therefore the `purpose` must
    // ensure any added fields are also represented in that same `@context`
    proof = await purpose.update(proof, {
      document,
      suite: this,
      documentLoader,
      expansionMap,
    })

    // create data to sign
    const verifyData = await this.createVerifyData({
      document,
      proof,
      documentLoader,
      expansionMap,
      compactProof,
    })

    // sign data
    proof = await this.sign({
      verifyData,
      document,
      proof,
      documentLoader,
      expansionMap,
    })

    delete proof['@context']
    return proof
  }

  async getVerificationMethod({ proof, documentLoader, instance }: any) {
    let { verificationMethod } = proof

    if (!verificationMethod) {
      // backwards compatibility support for `creator`
      const { creator } = proof
      verificationMethod = creator
    }

    if (typeof verificationMethod === 'object') {
      verificationMethod = verificationMethod.id
    }

    if (!verificationMethod) {
      throw new Error('No "verificationMethod" or "creator" found in proof.')
    }

    // Note: `expansionMap` is intentionally not passed; we can safely drop
    // properties here and must allow for it

    const { document } = await documentLoader(verificationMethod)
    const framed = await jsonld.frame(
      verificationMethod,
      {
        '@context': document['@context'],
        '@embed': '@always',
        id: verificationMethod,
      },
      {
        // use the cache of the document we just resolved when framing
        documentLoader: (iri: string) => {
          if (iri.startsWith(document.id)) {
            return {
              documentUrl: iri,
              document,
            }
          }
          return documentLoader(iri)
        },
      }
    )

    if (!instance) {
      if (!framed || !framed.controller) {
        throw new Error(`Verification method ${verificationMethod} not found.`)
      }

      return framed
    }

    return JsonWebKey.from(document, { signer: false, verifier: this.verifier })
  }

  async verifySignature({ verifyData, verificationMethod, proof }: any) {
    if (verificationMethod.publicKey) {
      const key = verificationMethod.publicKey as CryptoKey
      const signature = proof.jws.split('.')[2]
      const headerString = proof.jws.split('.')[0]
      const messageBuffer = u8a.concat([u8a.fromString(`${headerString}.`, 'utf-8'), verifyData])
      return await subtle.verify(
        {
          name: key.algorithm?.name ? key.algorithm.name : 'RSASSA-PKCS1-V1_5',
          hash: 'SHA-256', // todo get from proof.jws header
        },
        key,
        u8a.fromString(signature, 'base64url'),
        messageBuffer
      )
    }
    const verifier = await verificationMethod.verifier()
    return verifier.verify({ data: verifyData, signature: proof.jws })
  }

  async verifyProof({ proof, document, purpose, documentLoader, expansionMap, compactProof }: any) {
    try {
      // create data to verify
      const verifyData = await this.createVerifyData({
        document,
        proof,
        documentLoader,
        expansionMap,
        compactProof,
      })

      // fetch verification method
      const verificationMethod = await this.getVerificationMethod({
        proof,
        document,
        documentLoader,
        expansionMap,
        instance: true, // this means we get a key pair class instance, not just json.
      })

      // verify signature on data
      const verified = await this.verifySignature({
        verifyData,
        verificationMethod, // key pair class instance here.
        document,
        proof,
        documentLoader,
        expansionMap,
      })
      if (!verified) {
        throw new Error('Invalid signature.')
      }

      // ensure proof was performed for a valid purpose
      const purposeResult = await purpose.validate(proof, {
        document,
        suite: this,
        verificationMethod,
        documentLoader,
        expansionMap,
      })

      if (!purposeResult.valid) {
        throw purposeResult.error
      }

      return { verified: true, purposeResult }
    } catch (error) {
      return { verified: false, error }
    }
  }
}
