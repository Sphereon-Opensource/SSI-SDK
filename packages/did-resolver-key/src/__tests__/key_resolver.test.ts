import { Resolver } from 'did-resolver'
import * as fs from 'fs'
import { describe, expect, it } from 'vitest'
import { DID_JSON, DID_LD_JSON, getResolver } from '../index'

const ed25519Fixtures = JSON.parse(fs.readFileSync(`${__dirname}/fixtures/ed25519-x25519.json`, { encoding: 'utf-8' }))

describe('@sphereon/ssi-sdk-ext-key-did-resolver', () => {
  it('should resolve a BLS did:key', async () => {
    const resolver = new Resolver({ ...getResolver() })
    const doc = await resolver.resolve(
      'did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic',
      { accept: DID_JSON }
    )
    expect(doc).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/fixtures/bls_did_doc.json`, { encoding: 'utf-8' })))
  })
  it('should resolve a Ed25519 did:key with 2018 format', async () => {
    const resolver = new Resolver({ ...getResolver() })
    const doc = await resolver.resolve('did:key:z6MkvqoYXQfDDJRv8L4wKzxYeuKyVZBfi9Qo6Ro8MiLH3kDQ', { publicKeyFormat: 'Ed25519VerificationKey2018' })
    expect(doc.didDocument).toEqual(ed25519Fixtures['did:key:z6MkvqoYXQfDDJRv8L4wKzxYeuKyVZBfi9Qo6Ro8MiLH3kDQ'].didDocument)
  })
  it('should resolve a Ed25519 did:key with 2020 format', async () => {
    const resolver = new Resolver({ ...getResolver() })
    const doc = await resolver.resolve('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK', { publicKeyFormat: 'Ed25519VerificationKey2020' })
    expect(doc.didDocument).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/fixtures/ed25519_did_doc.json`, { encoding: 'utf-8' })))
  })
  it('should resolve a Ed25519 did:key without format', async () => {
    const resolver = new Resolver({ ...getResolver() })
    const doc = await resolver.resolve('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK')
    expect(doc.didDocument).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/fixtures/ed25519_did_doc.json`, { encoding: 'utf-8' })))
  })
  it('should resolve a secp256k1 did:key', async () => {
    const resolver = new Resolver({ ...getResolver() })
    const doc = await resolver.resolve('did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme', { accept: DID_JSON })
    expect(doc).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/fixtures/secp256k1_did_doc.json`, { encoding: 'utf-8' })))
  })
  it('should resolve a jcs JWK did:key', async () => {
    const resolver = new Resolver({ ...getResolver() })
    const doc = await resolver.resolve(
      'did:key:z2dmzD81cgPx8Vki7JbuuMmFYrWPgYoytykUZ3eyqht1j9KbsEYvdrjxMjQ4tpnje9BDBTzuNDP3knn6qLZErzd4bJ5go2CChoPjd5GAH3zpFJP5fuwSk66U5Pq6EhF4nKnHzDnznEP8fX99nZGgwbAh1o7Gj1X52Tdhf7U4KTk66xsA5r',
      { accept: DID_LD_JSON }
    )
    expect(doc).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/fixtures/jwk_jcs_did_doc.json`, { encoding: 'utf-8' })))
  })
})
