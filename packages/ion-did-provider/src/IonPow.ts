import { fetch } from 'cross-fetch'
import { argon2id } from 'hash-wasm'
import Debug from 'debug'

const debug = Debug('sphereon:ion:pow')

const buffer = require('buffer/').Buffer;

export class IonProofOfWork {
  constructor(
    private challengeEndpoint: string = 'https://beta.ion.msidentity.com/api/v1.0/proof-of-work-challenge',
    private solutionEndpoint = 'https://beta.ion.msidentity.com/api/v1.0/operations'
  ) {}

  async submit(requestJson: string) {
    debug(`Getting challenge from: ${this.challengeEndpoint}`)
    const challengeResponse = await fetch(this.challengeEndpoint, {
      mode: 'cors',
    })
    if (!challengeResponse.ok) {
      throw new Error(`Get challenge service not available at ${this.challengeEndpoint}`)
    }
    const challengeBody = await challengeResponse.json()
    // todo make interface
    console.log(JSON.stringify(challengeBody, null, 2))

    const challengeNonce: string = challengeBody.challengeNonce
    const largestAllowedHash: string = challengeBody.largestAllowedHash
    const validDuration: number = challengeBody.validDurationInMinutes * 60 * 1000

    let answerHash: string = ''
    let answerNonce: string = ''

    debug(`Solving for body:\n${requestJson}`)
    const startTime = Date.now()

    do {
      answerNonce = this.randomHexString()
      answerHash = await argon2id({
        password:  buffer.from(answerNonce, 'hex').toString() + requestJson,
        salt: challengeNonce,
        parallelism: 1,
        iterations: 1,
        memorySize: 1000,
        hashLength: 32, // output size = 32 bytes
        outputType: 'hex',
      })
      debug(`answer hash: ${answerHash}`)
    } while (answerHash > largestAllowedHash && (Date.now() - startTime < validDuration))

    console.log(`largest allowed: ${largestAllowedHash}`)
    console.log(`answer hash: ${answerHash}`)

    if (Date.now() - startTime > validDuration) {
      throw Error(`Valid duration of ${challengeBody.validDurationInMinutes} minutes has been exceeded since ${startTime}`)
    }

    const solutionResponse = await fetch(this.solutionEndpoint, {
      method: 'POST',
      mode: 'cors',
      body: requestJson,
      headers: {
        'Challenge-Nonce': challengeNonce,
        'Answer-Nonce': answerNonce,
        'Content-Type': 'application/json',
      },
    })

    const solutionBody = await solutionResponse.json()
    if (!solutionResponse.ok) {
      throw Error(`${solutionResponse.status}: ${solutionResponse.statusText}. Body: ${JSON.stringify(solutionBody, null, 2)}`)
    }
    //success
    console.log(`Successful registration`)
    console.log(solutionBody)
    return solutionBody
  }

  randomHexString() {
    const size = Math.floor(Math.random() * Math.floor(500));
    const randomString = [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    return buffer.from(randomString).toString('hex');
  }

  /*private randomHexString(): string {
    const size = Math.floor(Math.random() * Math.floor(500))
    const randomString = [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    return randomString
    // return buffer.from(randomString).toString('hex');
  }*/

  /*private toHexString(input: string): string {
    return parseInt(input, 16).toString(16)
  }*/
}
