import * as ION from '@decentralized-identity/ion-tools'
import { DIDResolutionResult, DIDResolutionOptions, DIDResolver } from 'did-resolver'

const resolveDidIon: DIDResolver = async (didUrl: string, options: DIDResolutionOptions): Promise<DIDResolutionResult> => {
  return ION.resolve(didUrl, options)
}

export function getDidIonResolver() {
  return { ion: resolveDidIon }
}
