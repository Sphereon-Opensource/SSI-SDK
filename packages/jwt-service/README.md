<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Jwt and JWS signature service 
  <br>
</h1>

A plugin that can generate and verify JWTs. It can create/sign JWS in Compact, JSON General and JSON Flattened form as
specified in [RFC 7515](https://datatracker.ietf.org/doc/html/rfc7515)

Currently, it supports the following JWS forms:

- JWS Compact Form
- JWS Json General
- JWS Json Flattened (1 signature)

The plugin is using
the [Universal Identifier Resolution](https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions/tree/develop/packages/identifier-resolution)
module. Both for generating JWS JWTs as well as for verifying JWTs.

When signing a JWS it takes into account any x5c, kid or JWK value already present in the header, as well as the `iss`
value. When not present but a Managed Identifier is being provided, the signing service will take care of putting the
correct headers into the JWS.

# Creating/signing a JWS

The `jwtCreateJswCompactSignature` accepts a protected JWT header. You can put any JWT header properties in there.
The `payload` can either be a base64url payload, a `JwtPayload` object or a Buffer/Uint8arry. The method will take care
of any relevant conversions

The `issuer` object allows you to provide a managed identifier

```typescript
const publicKeyHex = '037fcdce2770f6c45d4183cbee6fdb4b7b580733357be9ef13bacf6e3c7bd15445'
const kid = publicKeyHex

const example = await agent.jwtCreateJwsCompactSignature({
  // Example payloads from IETF spec
  issuer: { identifier: kid, noIdentifierInHeader: true }, // do not update any header values with the provided identifier. Just use the identifier for signing
  protectedHeader: { alg: 'ES256' },
  payload: 'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ',
})
```

Verify the signature:

You can optionally provide a JWK if you want to use the JWK as a key for verification. Otherwise it will automacally
resolve the header params like x5c, kid (DID), JWK to perform the resolution with
the [Universal Identifier Resolution](https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions/tree/develop/packages/identifier-resolution)
module

```typescript
const ietfJwk = {
  kty: 'EC',
  crv: 'P-256',
  x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
  y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
  // d: 'jpsQnnGQmL-YBIffH1136cspYG6-0iY7X1fCE9-E9LI',
} satisfies JWK

const result = await agent.jwtVerifyJwsSignature({
  jws: example.jwt,
  jwk: ietfJwk,
})
```

```typescript
const result = {
  critical: false,
  error: false,
  jws: {
    payload: 'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ',
    signatures: [
      {
        identifier: {
          jwk: {
            crv: 'P-256',
            kty: 'EC',
            x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
            y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
          },
          jwks: [
            {
              jwk: {
                crv: 'P-256',
                kty: 'EC',
                x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
                y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
              },
              jwkThumbprint: 'oKIywvGUpTVTyxMQ3bwIIeQUudfr_CkLMjCE19ECD-U',
              publicKeyHex: '037fcdce2770f6c45d4183cbee6fdb4b7b580733357be9ef13bacf6e3c7bd15445',
            },
          ],
          method: 'jwk',
        },
        protected: 'eyJhbGciOiJFUzI1NiJ9',
        signature: 'e4ZrhZdbFQ7630Tq51E6RQiJaae9bFNGJszIhtusEwzvO21rzH76Wer6yRn2Zb34VjIm3cVRl0iQctbf4uBY3w',
      },
    ],
  },
  message: 'Signature validated',
  name: 'jws',
  verificationTime: '2024-08-10T23:04:23',
}
```

### Installation

```shell
pnpm add @sphereon/ssi-sdk-ext.jwt-service
```

### Build

```shell
pnpm run build
```

### Test

The test command runs:

- `prettier`
- `jest`
- `coverage`

You can also run only a single section of these tests, using for example `yarn test:unit`.

```shell
pnmp run test
```
