import JSEncrypt from '@sphereon/jsencrypt'
import { digestMethodParams, X509Opts } from '@sphereon/ssi-sdk-ext.key-utils'
import {
  pemCertChainTox5c,
  PEMToJwk,
  privateKeyHexFromPEM,
  publicKeyHexFromPEM,
  RSASigner,
  toKeyObject,
  x5cToPemCertChain,
} from '@sphereon/ssi-sdk-ext.x509-utils'
import { MemoryPrivateKeyStore } from '@veramo/key-manager'
import * as u8a from 'uint8arrays'
import { describe, expect, it } from 'vitest'
import { SphereonKeyManagementSystem } from '../SphereonKeyManagementSystem'
import { PEM_CERT, PEM_CHAIN, PEM_FULL_CHAIN, PEM_PRIV_KEY } from './certs'

describe('X509 PEMs', () => {
  it('should get public key from private key', () => {
    const publicKeyFromPrivateKey = publicKeyHexFromPEM(PEM_PRIV_KEY)
    expect(publicKeyFromPrivateKey).toEqual(
      '30820122300d06092a864886f70d01010105000382010f003082010a0282010100d5eb1f8708914a91581b7945b2f620963859b5279bcd9db3830cc6ac1cf8e9f26ecf8f6cc1a9d914b099fad9c4c4360008d1be9507f893b6ac32a5d6144314da8c4867526ffd15e41ff2f8fc0b7e0e23cf343de8607af88242b0a55ab2f38c371c12fa105522adcfc0356337374aabb0f2e41f14a56a3c20cacba9d58e14de0c78fdb710494dfa261fe5981e90f7b2e9915eedc6079c59406c02e87db772b689a55d51c370ffcfb9c596a960f40419c129e3bc8f8b1389d92997a68476893a6f64ae19372177271a8a420da9189a956d5a2fb614b07714243aa176d686d077a22225cbc39a71d2c4ba3a0e21c1198118c493bcdcf4a44d8dd7ca1ef264c024530203010001'
    )
  })

  it('cert chains should be converted to x5c and vice versa', async () => {
    const x5c = pemCertChainTox5c(PEM_FULL_CHAIN)
    expect(x5c).toHaveLength(3)
    const chain = x5cToPemCertChain(x5c)
    expect(chain).toHaveLength(PEM_FULL_CHAIN.length)
    expect(chain).toContain(PEM_CERT)
  })
})
describe('x509 keys', () => {
  it('should sign and verify', async () => {
    const jsEncryptGenerated = new JSEncrypt()
    const keyPair = jsEncryptGenerated.getKey()
    const privPEM = keyPair.getPrivateKey()
    const pubPEM = keyPair.getPublicKey()

    const jsEncryptImported = new JSEncrypt()
    jsEncryptImported.setKey(privPEM)

    const jsEncryptPubOnly = new JSEncrypt()
    jsEncryptPubOnly.setKey(pubPEM)

    const sha256 = digestMethodParams('SHA-256')
    const signed = jsEncryptImported.sign('test', sha256.digestMethod, sha256.hashAlgorithm)
    expect(signed).toHaveLength(172)

    expect(jsEncryptPubOnly.verify('test', signed as string, sha256.digestMethod)).toBeTruthy()
  })
  it('should export private key to private Key Object', async () => {
    const keyObject = toKeyObject(PEM_PRIV_KEY, 'private')
    expect(keyObject.keyType).toEqual('private')
    expect(keyObject.keyHex).toEqual(
      '308204bf020100300d06092a864886f70d0101010500048204a9308204a50201000282010100d5eb1f8708914a91581b7945b2f620963859b5279bcd9db3830cc6ac1cf8e9f26ecf8f6cc1a9d914b099fad9c4c4360008d1be9507f893b6ac32a5d6144314da8c4867526ffd15e41ff2f8fc0b7e0e23cf343de8607af88242b0a55ab2f38c371c12fa105522adcfc0356337374aabb0f2e41f14a56a3c20cacba9d58e14de0c78fdb710494dfa261fe5981e90f7b2e9915eedc6079c59406c02e87db772b689a55d51c370ffcfb9c596a960f40419c129e3bc8f8b1389d92997a68476893a6f64ae19372177271a8a420da9189a956d5a2fb614b07714243aa176d686d077a22225cbc39a71d2c4ba3a0e21c1198118c493bcdcf4a44d8dd7ca1ef264c02453020301000102820101009576685ad2b3a124182969fc36e41d34983ea581fd2c16c97c010b36ea2f485628f240c5be324c0856b3df3f1469fb48dee09d8647417903a320e819c1a275099606689a82c093f106199fb98ad6124f16d0eb885710d45d3ef769310be37ace6e811bd31988d764566976def774e6ad05a839c715243acab6a6c20d01eeb68d3d0eec83b098d3ceda31eca32a42121b59229f424975f47061006d766a6cbe18d5857b5e06a8b25e1ca0fd792bb7afb92b83c7d4180482f83bbce0cf55fb3b640a72cd93de0f419fe7e0a1c60d495641afc5cd692c0bde4c71fde0d3501e5b6cf8aa285514613c1e7399d20918e383a7daa370af898dde24242f3486006e503102818100f498cfafc7b004682d6902a67b9f7e316051ab375c35193e3f9307d53041f7d8e1c238503561af52cd23e1ff7ed6c50b32e9ff38bfafd0eb2bd8bd5f4c30c49d2101938c048aff105fe3e66c60acdea069e5cef9575277ab737636c77ae0d08bbf56083fe53d967b0c6a9532c3a44df0742ad58f030e8d86e55444b16621498d02818100dfe42c7f598d07663a7db562d840d2cb9b5d902c8f2855184b2e7c5556a803cb5df12b63524d058476306a8a3adc614ebafb494c5fcc465f0831b817405061297b15a95565d4a4bd820fa66959590c32ef9929629c5f16a38e8591d55e056fcf597adb6f997bbfdcaef5ea9692abd73737a5911cb5d59ed44b0e0d088e6c7d5f028180449dcdbd812656c626df0b984a9bde99d96c6fbcb3084e5191221d13685b493d356ff7be408b6bd4ada9c04f9d74808878bafe171c672513a4144463c48af5cd22a23f930aff37388fbdee393f119fce9e86927e8e499b3aa4c467efa4000760fcc714bf5ffedc051ee193834f30fb9055f6623ca15de6c40df78ae1bd45df4d02818100b9c40faba6b8de3fd31e44a6fbf9652dacfe87c6810d9cf56843ecc3bdfff00e082737b1d432b5f63f3e52d7d898cc604fc27a01d5a69f68f05a987d2a4ec71f6cd1ff4b2d0faf94d1da7c6002d360ccce824d95555b8c642eb7e2d59f8a714820dd503f1ba153031f6449bd9f7ad73a2880c69384c7f75dfbdc6fb1fec2438f02818100df333c3157e5e861fc1bb4db910c628b5dcbff481f0ed036c4a7f2a517ff390cb0c5cbb44fc02351738e0df74d3b5345c48e728cbacd1752ac04fb482829c3037f0de6f8f8de9a9395aa740b07a2608877eb570406aba25563dd1f187f6b9c0b3e9aec71487c56999a91436a0e76da27caf444578e2782bc1ee2718af0ee4de0'
    )
    expect(keyObject.pem).toEqual(PEM_PRIV_KEY + '\n')
    expect(keyObject.jwk).toEqual({
      kty: 'RSA',
      n: '1esfhwiRSpFYG3lFsvYgljhZtSebzZ2zgwzGrBz46fJuz49swanZFLCZ-tnExDYACNG-lQf4k7asMqXWFEMU2oxIZ1Jv_RXkH_L4_At-DiPPND3oYHr4gkKwpVqy84w3HBL6EFUirc_ANWM3N0qrsPLkHxSlajwgysup1Y4U3gx4_bcQSU36Jh_lmB6Q97LpkV7txgecWUBsAuh9t3K2iaVdUcNw_8-5xZapYPQEGcEp47yPixOJ2SmXpoR2iTpvZK4ZNyF3JxqKQg2pGJqVbVovthSwdxQkOqF21obQd6IiJcvDmnHSxLo6DiHBGYEYxJO83PSkTY3Xyh7yZMAkUw',
      e: 'AQAB',
      d: 'lXZoWtKzoSQYKWn8NuQdNJg-pYH9LBbJfAELNuovSFYo8kDFvjJMCFaz3z8UaftI3uCdhkdBeQOjIOgZwaJ1CZYGaJqCwJPxBhmfuYrWEk8W0OuIVxDUXT73aTEL43rOboEb0xmI12RWaXbe93TmrQWoOccVJDrKtqbCDQHuto09DuyDsJjTztox7KMqQhIbWSKfQkl19HBhAG12amy-GNWFe14GqLJeHKD9eSu3r7krg8fUGASC-Du84M9V-ztkCnLNk94PQZ_n4KHGDUlWQa_FzWksC95Mcf3g01AeW2z4qihVFGE8HnOZ0gkY44On2qNwr4mN3iQkLzSGAG5QMQ',
      p: '9JjPr8ewBGgtaQKme59-MWBRqzdcNRk-P5MH1TBB99jhwjhQNWGvUs0j4f9-1sULMun_OL-v0Osr2L1fTDDEnSEBk4wEiv8QX-PmbGCs3qBp5c75V1J3q3N2Nsd64NCLv1YIP-U9lnsMapUyw6RN8HQq1Y8DDo2G5VREsWYhSY0',
      q: '3-Qsf1mNB2Y6fbVi2EDSy5tdkCyPKFUYSy58VVaoA8td8StjUk0FhHYwaoo63GFOuvtJTF_MRl8IMbgXQFBhKXsVqVVl1KS9gg-maVlZDDLvmSlinF8Wo46FkdVeBW_PWXrbb5l7v9yu9eqWkqvXNzelkRy11Z7USw4NCI5sfV8',
      dp: 'RJ3NvYEmVsYm3wuYSpvemdlsb7yzCE5RkSIdE2hbST01b_e-QItr1K2pwE-ddICIeLr-FxxnJROkFERjxIr1zSKiP5MK_zc4j73uOT8Rn86ehpJ-jkmbOqTEZ--kAAdg_McUv1_-3AUe4ZODTzD7kFX2YjyhXebEDfeK4b1F300',
      dq: 'ucQPq6a43j_THkSm-_llLaz-h8aBDZz1aEPsw73_8A4IJzex1DK19j8-UtfYmMxgT8J6AdWmn2jwWph9Kk7HH2zR_0stD6-U0dp8YALTYMzOgk2VVVuMZC634tWfinFIIN1QPxuhUwMfZEm9n3rXOiiAxpOEx_dd-9xvsf7CQ48',
      qi: '3zM8MVfl6GH8G7TbkQxii13L_0gfDtA2xKfypRf_OQywxcu0T8AjUXOODfdNO1NFxI5yjLrNF1KsBPtIKCnDA38N5vj43pqTlap0CweiYIh361cEBquiVWPdHxh_a5wLPprscUh8VpmakUNqDnbaJ8r0RFeOJ4K8HuJxivDuTeA',
    })
  })

  it('should export private key to public Key Object', async () => {
    const keyObject = toKeyObject(PEM_PRIV_KEY, 'public')
    expect(keyObject.keyType).toEqual('public')
    expect(keyObject.keyHex).toEqual(
      '30820122300d06092a864886f70d01010105000382010f003082010a0282010100d5eb1f8708914a91581b7945b2f620963859b5279bcd9db3830cc6ac1cf8e9f26ecf8f6cc1a9d914b099fad9c4c4360008d1be9507f893b6ac32a5d6144314da8c4867526ffd15e41ff2f8fc0b7e0e23cf343de8607af88242b0a55ab2f38c371c12fa105522adcfc0356337374aabb0f2e41f14a56a3c20cacba9d58e14de0c78fdb710494dfa261fe5981e90f7b2e9915eedc6079c59406c02e87db772b689a55d51c370ffcfb9c596a960f40419c129e3bc8f8b1389d92997a68476893a6f64ae19372177271a8a420da9189a956d5a2fb614b07714243aa176d686d077a22225cbc39a71d2c4ba3a0e21c1198118c493bcdcf4a44d8dd7ca1ef264c024530203010001'
    )
    expect(keyObject.pem).toEqual(
      '-----BEGIN PUBLIC KEY-----\n' +
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1esfhwiRSpFYG3lFsvYg\n' +
        'ljhZtSebzZ2zgwzGrBz46fJuz49swanZFLCZ+tnExDYACNG+lQf4k7asMqXWFEMU\n' +
        '2oxIZ1Jv/RXkH/L4/At+DiPPND3oYHr4gkKwpVqy84w3HBL6EFUirc/ANWM3N0qr\n' +
        'sPLkHxSlajwgysup1Y4U3gx4/bcQSU36Jh/lmB6Q97LpkV7txgecWUBsAuh9t3K2\n' +
        'iaVdUcNw/8+5xZapYPQEGcEp47yPixOJ2SmXpoR2iTpvZK4ZNyF3JxqKQg2pGJqV\n' +
        'bVovthSwdxQkOqF21obQd6IiJcvDmnHSxLo6DiHBGYEYxJO83PSkTY3Xyh7yZMAk\n' +
        'UwIDAQAB\n' +
        '-----END PUBLIC KEY-----\n'
    )
    expect(keyObject.jwk).toEqual({
      e: 'AQAB',
      kty: 'RSA',
      n: '1esfhwiRSpFYG3lFsvYgljhZtSebzZ2zgwzGrBz46fJuz49swanZFLCZ-tnExDYACNG-lQf4k7asMqXWFEMU2oxIZ1Jv_RXkH_L4_At-DiPPND3oYHr4gkKwpVqy84w3HBL6EFUirc_ANWM3N0qrsPLkHxSlajwgysup1Y4U3gx4_bcQSU36Jh_lmB6Q97LpkV7txgecWUBsAuh9t3K2iaVdUcNw_8-5xZapYPQEGcEp47yPixOJ2SmXpoR2iTpvZK4ZNyF3JxqKQg2pGJqVbVovthSwdxQkOqF21obQd6IiJcvDmnHSxLo6DiHBGYEYxJO83PSkTY3Xyh7yZMAkUw',
    })
  })
})

