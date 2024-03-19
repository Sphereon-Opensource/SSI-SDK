import base64url from 'base64url'
import { DidCommOutOfBandMessage } from '../src/agent/utils'
import { oobInvitation } from './shared/fixtures'

describe('SSI QR Code', () => {
  it('should create json value', async () => {
    const json = DidCommOutOfBandMessage.toJson(oobInvitation)
    expect(json).toMatch(
      '{"type":"https://didcomm.org/out-of-band/2.0/invitation","id":"599f3638-b563-4937-9487-dfe55099d900","from":"did:key:zrfdjkgfjgfdjk","body":{"goal_code":"streamlined-vp","accept":["didcomm/v2"]}}',
    )
  })

  it('should url encode and decode', async () => {
    const urlEncoded = DidCommOutOfBandMessage.urlEncode(oobInvitation)
    expect(urlEncoded).toMatch(
      'eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNTk5ZjM2MzgtYjU2My00OTM3LTk0ODctZGZlNTUwOTlkOTAwIiwiZnJvbSI6ImRpZDprZXk6enJmZGprZ2ZqZ2ZkamsiLCJib2R5Ijp7ImdvYWxfY29kZSI6InN0cmVhbWxpbmVkLXZwIiwiYWNjZXB0IjpbImRpZGNvbW0vdjIiXX19',
    )
    expect(base64url.decode(urlEncoded)).toMatch(
      '{"type":"https://didcomm.org/out-of-band/2.0/invitation","id":"599f3638-b563-4937-9487-dfe55099d900","from":"did:key:zrfdjkgfjgfdjk","body":{"goal_code":"streamlined-vp","accept":["didcomm/v2"]}}',
    )
  })
})
