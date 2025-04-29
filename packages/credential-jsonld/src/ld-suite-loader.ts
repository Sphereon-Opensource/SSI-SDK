import type { TKeyType } from '@veramo/core'
import Debug from 'debug'

import { SphereonLdSignature } from './ld-suites'

/**
 * Initializes a list of Veramo-wrapped LD Signature suites and exposes those to the Agent Module
 */
const debug = Debug('sphereon:ssi-sdk-credential-jsonld')
export class LdSuiteLoader {
  constructor(options: { ldSignatureSuites: SphereonLdSignature[] }) {
    options.ldSignatureSuites.forEach((obj) => {
      const veramoKeyType = obj.getSupportedVeramoKeyType()
      const verificationType = obj.getSupportedVerificationType()
      if (this.signatureMap[veramoKeyType]) {
        debug(
          `Registered another signature suite ${obj} for key type: ${veramoKeyType} overriding the old one. Previous one: ${this.signatureMap[veramoKeyType]}`,
        )
        // throw Error(`Cannot register 2 suites for the same type ${veramoKeyType}`)
      }
      this.signatureMap[veramoKeyType] = obj
      if (verificationType !== veramoKeyType) {
        if (this.signatureMap[verificationType]) {
          throw Error(`Cannot register 2 suites for the same type ${verificationType}`)
        }
        this.signatureMap[verificationType] = obj
      }
    })
  }
  private signatureMap: Record<string, SphereonLdSignature> = {}

  getSignatureSuiteForKeyType(keyType: TKeyType, verificationType?: string): SphereonLdSignature {
    // Always use verification type if supplied. This is the type denoted by the DID verification method type

    let verificationSuite = verificationType
    if (verificationSuite === 'Secp256k1VerificationKey2018' || verificationSuite === 'Secp256r1VerificationKey2018') {
      verificationSuite = 'JsonWebKey2020'
    }

    const suite = verificationSuite && this.signatureMap[verificationSuite] ? this.signatureMap[verificationSuite] : this.signatureMap[keyType]
    if (suite) return suite

    throw new Error(`No Sphereon or Veramo LD Signature Suite for ${keyType} and verification type ${verificationType ?? '<none>'}`)
  }

  getAllSignatureSuites(): SphereonLdSignature[] {
    return [...new Set(Object.values(this.signatureMap))]
  }

  getAllSignatureSuiteTypes(): string[] {
    return [...new Set(Object.values(this.signatureMap).map((x) => x.getSupportedVerificationType()))]
  }
}
