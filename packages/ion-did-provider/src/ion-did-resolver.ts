import * as ION from '@sphereon/ion-tools'

export function IonDIDResolver() {
  return async function(did: string) {
    return ION.resolve(did)
  }
}
