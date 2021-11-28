import { VeramoLdSignature } from '@veramo/credential-ld'
import { TKeyType } from '@veramo/core'

/**
 * Initializes a list of Veramo-wrapped LD Signature suites and exposes those to the Agent Module
 */
export class LdSuiteLoader {
  constructor(options: { veramoLdSignatures: VeramoLdSignature[] }) {
    options.veramoLdSignatures.forEach((obj) => {
      this.signatureMap[obj.getSupportedVeramoKeyType()] = obj
    })
  }
  private signatureMap: Record<string, VeramoLdSignature> = {}

  getSignatureSuiteForKeyType(type: TKeyType): VeramoLdSignature {
    const suite = this.signatureMap[type]
    if (suite) return suite

    throw new Error('No Veramo LD Signature Suite for ' + type)
  }

  getAllSignatureSuites(): VeramoLdSignature[] {
    return Object.values(this.signatureMap)
  }

  getAllSignatureSuiteTypes(): string[] {
    return Object.values(this.signatureMap).map((x) => x.getSupportedVerificationType())
  }
}
