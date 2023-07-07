# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- allow default opts to be set when OID4VCI is running ([7142273](https://github.com/Sphereon-Opensource/SSI-SDK/commit/71422737036c01c095459676858b754b7b10ddfd))
- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-06-21)

### Bug Fixes

- unify naming ([ec7d0b6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ec7d0b6ced54a792ede23937c7043e53d7121e42))

### Features

- Add Presentation Exchange module ([a085c81](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a085c81a2608dd072e9b2c3d49174b76dab9705a))
- Add SIOPv2OID4VP RP auth and REST module ([91b1da3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/91b1da3548fd425aa93424411339e1ec2a2e0fd3))
- More support for definition Formats when creating VPs from SIOP ([846ef0b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/846ef0b359c4ec5755d9385c5f1c6db1fb14b0c1))
- move to pnpm ([2714a9c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2714a9c786b8591de41310a83aff19f62cf65e77))

### Reverts

- Revert "chore: remove plugin schemas" ([2870d77](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2870d77a6e1919e94f554e71100fbcdb4fed47af))

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Bug Fixes

- credential mapper for jtw ([f04345b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f04345b97ff9a78a3dff096599f0b675b3239a3e))
- Fix DID handling in OP session ([926e358](https://github.com/Sphereon-Opensource/SSI-SDK/commit/926e358ef3eadf19fc3c8f7c9940fe6322c5ff85))
- Incorrect verification method id returned when signing credentials in some cases ([c508507](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c508507ddd2e35fcb377a79bad3c82d695b3d93d))
- Move parseDid method to ssi-types ([0b28de3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0b28de3de21afd0a224d3d174103e072162231ed))

### Features

- Add jwt as signature when decoding JWT VCs/VPs ([f089ac1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f089ac18dc470f0b8c581b49e70e7eba64d72bc3))
- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))
- Create VP in OP Authenticator and allow for callbacks ([0ed86d8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0ed86d8d2b655a718d7c8cf1a946e0150bf877ce))
- Make sure VP type corresponds with PEX definition ([129b663](https://github.com/Sphereon-Opensource/SSI-SDK/commit/129b66383752e05ab3067e459bff591a07aac690))
- Make sure VP type corresponds with PEX definition ([3dafa3f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3dafa3ff4c794d13eff3e2e0b6a85675667db089))
- Update SIOP OP to be in line wiht latest SIOP and also supporting late binding of identifiers ([2beea04](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2beea04a6604d82b12ecbc11e68a9f41775c22ed))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

### Features

- Add custom DID resolver support ([45cea11](https://github.com/Sphereon-Opensource/SSI-SDK/commit/45cea1182693b698611b062a9d664ad92e8dcd6a))
- Add default DID resolver support ([eebce18](https://github.com/Sphereon-Opensource/SSI-SDK/commit/eebce18bf9cc9d28a8bcdd6886100b7a8921bb2f))
- Add did resolver and method support per OpSession ([9378b45](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9378b451d4907c8d5385f464b27f858547409bb4))
- Add did resolver and method support per OpSession ([a9f7afc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a9f7afc386189ca4851ce967f5abf7db812d1003))
- Add supported DID methods ([df74ccd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/df74ccddcab06a032ca47a033a46bd0268826f72))
- Add supported DID methods ([7322265](https://github.com/Sphereon-Opensource/SSI-SDK/commit/732226544503c2bcc32bf4400da82e9154361abb))

## [0.5.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.0...v0.5.1) (2022-02-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.5.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.4.0...v0.5.0) (2022-02-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.4.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.4...v0.4.0) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

## [0.3.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.3...v0.3.4) (2022-02-11)

### Bug Fixes

- fix imports ([738f4ca](https://github.com/Sphereon-Opensource/SSI-SDK/commit/738f4cafdf75c9d4831a3c31de1c0d5aff1d7285))

## [0.3.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.3.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.2.0...v0.3.0) (2022-01-16)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.2.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.1.0...v0.2.0) (2021-12-16)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator
