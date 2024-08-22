import { com } from '@sphereon/kmp-mdl-mdoc'
import CoseKeyJson = com.sphereon.crypto.cose.CoseKeyJson
import CoseKeyType = com.sphereon.crypto.cose.CoseKeyType
import CoseSignatureAlgorithm = com.sphereon.crypto.cose.CoseSignatureAlgorithm
import ICoseKeyJson = com.sphereon.crypto.cose.ICoseKeyJson


describe('Serialization', (): void => {

  beforeAll(async (): Promise<void> => {
  })

  it('should decode and encode ISO Test Vector', async () => {
    const coseKey = CoseKeyJson.Static.fromDTO({ kty: CoseKeyType.EC2, alg: CoseSignatureAlgorithm.ES256 })
    // const asIKey = coseKey as IKey
    console.log(coseKey.toDto())
    console.log(coseKey.toJsonString())
    console.log(coseKey.toJsonDTO())
    const json: ICoseKeyJson = coseKey.toJsonDTO()
    console.log(json)
    console.log(CoseKeyJson.Static.fromDTO(json).alg)

  })

})
