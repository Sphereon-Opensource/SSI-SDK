import { beforeAll, describe, expect, it } from 'vitest'
import { X509Opts } from '@sphereon/ssi-sdk-ext.key-utils'
import { privateKeyHexFromPEM } from '@sphereon/ssi-sdk-ext.x509-utils'
// @ts-ignore
import * as u8a from 'uint8arrays'
import { RestKeyManagementSystem } from '../src'
import { PEM_CERT, PEM_CHAIN, PEM_PRIV_KEY } from './certs'
import { createMocks } from './mocks'

describe('Key creation', () => {
  let kms: RestKeyManagementSystem;

  beforeAll(async (): Promise<void> => {
    kms = new RestKeyManagementSystem({
      applicationId: "rest-kms",
      baseUrl: "https://ssi-backend.sphereon.com"
    })
    createMocks()
  })

  it('should create RSA key', async () => {
    const key = await kms.createKey({ type: 'RSA' })

    expect(key.type).toEqual('RSA')
    expect(key?.meta?.jwkThumbprint).toBeDefined()
  })

  it('should create Secp256r1 key', async () => {
    const key = await kms.createKey({ type: 'Secp256r1' })

    expect(key.type).toEqual('Secp256r1')
    expect(key?.meta?.jwkThumbprint).toBeDefined()
  })

  it('should create X25519 key', async () => {
    const key = await kms.createKey({ type: 'X25519' })

    expect(key.type).toEqual('X25519')
    expect(key?.meta?.jwkThumbprint).toBeDefined()
  })

  it('should import RSA key', async () => {
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

    const key = await kms.importKey({ kid: 'test', privateKeyHex, type: 'RSA', meta })

    expect(key).toBeDefined()
  })

  it('should import Secp256r1 key', async () => {
    const privateKeyHex = '7dd923e40f4615ac496119f7e793cc2899e99b64b88ca8603db986700089532b'
    const key = await kms.importKey({ kid: 'test', privateKeyHex, type: 'Secp256r1'})

    expect(key).toBeDefined()
  })

  it('should import X25519 key', async () => {
    const privateKeyHex = '2fe57da347cd62431528daac5fbb290730fff684afc4cfc2ed90995f58cb3b74'
    const key = await kms.importKey({ kid: 'test', privateKeyHex, type: 'X25519' })

    expect(key).toBeDefined()
  })

  it('should list keys', async () => {
    const key = await kms.createKey({ type: 'Secp256r1' })
    expect(key.type).toEqual('Secp256r1')

    const keys = await kms.listKeys()

    expect(keys.length).toBeGreaterThan(0)
  })

  it('should delete key', async () => {
    const privateKeyHex = '7dd923e40f4615ac496119f7e793cc2899e99b64b88ca8603db986700089532b'
    const key = await kms.importKey({ kid: 'test', privateKeyHex, type: 'Secp256r1'})

    const result = await kms.deleteKey({ kid: key.kid })

    expect(result).toBeTruthy()
  })

  it('should create signature', async () => {
    const privateKeyHex = '7dd923e40f4615ac496119f7e793cc2899e99b64b88ca8603db986700089532b'
    const key = await kms.importKey({ kid: 'test', privateKeyHex, type: 'Secp256r1'})
    expect(key.type).toEqual('Secp256r1')

    const signature = await kms.sign({
      keyRef: { kid: key.kid },
      data: u8a.fromString('test', 'utf-8')
    })

    expect(signature).toBeDefined()
  })

  it('should verify signature', async () => {
    const data = u8a.fromString('test', 'utf-8')
    const privateKeyHex = '7dd923e40f4615ac496119f7e793cc2899e99b64b88ca8603db986700089532b'
    const key = await kms.importKey({ kid: 'test', privateKeyHex, type: 'Secp256r1'})
    expect(key.type).toEqual('Secp256r1')
    const keyRef = { kid: key.kid }

    const signature = await kms.sign({
      keyRef,
      data
    })

    const verification = await kms.verify({
      keyRef,
      data,
      signature,
    })

    expect(verification).toBeTruthy()
  })

})

