<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Managed and external identifier resolution 
  <br>
</h1>

A plugin that in a uniform way can resolve any supported external identifiers, as well as get managed identifiers. It
performs validations as well as return the objects in a uniform way. Public keys will always be resolved and presented
as JWKs.

Currently, it supports the following identifier methods and types:

- DIDs (and the internal IIdentifier type)
- JWKs (JWK object and public key in hex)
- kid, KMS key references and jwk thumbprints
- X.509 certificate chains

TODO:

- https .well-knowns (JWKSet)
- OIDC Discovery
- X.509 CN en SANs
- OID4VCI Issuers

Since the plugin dynamically looks for the correct agent plugins based on the types being resolved, this plugin should
be used for any and all identifier resolution.

No matter whether the plugin is doing resolution of external identifiers or managed/internal identifiers, the results
will always include certain objects, like the JWK key(s) associated, certificates etc. This ensures uniform handling in
all places that rely on key/identifier management.

## Managed Identifiers

Managed or internal identifiers, are identifiers that are being controlled by the agent. This means the agent either has
access to the private key, or is using a hardware protected mechanism with access to the private key. All of the managed
methods return both a JWK managed by the agent, an IKey instance, which is the internal key representations, as well as
a kmsKeyRef allowing you to retrieve the key easily later.

Read an identifier by IIdentifier object or DID (or did URL)

### DIDs and IIdentifiers

```typescript
const identifier = await agent.didManagerCreate({ kms: 'local' })
// Created an idenftier. For example did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiR2poUzgzeTJGaWhqYkYzOFBfc01VS2Y5MzVoVnZNRHNjazBEZ3h4bUMzNCIsInkiOiJTcFZPR3g1bGV2UWM1TV9ZM2VBTTJvdWhmRnF0VXNQelVfX0RBSVRYLWhJIn0"

let resolution = await agent.identifierManagedGet({ identifier })
console.log(JSON.stringify(resolution, null, 2))

// This is the same as above, but with the benefit of having fully typed response, instead of a union
resolution = await agent.identifierManagedGetByDid({ identifier })

resolution = await agent.identifierManagedGet({
  identifier:
    'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiR2poUzgzeTJGaWhqYkYzOFBfc01VS2Y5MzVoVnZNRHNjazBEZ3h4bUMzNCIsInkiOiJTcFZPR3g1bGV2UWM1TV9ZM2VBTTJvdWhmRnF0VXNQelVfX0RBSVRYLWhJIn0',
})
// This is the same as above, but with the benefit of having fully typed response, instead of a union
resolution = await agent.identifierManagedGetByDid({
  identifier:
    'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiR2poUzgzeTJGaWhqYkYzOFBfc01VS2Y5MzVoVnZNRHNjazBEZ3h4bUMzNCIsInkiOiJTcFZPR3g1bGV2UWM1TV9ZM2VBTTJvdWhmRnF0VXNQelVfX0RBSVRYLWhJIn0',
})
```