describe('@veramo/kms-local x509 import', () => {
  const x509: X509Opts = {
    cn: 'f825-87-213-241-251.eu.ngrok.io',
    certificatePEM: PEM_CERT,
    certificateChainPEM: PEM_CHAIN,
    privateKeyPEM: PEM_PRIV_KEY,
    certificateChainURL: 'https://example.com/.wellknown/fullchain.pem',
  }
  const privateKeyHex = privateKeyHexFromPEM(PEM_PRIV_KEY)
  const meta = {
    x509,
  }

  it('should import a cert with chain', async () => {
    const kms = new SphereonKeyManagementSystem(new MemoryPrivateKeyStore())

    // @ts-ignore
    const key = await kms.importKey({ kid: 'test', privateKeyHex, type: 'RSA', meta })
    expect(key.type).toEqual('RSA')
    expect(key.publicKeyHex).toEqual(
      '30820122300d06092a864886f70d01010105000382010f003082010a0282010100d5eb1f8708914a91581b7945b2f620963859b5279bcd9db3830cc6ac1cf8e9f26ecf8f6cc1a9d914b099fad9c4c4360008d1be9507f893b6ac32a5d6144314da8c4867526ffd15e41ff2f8fc0b7e0e23cf343de8607af88242b0a55ab2f38c371c12fa105522adcfc0356337374aabb0f2e41f14a56a3c20cacba9d58e14de0c78fdb710494dfa261fe5981e90f7b2e9915eedc6079c59406c02e87db772b689a55d51c370ffcfb9c596a960f40419c129e3bc8f8b1389d92997a68476893a6f64ae19372177271a8a420da9189a956d5a2fb614b07714243aa176d686d077a22225cbc39a71d2c4ba3a0e21c1198118c493bcdcf4a44d8dd7ca1ef264c024530203010001'
    )
    expect(key.kid).toEqual('test')
    expect(key.meta?.algorithms).toEqual(['PS256', 'PS512', 'RS256', 'RS512'])

    expect(key.meta?.publicKeyPEM).toBeDefined()
    await expect(key.meta?.publicKeyJwk).toMatchObject({
      kty: 'RSA',
      n: '1esfhwiRSpFYG3lFsvYgljhZtSebzZ2zgwzGrBz46fJuz49swanZFLCZ-tnExDYACNG-lQf4k7asMqXWFEMU2oxIZ1Jv_RXkH_L4_At-DiPPND3oYHr4gkKwpVqy84w3HBL6EFUirc_ANWM3N0qrsPLkHxSlajwgysup1Y4U3gx4_bcQSU36Jh_lmB6Q97LpkV7txgecWUBsAuh9t3K2iaVdUcNw_8-5xZapYPQEGcEp47yPixOJ2SmXpoR2iTpvZK4ZNyF3JxqKQg2pGJqVbVovthSwdxQkOqF21obQd6IiJcvDmnHSxLo6DiHBGYEYxJO83PSkTY3Xyh7yZMAkUw',
      e: 'AQAB',
      x5u: 'https://example.com/.wellknown/fullchain.pem',
    })
  })

  it('should sign input data', async () => {
    const kms = new SphereonKeyManagementSystem(new MemoryPrivateKeyStore())
    const data = u8a.fromString('test', 'utf-8')

    // @ts-ignore
    const key = await kms.importKey({ kid: 'test', privateKeyHex, type: 'RSA', meta })
    const signature = await kms.sign({ keyRef: key, data, algorithm: 'RS256' })
    expect(signature).toEqual(
      'PAgf2uRWJa-pmlUL80NVnxkExJkcpfLPB8udX1WoFGtAnIuFCfq8r1C43NL0xr9Qtn8TBK5pVHmAPPd7XlTkXU_LQ_JoBYxjzjtaRzGOo4-S-TAtKaW-evGI5rpXFWCeta0gwzTCVfDjbouRUg3_krK0B1cLLK1Kiih83n-6hadTxPLiQqNpbWxbnoHbZXw-V-5maCE1erY9cvO9LZeO2S_PXiqb19gk4mOEG3ZRQm12eHAlOVTnqRYiLmwWfSnT231jkJnF99RuLUjxlQNO5K6B-vYIhfVoqDliqaW6IEOamJJHUWG6RlqZfU7TzanZzR0YmDf5HIJEiDG4D_lF6g'
    )
  })
})

describe('RSA Signer', () => {
  it('should sign and verify', async () => {
    const signer = new RSASigner(PEMToJwk(PEM_PRIV_KEY, 'private'), {
      hashAlgorithm: 'SHA-256',
      scheme: 'RSASSA-PKCS1-V1_5',
    })
    const signature = await signer.sign(u8a.fromString('test123', 'utf-8'))
    expect(signature).toBeDefined()

    const result = await signer.verify('test123', signature)
    expect(result).toBeTruthy()
  })
})
