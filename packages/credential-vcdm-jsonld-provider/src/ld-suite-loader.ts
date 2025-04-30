import type { TKeyType } from '@veramo/core'

import { SphereonLdSignature } from './ld-suites'
import { asArray } from '@sphereon/ssi-sdk.core'

/**
 * Initializes a list of Veramo-wrapped LD Signature suites and exposes those to the Agent Module
 */
// const debug = Debug('sphereon:ssi-sdk-credential-jsonld')
export class LdSuiteLoader {
  constructor(options: { ldSignatureSuites: SphereonLdSignature[] }) {
    options.ldSignatureSuites.forEach((suite) => {
      const keyType = suite.getSupportedKeyType()
      // this.signatureMap[keyType] = suite
      let verifierMapping = this.signatureMap[keyType] ?? {}
      asArray<string>(suite.getSupportedVerificationType()).forEach((verificationType: string) => {
        verifierMapping[verificationType] = [...(verifierMapping[verificationType] ?? []), suite]
      })
      return (this.signatureMap[keyType] = { ...this.signatureMap[keyType], ...verifierMapping })
      /*if (verificationType !== keyType) {
        if (this.signatureMap[verificationType]) {
          throw Error(`Cannot register 2 suites for the same type ${verificationType}`)
        }
        this.signatureMap[verificationType] = suite
      }*/
    })
  }

  private signatureMap: Record<string, Record<string, SphereonLdSignature[]>> = {}

  getSignatureSuiteForKeyType(keyType: TKeyType, verificationType?: string): SphereonLdSignature[] {
    // Always use verification type if supplied. This is the type denoted by the DID verification method type

    /* let verificationSuite = verificationType
    if (verificationSuite === 'Secp256k1VerificationKey2018' || verificationSuite === 'Secp256r1VerificationKey2018') {
      verificationSuite = 'JsonWebKey2020'
    }

    const suite = verificationSuite && this.signatureMap[verificationSuite] ? this.signatureMap[verificationSuite] : this.signatureMap[keyType]
    if (suite) return suite*/
    const verificationToSuites = this.signatureMap[keyType]
    const suites = verificationType && verificationType !== '' ? verificationToSuites?.[verificationType] : Object.values(verificationToSuites)?.[0]
    // const suite = this.signatureMap[keyType]?.[verificationType]
    if (Array.isArray(suites) && suites.length > 0) {
      return suites
    }
    throw new Error(
      `No Sphereon or Veramo LD Signature Suite for ${keyType} and verification type ${verificationType ?? '<none>'}. Available suites:\n ${Object.entries(
        this.signatureMap,
      )
        .map(
          ([kt, record]) =>
            `\nKeyType:${kt}\n    => ${Object.entries(record)
              .map(
                ([verificationType, suites]) =>
                  `\n    verification-type: ${verificationType}\n       => proof-types: ${suites.map((suite) => suite.getSupportedProofType()).join(', ')}`,
              )
              .join(', ')}`,
        )
        .join(', ')}`,
    )
  }

  getAllSignatureSuites(): SphereonLdSignature[] {
    return [
      ...new Set(
        Object.values(this.signatureMap)
          .map((x) => Object.values(x))
          .flat(2),
      ),
    ]
  }

  getAllSignatureSuiteTypes(): string[] {
    return [
      ...new Set(
        Object.values(this.signatureMap)
          .map((x) => Object.keys(x))
          .flat(),
      ),
    ]
  }
}
