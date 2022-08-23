import { Resolver } from 'did-resolver'
import { getResolver } from '../index'
import * as fs from 'fs'

describe('@sphereon/ssi-sdk-bls-key-did-resolver', () => {
  it('should resolve a BSL did:key', async () => {
    const resolver = new Resolver({ ...getResolver() })
    const doc = await resolver.resolve(
      'did:key:zUC7Gc59EawPuAbe1gcbmpTtYeyRvRLUsCfkmHwmNaiQyQtQp9f4G4KHurpHaa6QUvm1mL1rZvKXQWpfRcTBfLsstL2kmMN3rkFSzYuzbxwD4LespdY8NKdsghxeiRNtNSbzKic'
    )
    expect(doc).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/bls_did_doc.json`, { encoding: 'utf-8' })))
  })
  it('should resolve a Ed25519 did:key', async () => {
    const resolver = new Resolver({ ...getResolver() })
    const doc = await resolver.resolve('did:key:z6MkkDYR2LLa6tDBXVEuxcU4pqvHggz36oQESE9fc9jK6mAt')
    expect(doc).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/ed25519_did_doc.json`, { encoding: 'utf-8' })))
  })
  it('should resolve a secp256k1 did:key', async () => {
    const resolver = new Resolver({ ...getResolver() })
    const doc = await resolver.resolve('did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme')
    expect(doc).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/secp256k1_did_doc.json`, { encoding: 'utf-8' })))
  })
})
