import { TKeyType } from '@veramo/core'

import { SphereonBbsSignature } from './bbs-suites'

/**
 * Initializes a list of Veramo-wrapped BBS Signature suites and exposes those to the Agent Module
 */
export class BbsSuiteLoader {
  constructor(options: { bbsSignatureSuites: SphereonBbsSignature[] }) {
    options.bbsSignatureSuites.forEach((obj) => {
      this.signatureMap[obj.getSupportedVeramoKeyType()] = obj
      this.signatureMap[obj.getSupportedVerificationType()] = obj
    })
  }
  private signatureMap: Record<string, SphereonBbsSignature> = {}

  getSignatureSuiteForKeyType(type: TKeyType, verificationType?: string): SphereonBbsSignature {
    // Always use verification type if supplied. This is the type denoted by the DID verification method type

    const suite = verificationType && this.signatureMap[verificationType] ? this.signatureMap[verificationType] : this.signatureMap[type]
    if (suite) return suite

    throw new Error('No Sphereon or Veramo BBS Signature Suite for ' + type)
  }

  getAllSignatureSuites(): SphereonBbsSignature[] {
    return Object.values(this.signatureMap)
  }

  getAllSignatureSuiteTypes(): string[] {
    return Object.values(this.signatureMap).map((x) => x.getSupportedVerificationType())
  }
}
