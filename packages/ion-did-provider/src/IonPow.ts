import { fetch } from 'cross-fetch'
import { argon2id } from 'hash-wasm'
import Debug from 'debug'
import * as u8a from 'uint8arrays'

const debug = Debug('sphereon:ion:pow')

export class IonProofOfWork {
  constructor(
    private challengeEndpoint: string = 'https://beta.ion.msidentity.com/api/v1.0/proof-of-work-challenge',
    private solutionEndpoint: string = 'https://beta.ion.msidentity.com/api/v1.0/operations'
  ) {}

  async submit(requestJson: string): Promise<string> {
    debug(`Getting challenge from: ${this.challengeEndpoint}`)
    const challengeResponse = await fetch(this.challengeEndpoint, {
      mode: 'cors',
    })
    if (!challengeResponse.ok) {
      throw new Error(`Get challenge service not available at ${this.challengeEndpoint}`)
    }
    const challengeBody = await challengeResponse.json()
    console.log(`challenge body:\r\n${JSON.stringify(challengeBody, null, 2)}`)

    const challengeNonce: string = challengeBody.challengeNonce
    const largestAllowedHash: string = challengeBody.largestAllowedHash
    const validDuration: number = challengeBody.validDurationInMinutes * 60 * 1000

    let answerHash: string = ''
    let answerNonce = { base16: '', base10: '' }

    debug(`Solving for body:\n${requestJson}`)
    const startTime = Date.now()

    do {
      answerNonce = this.generateNonce()
      answerHash = await argon2id({
        password: answerNonce.base16 + requestJson,
        salt: u8a.fromString(challengeNonce, 'base16'),
        parallelism: 1,
        iterations: 1,
        memorySize: 1000,
        hashLength: 32, // output size = 32 bytes
        outputType: 'hex',
      })
      debug(`computed answer hash: ${answerHash}`)
    } while (answerHash > largestAllowedHash && Date.now() - startTime < validDuration)

    debug(`largest allowed: ${largestAllowedHash}`)
    debug(`valid answer hash: ${answerHash}`)

    if (Date.now() - startTime > validDuration) {
      throw Error(`Valid duration of ${challengeBody.validDurationInMinutes} minutes has been exceeded since ${startTime}`)
    }

    const solutionResponse = await fetch(this.solutionEndpoint, {
      method: 'POST',
      mode: 'cors',
      body: requestJson,
      headers: {
        'Challenge-Nonce': challengeNonce,
        'Answer-Nonce': answerNonce.base10,
        'Content-Type': 'application/json',
      },
    })

    const solutionBody = await solutionResponse.text()
    if (!solutionResponse.ok) {
      throw Error(`${solutionResponse.status}: ${solutionResponse.statusText}. Body: ${JSON.stringify(solutionBody, null, 2)}`)
    }

    console.log(`Successful registration`)
    console.log(solutionBody)
    return solutionBody
  }

  private generateNonce() {
    const size = Math.floor(Math.random() * Math.floor(500))
    const base16Nonce = [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    return { base16: base16Nonce, base10: this.toBase10String(base16Nonce) }
  }

  private toBase10String(base16String: string) {
    return u8a.fromString(base16String).reduce(function (memo, i) {
      return memo + ('0' + i.toString(16)).slice(-2)
    }, '')
  }
}
