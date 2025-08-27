import { SDJwtInstance, type VerifierOptions } from '@sd-jwt/core'
import type { DisclosureFrame, Hasher } from '@sd-jwt/types'
import { SDJWTException } from '@sd-jwt/utils'
import { type SDJWTVCDM2Config, type SdJwtVcdm2Payload } from '@sphereon/ssi-types'
import { type SDJWTVCConfig, SDJwtVcInstance, type VerificationResult } from '@sd-jwt/sd-jwt-vc'
import { isVcdm2SdJwt, type SdJwtType } from './types'

interface SdJwtVcdm2VerificationResult extends Omit<VerificationResult, 'payload'> {
  payload: SdJwtVcdm2Payload
}

export class SDJwtVcdmInstanceFactory {
  static create(type: SdJwtType, config: SDJWTVCConfig | SDJWTVCDM2Config): SDJwtVcdm2Instance | SDJwtVcInstance {
    if (isVcdm2SdJwt(type)) {
      return new SDJwtVcdm2Instance(config as SDJWTVCDM2Config)
    }
    return new SDJwtVcInstance(config as SDJWTVCConfig)
  }
}

// @ts-ignore
export class SDJwtVcdm2Instance extends SDJwtInstance<SdJwtVcdm2Payload> {
  /**
   * The type of the SD-JWT VCDM2 set in the header.typ field.
   */
  protected static type = 'vc+sd-jwt'

  protected userConfig: SDJWTVCDM2Config = {}

  constructor(userConfig?: SDJWTVCDM2Config) {
    super(userConfig)
    if (userConfig) {
      this.userConfig = userConfig
    }
  }

  /**
   * Validates if the disclosureFrame contains any reserved fields. If so it will throw an error.
   * @param disclosureFrame
   */
  protected validateReservedFields(disclosureFrame: DisclosureFrame<SdJwtVcdm2Payload>): void {
    //validate disclosureFrame according to https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-08.html#section-3.2.2.2
    // @ts-ignore
    if (disclosureFrame?._sd && Array.isArray(disclosureFrame._sd) && disclosureFrame._sd.length > 0) {
      const reservedNames = ['iss', 'nbf', 'exp', 'cnf', '@context', 'type', 'credentialStatus', 'credentialSchema', 'relatedResource']
      // check if there is any reserved names in the disclosureFrame._sd array
      const reservedNamesInDisclosureFrame = (disclosureFrame._sd as string[]).filter((key) => reservedNames.includes(key))
      if (reservedNamesInDisclosureFrame.length > 0) {
        throw new SDJWTException(`Cannot disclose protected field(s): ${reservedNamesInDisclosureFrame.join(', ')}`)
      }
    }
  }

  /**
   * Verifies the SD-JWT-VC. It will validate the signature, the keybindings when required, the status, and the VCT.
   * @param encodedSDJwt
   * @param options
   */
  async verify(encodedSDJwt: string, options?: VerifierOptions) {
    // Call the parent class's verify method
    const result: SdJwtVcdm2VerificationResult = await super.verify(encodedSDJwt, options).then((res) => {
      return {
        payload: res.payload as SdJwtVcdm2Payload,
        header: res.header,
        kb: res.kb,
      }
    })

    // await this.verifyStatus(result, options)

    return result
  }

  /**
   * Validates the integrity of the response if the integrity is passed. If the integrity does not match, an error is thrown.
   * @param integrity
   * @param response
   */
  private async validateIntegrity(response: Response, url: string, integrity?: string) {
    if (integrity) {
      // validate the integrity of the response according to https://www.w3.org/TR/SRI/
      const arrayBuffer = await response.arrayBuffer()
      const alg = integrity.split('-')[0]
      //TODO: error handling when a hasher is passed that is not supporting the required algorithm acording to the spec
      const hashBuffer = await (this.userConfig.hasher as Hasher)(arrayBuffer, alg)
      const integrityHash = integrity.split('-')[1]
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
      if (hash !== integrityHash) {
        throw new Error(`Integrity check for ${url} failed: is ${hash}, but expected ${integrityHash}`)
      }
    }
  }

  /**
   * Fetches the content from the url with a timeout of 10 seconds.
   * @param url
   * @returns
   */
  protected async fetch<T>(url: string, integrity?: string): Promise<T> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.userConfig.timeout ?? 10000),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error fetching ${url}: ${response.status} ${response.statusText} - ${errorText}`)
      }
      await this.validateIntegrity(response.clone(), url, integrity)
      return response.json() as Promise<T>
    } catch (error) {
      if ((error as Error).name === 'TimeoutError') {
        throw new Error(`Request to ${url} timed out`)
      }
      throw error
    }
  }
}