result (some parts omited for brevity:

```json
{
  "method": "did",
  "jwk": {
    "alg": "ES256",
    "kty": "EC",
    "crv": "P-256",
    "x": "GjhS83y2FihjbF38P_sMUKf935hVvMDsck0DgxxmC34",
    "y": "SpVOGx5levQc5M_Y3eAM2ouhfFqtUsPzU__DAITX-hI",
    "kid": "77_7PdYbkikec5AR6zSKVIxgNExChvuOLLULBwS6jwc"
  },
  "jwkThumbprint": "77_7PdYbkikec5AR6zSKVIxgNExChvuOLLULBwS6jwc",
  "identifier": {
    "did": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiR2poUzgzeTJGaWhqYkYzOFBfc01VS2Y5MzVoVnZNRHNjazBEZ3h4bUMzNCIsInkiOiJTcFZPR3g1bGV2UWM1TV9ZM2VBTTJvdWhmRnF0VXNQelVfX0RBSVRYLWhJIn0",
    "controllerKeyId": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiR2poUzgzeTJGaWhqYkYzOFBfc01VS2Y5MzVoVnZNRHNjazBEZ3h4bUMzNCIsInkiOiJTcFZPR3g1bGV2UWM1TV9ZM2VBTTJvdWhmRnF0VXNQelVfX0RBSVRYLWhJIn0#0",
    "keys": [
      {
        <snip>
        "kms": "local"
      }
    ],
    "services": [],
    "provider": "did:jwk"
  },
  "did": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiR2poUzgzeTJGaWhqYkYzOFBfc01VS2Y5MzVoVnZNRHNjazBEZ3h4bUMzNCIsInkiOiJTcFZPR3g1bGV2UWM1TV9ZM2VBTTJvdWhmRnF0VXNQelVfX0RBSVRYLWhJIn0",
  "controllerKeyId": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiR2poUzgzeTJGaWhqYkYzOFBfc01VS2Y5MzVoVnZNRHNjazBEZ3h4bUMzNCIsInkiOiJTcFZPR3g1bGV2UWM1TV9ZM2VBTTJvdWhmRnF0VXNQelVfX0RBSVRYLWhJIn0#0",
  "keys": [
    {
      <snip,
      see
      key
      below>
    }
  ],
  "key": {
    "type": "Secp256r1",
    "kid": "021a3852f37cb61628636c5dfc3ffb0c50a7fddf9855bcc0ec724d03831c660b7e",
    "publicKeyHex": "021a3852f37cb61628636c5dfc3ffb0c50a7fddf9855bcc0ec724d03831c660b7e",
    "kms": "local",
    "meta": <snip>
  },
  "kmsKeyRef": "021a3852f37cb61628636c5dfc3ffb0c50a7fddf9855bcc0ec724d03831c660b7e"
}
```

### KMS Key reference, JWK Thumbprint

Read a managed identifier by kmsRef, or jwkThumbprint, using the above example. The response is the same, minus the
identifier object, did and controllerKey values in the result as it will be a single key only in this case.

```typescript
// JWK Thumbprint
resolution = await agent.identifierManagedGet({ identifier: '77_7PdYbkikec5AR6zSKVIxgNExChvuOLLULBwS6jwc' })
// This is the same as above, but with the benefit of having fully typed response, instead of a union
resolution = await agent.identifierManagedGetByKid({ identifier: '77_7PdYbkikec5AR6zSKVIxgNExChvuOLLULBwS6jwc' })

// KMS Key ref
resolution = await agent.identifierManagedGet({ identifier: '021a3852f37cb61628636c5dfc3ffb0c50a7fddf9855bcc0ec724d03831c660b7e' })
// This is the same as above, but with the benefit of having fully typed response, instead of a union
resolution = await agent.identifierManagedGetByKid({ identifier: '021a3852f37cb61628636c5dfc3ffb0c50a7fddf9855bcc0ec724d03831c660b7e' })

const jwk = {
  alg: 'ES256',
  kty: 'EC',
  crv: 'P-256',
  x: 'GjhS83y2FihjbF38P_sMUKf935hVvMDsck0DgxxmC34',
  y: 'SpVOGx5levQc5M_Y3eAM2ouhfFqtUsPzU__DAITX-hI',
  kid: '77_7PdYbkikec5AR6zSKVIxgNExChvuOLLULBwS6jwc',
}

// By JWK object
resolution = await agent.identifierManagedGet({ identifier: jwk })
// This is the same as above, but with the benefit of having fully typed response, instead of a union
resolution = await agent.identifierManagedGetByJwk({ identifier: jwk })
```

## External Identifiers

We will use the example JWK above again, as that is an in memory construct, we can also resolve it like an external
identifier

### DIDs

```typescript
const did =
  'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiR2poUzgzeTJGaWhqYkYzOFBfc01VS2Y5MzVoVnZNRHNjazBEZ3h4bUMzNCIsInkiOiJTcFZPR3g1bGV2UWM1TV9ZM2VBTTJvdWhmRnF0VXNQelVfX0RBSVRYLWhJIn0'

resolution = await agent.identifierExternalResolve({ identifier: did })
// This is the same as above, but with the benefit of having fully typed response, instead of a union
resolution = await agent.identifierExternalResolveByDid({ identifier: did })
console.log(JSON.stringify(resolution, null, 2))
```

Results in the following JSON, with some properties removed for brevity

```json
{
  "method": "did",
  "did": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0",
  "jwks": [
    {
      "jwk": {
        "alg": "ES256",
        "use": "sig",
        "kty": "EC",
        "crv": "P-256",
        "x": "wdIEmfjmaZiGsub9Hffnhbr0xVVVmVLiUYLscgRt-3Y",
        "y": "ept3ke4SslZb7ZbweWKmSaM3166ZuvecZ9ciKs6PDcw",
        "kid": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0#0"
      },
      "jwkThumbprint": "gBT5We3eKcs3NNBAeJ40iPHbWvqAmY8C8L36rGwOAJk",
      "kid": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0#0"
    }
  ],
  "didJwks": {
    // These are the JWKs per verification method relationship. For a JWK this includes the above JWK, so we will not repeat it here
    "verificationMethod": [
      {
        <snip>
      }
    ],
    "assertionMethod": [
      {
        <snip>
      }
    ],
    "authentication": [
      {
        <snip>
      }
    ],
    "keyAgreement": [],
    "capabilityInvocation": [
      {
        <snip>
      }
    ],
    "capabilityDelegation": [
      {
        <snip>
      }
    ]
  },
  "didDocument": {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      {
        "@vocab": "https://www.iana.org/assignments/jose#"
      }
    ],
    "id": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0",
    "verificationMethod": [
      {
        "id": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0#0",
        "type": "JsonWebKey2020",
        "controller": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0",
        "publicKeyJwk": {
          "alg": "ES256",
          "use": "sig",
          "kty": "EC",
          "crv": "P-256",
          "x": "wdIEmfjmaZiGsub9Hffnhbr0xVVVmVLiUYLscgRt-3Y",
          "y": "ept3ke4SslZb7ZbweWKmSaM3166ZuvecZ9ciKs6PDcw",
          "kid": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0#0"
        }
      }
    ],
    "assertionMethod": [
      "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0#0"
    ],
    "authentication": [
      "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0#0"
    ],
    "capabilityInvocation": [
      "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0#0"
    ],
    "capabilityDelegation": [
      "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0#0"
    ]
  },
  "didResolutionResult": {
    "didDocumentMetadata": {},
    "didResolutionMetadata": {
      "contentType": "application/did+ld+json",
      "pattern": "^(did:jwk:.+)$",
      "did": {
        "didString": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0",
        "methodSpecificId": "eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0",
        "method": "jwk"
      }
    }
  },
  "didParsed": {
    "did": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0",
    "method": "jwk",
    "id": "eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0",
    "didUrl": "did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4Ijoid2RJRW1mam1hWmlHc3ViOUhmZm5oYnIweFZWVm1WTGlVWUxzY2dSdC0zWSIsInkiOiJlcHQza2U0U3NsWmI3WmJ3ZVdLbVNhTTMxNjZadXZlY1o5Y2lLczZQRGN3In0"
  }
}
```

### X.509 Certificate Chains

You can provide an optional verification time as well using a Date as value. By default the X5C will be fully verified,
unless the verification param is set to false.

```typescript
const sphereonCA = 'PEM or DER CERT'
const sphereonTest = 'PEM or DER CERT'

let resolution = await agent.identifierExternalResolve({
  identifier: [sphereonTest, sphereonCA],
  trustAnchors: [sphereonCA],
})

// This is the same as above, but with the benefit of having fully typed response, instead of a union
resolution = await agent.identifierExternalResolveByX5c({
  identifier: [sphereonTest, sphereonCA],
  trustAnchors: [sphereonCA],
})

console.log(JSON.stringify(resolution, null, 2))
```

```json
{
  "method": "x5c",
  "verificationResult": {
    "error": false,
    "critical": false,
    "message": "Certificate chain was valid",
    "verificationTime": "2024-08-13T13:28:16.457Z",
    "certificateChain": [
      {
        "issuer": {
          "dn": {
            "DN": "C=NL,O=Sphereon International B.V.,OU=IT,CN=ca.sphereon.com",
            "attributes": {
              "C": "NL",
              "O": "Sphereon International B.V.",
              "OU": "IT",
              "CN": "ca.sphereon.com"
            }
          }
        },
        "subject": {
          "dn": {
            "DN": "CN=test123.test.sphereon.com",
            "attributes": {
              "CN": "test123.test.sphereon.com"
            }
          }
        },
        "publicKeyJWK": {
          "key_ops": ["verify"],
          "ext": true,
          "kty": "EC",
          "x": "pyVHVR7IdgWmG_TLb3-K_4dg3XC6GQQWDB61Lna15ns",
          "y": "OcVNCBD0kMmqEaKjbczwd2GvbV1AOxgE7AKsa3L0zxM",
          "crv": "P-256"
        },
        "notBefore": "2024-08-06T20:16:12.000Z",
        "notAfter": "2024-11-04T22:16:12.000Z"
      },
      {
        "issuer": {
          "dn": {
            "DN": "C=NL,O=Sphereon International B.V.,OU=IT,CN=ca.sphereon.com",
            "attributes": {
              "C": "NL",
              "O": "Sphereon International B.V.",
              "OU": "IT",
              "CN": "ca.sphereon.com"
            }
          }
        },
        "subject": {
          "dn": {
            "DN": "C=NL,O=Sphereon International B.V.,OU=IT,CN=ca.sphereon.com",
            "attributes": {
              "C": "NL",
              "O": "Sphereon International B.V.",
              "OU": "IT",
              "CN": "ca.sphereon.com"
            }
          }
        },
        "publicKeyJWK": {
          "key_ops": ["verify"],
          "ext": true,
          "kty": "EC",
          "x": "SIDQp4RJI2s5yYIOBrxiwGRROCjBkbCq8vaf3UlSkAw",
          "y": "dRSwvlVFdqdiLXnk2pQqT1vZnDG0I-x-iz2EbdsG0aY",
          "crv": "P-256"
        },
        "notBefore": "2024-07-28T21:26:49.000Z",
        "notAfter": "2034-07-28T21:26:49.000Z"
      }
    ]
  },
  "issuerJWK": {
    "key_ops": ["verify"],
    "ext": true,
    "kty": "EC",
    "x": "pyVHVR7IdgWmG_TLb3-K_4dg3XC6GQQWDB61Lna15ns",
    "y": "OcVNCBD0kMmqEaKjbczwd2GvbV1AOxgE7AKsa3L0zxM",
    "crv": "P-256"
  },
  "jwks": [
    {
      "jwk": {
        "key_ops": ["verify"],
        "ext": true,
        "kty": "EC",
        "x": "pyVHVR7IdgWmG_TLb3-K_4dg3XC6GQQWDB61Lna15ns",
        "y": "OcVNCBD0kMmqEaKjbczwd2GvbV1AOxgE7AKsa3L0zxM",
        "crv": "P-256"
      },
      "kid": "CN=test123.test.sphereon.com",
      "jwkThumbprint": "LlITYB6tlvSVtVrMtIEzrkkSQkMSoPslhQ3Rnk1x484"
    },
    {
      "jwk": {
        "key_ops": ["verify"],
        "ext": true,
        "kty": "EC",
        "x": "SIDQp4RJI2s5yYIOBrxiwGRROCjBkbCq8vaf3UlSkAw",
        "y": "dRSwvlVFdqdiLXnk2pQqT1vZnDG0I-x-iz2EbdsG0aY",
        "crv": "P-256"
      },
      "kid": "C=NL,O=Sphereon International B.V.,OU=IT,CN=ca.sphereon.com",
      "jwkThumbprint": "1wAefk4zZ8Q8cM-9djHoJhPUtKjVFLqG7u9VftVqulA"
    }
  ],
  "x5c": [
    "MIIC1jCCAnygAwIBAgITALtvb+InWBtzJO3mAeQZIUBXbzAKBggqhkjOPQQDAjBaMQswCQYDVQQGEwJOTDEkMCIGA1UECgwbU3BoZXJlb24gSW50ZXJuYXRpb25hbCBCLlYuMQswCQYDVQQLDAJJVDEYMBYGA1UEAwwPY2Euc3BoZXJlb24uY29tMB4XDTI0MDgwNjIwMTYxMloXDTI0MTEwNDIyMTYxMlowJDEiMCAGA1UEAwwZdGVzdDEyMy50ZXN0LnNwaGVyZW9uLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABKclR1UeyHYFphv0y29/iv+HYN1wuhkEFgwetS52teZ7OcVNCBD0kMmqEaKjbczwd2GvbV1AOxgE7AKsa3L0zxOjggFVMIIBUTAdBgNVHQ4EFgQUoWVOwL15ttB1YPUd0HgvYry0Z+UwHwYDVR0jBBgwFoAU5wfKXZVc+cig/s7jZEUegLMsMsEwYQYIKwYBBQUHAQEEVTBTMFEGCCsGAQUFBzAChkVodHRwOi8vZXUuY2VydC5lemNhLmlvL2NlcnRzL2RhYTFiNGI0LTg1ZmQtNGJhNC1iOTZiLTMzMmFkZDg5OWNlOS5jZXIwEwYDVR0lBAwwCgYIKwYBBQUHAwIwJAYDVR0RBB0wG4IZdGVzdDEyMy50ZXN0LnNwaGVyZW9uLmNvbTAOBgNVHQ8BAf8EBAMCB4AwYQYDVR0fBFowWDBWoFSgUoZQaHR0cDovL2V1LmNybC5lemNhLmlvL2NybC8yY2RmN2M1ZS1iOWNkLTQzMTctYmI1Ni0zODZkMjQ0MzgwZTIvY2FzcGhlcmVvbmNvbS5jcmwwCgYIKoZIzj0EAwIDSAAwRQIgThuggyhKePvRt5YEvfg6MD42N2/63L0ypw0vLZkM+zYCIQD+uInjqsfR6K/D+ebjuOAdhOyeD2nZAW29zN20WIQJsw==",
    "MIICCDCCAa6gAwIBAgITAPMgqwtYzWPBXaobHhxG9iSydTAKBggqhkjOPQQDAjBaMQswCQYDVQQGEwJOTDEkMCIGA1UECgwbU3BoZXJlb24gSW50ZXJuYXRpb25hbCBCLlYuMQswCQYDVQQLDAJJVDEYMBYGA1UEAwwPY2Euc3BoZXJlb24uY29tMB4XDTI0MDcyODIxMjY0OVoXDTM0MDcyODIxMjY0OVowWjELMAkGA1UEBhMCTkwxJDAiBgNVBAoMG1NwaGVyZW9uIEludGVybmF0aW9uYWwgQi5WLjELMAkGA1UECwwCSVQxGDAWBgNVBAMMD2NhLnNwaGVyZW9uLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABEiA0KeESSNrOcmCDga8YsBkUTgowZGwqvL2n91JUpAMdRSwvlVFdqdiLXnk2pQqT1vZnDG0I+x+iz2EbdsG0aajUzBRMB0GA1UdDgQWBBTnB8pdlVz5yKD+zuNkRR6AsywywTAOBgNVHQ8BAf8EBAMCAaYwDwYDVR0lBAgwBgYEVR0lADAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIHH7ie1OAAbff5262rzZVQa8J9zENG8AQlHHFydMdgaXAiEA1Ib82mhHIYDziE0DDbHEAXOs98al+7dpo8fPGVGTeKI="
  ]
}
```

### Installation

```shell
pnpm add @sphereon/ssi-sdk-ext.identifier-resolution
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
