# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.29.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.28.0...v0.29.0) (2025-05-22)

### Bug Fixes

- Add missing key type lookup for EcdsaSecp256k1RecoveryMethod2020 ([3b45295](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/3b452950a62a171d157338cab2634c4a5371409c))
- commonjs import ([0824bc3](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/0824bc3742682b422936cc413ed1b2b509998b78))
- Make sure we always compare RSA keys as raw keys, as they can be expressed as raw, or as X.509 keys ([d413275](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/d41327554c8ad92fdd214e3aa6832218384f265f))
- oidf client ([24ca549](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/24ca549841533d8ae29184b42dc92a416bdb246d))
- oidf imports ([52b2065](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/52b2065fb8793c613c9971acc843decd6fc29685))
- RSA related signature creation and validation fixes ([1aa66d6](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/1aa66d64d3e4050f5bc798f6f903f7aa64246d72))

### Features

- Ensure OYD now also is build as esm and cjs module and uses vitest for testing ([3b27367](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/3b273671c2d2dc6b6d992ab65698c606c7f1b676))
- move to esm-js ([bcd26c1](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/bcd26c1d8e790a9f71aa5aed96509db99bf9c500))
- move to vitest ([558ed35](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/558ed35c895fa6c473da1ef7612e1cb9fe121cfe))

# [0.28.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.27.0...v0.28.0) (2025-03-14)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.key-utils

# [0.27.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.26.0...v0.27.0) (2024-12-05)

### Bug Fixes

- Move away from using crypto.subtle for signature verifications, as it is too problematic in React-native. Replaced with audited noble implementations ([69ec9a6](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/69ec9a68a655eb34060a70ba64d83ef0df770bac))
- update x.509 test with latest cert ([175cd80](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/175cd8041e4b7f8c761b5519d44ec0602e2be88c))

### Features

- make sure we convert JWK claims from base64 to base64url if they are not spec compliant ([918677b](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/918677bc9cf062c0eff7d6eec5e83ee50d47f4e7))

# [0.26.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.25.0...v0.26.0) (2024-11-26)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.key-utils

# [0.25.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.24.0...v0.25.0) (2024-10-28)

### Bug Fixes

- added @trust/keyto to dependencies of key-utils ([bc5d6f6](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/bc5d6f68f74d8206794c611d5f9616a1f99bc822))
- added @trust/keyto to dependencies of key-utils ([6bb8d9e](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/6bb8d9eda667782b6fec8defd100a0b5ae2de852))
- reverted dependency update of ssi-types in key-utils module ([1741bda](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/1741bda55fad424c52b96fbba0e81da384e8777d))

### Features

- Add JWS signature verification; Add cose key conversions and resolution (managed and external) ([9f76393](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/9f7639322d825bd7ec0a276adfb6ab4a934fc571))
- Added x509 validateX5cCertificateChain & validatePEMCertificateChain functions ([3706e31](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/3706e313c95bb26ee397c3fff6034e31a537b563))
- External resolution of keys and validations for DIDs and x5c ([01db327](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/01db32715f7e7a95b57e07c23b7f3cc5b6ffa578))
- Have a method on the Key Management System as well as a separate function to get a named or the default KMS. Remove dep/enum for kms local. We only have KMSs names at runtime. We should not rely on static KMS names ever! ([c0ca69f](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/c0ca69fe0f10cfd9cdafa94b7af31a6cf6100680))
- New JWS signature service that makes use of the managed identifier resolution, allowing for easier and more flexible JWT signing. ([941996e](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/941996ea69fc042680b29d39667b92b56690887f))

### Reverts

- Revert "chore: Allow default values for kms as kms is not optional in Veramo APIs" ([708742c](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/708742c013bc9e8cff9217e1eaff746ae0f8af00))

# [0.24.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.23.0...v0.24.0) (2024-08-01)

### Bug Fixes

- Fix key usages for jwks when importing keys ([c473572](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/c473572dc14105fec4626f596b21aebf180079da))

### Features

- remove isomorphic-webcrypto ([1adc1fe](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/1adc1fee3a80c4b7df69eca46e5c7469d6ce9f71))

# [0.23.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.22.0...v0.23.0) (2024-07-23)

### Features

- generate key when private keys is not provided ([090b8fa](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/090b8fa20ee4aa2da4ca68a3b1bbe9bd00925cc0))

# [0.22.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.21.0...v0.22.0) (2024-07-02)

### Bug Fixes

- our exported JWK depended on another lib, which is not needed. Also was not compatible with Jose, which is heavily used ([8b20d61](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/8b20d616c87a350a42d72bf98ab13311e8f248ee))
- x5c is an array in a JWK ([58f607f](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/58f607f82194afe1907e0d13909f1fbd9bff7d7f))

# [0.21.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.20.0...v0.21.0) (2024-06-19)

### Bug Fixes

- Multiple DID EBSI fixes ([131faa0](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/131faa0b583063cb3d8d5e77a33f337a23b90536))

# [0.20.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.19.0...v0.20.0) (2024-06-13)

### Bug Fixes

- fix base64url sanitizing ([473c028](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/473c0281e8c24565bb0ada0d335d32014453294d))

# [0.19.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.18.2...v0.19.0) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.key-utils

## [0.18.2](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.18.1...v0.18.2) (2024-04-24)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.key-utils

## [0.18.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.18.0...v0.18.1) (2024-04-04)

### Bug Fixes

- Padding had incorrect length comparison ([d141050](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/d141050b31bd1b846a2f5471a2e9673895e1239b))

# [0.18.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.0...v0.18.0) (2024-03-19)

### Bug Fixes

- Make sure secp256k1 keys are compressed ([15493c1](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/15493c1b310c34bb70f6140c26819252e1b7b697))

# [0.17.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.16.0...v0.17.0) (2024-02-29)

### Bug Fixes

- Make sure we are more strict on hex key lengths for Secp256r1/k1 ([2f5bf1f](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2f5bf1f23f7956bc4429a5e82bda1ac167842344))

# [0.16.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.0...v0.16.0) (2024-01-13)

### Bug Fixes

- did:key ebsi / jcs codec value was wrong ([a71279e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/a71279e3b79bff4add9fa4c889459264419accc6))

### Features

- Add private key to JWK support for Secp256k/r1 ([f278967](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f2789670fb2dcae8f07c38c5a92eeae2eb9780d0))

# [0.15.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.1...v0.15.0) (2023-09-30)

### Features

- check whether resolution is configured properly ([01a693b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/01a693b94cd612826312168973caf15b0441ebf0))

## [0.14.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.0...v0.14.1) (2023-09-28)

### Bug Fixes

- decompress comppressed secp256k1 keys when creating JWK ([e3c4771](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/e3c47715c8d751bc2ec75bdd1ed1e4965650c947))
- decompress comppressed secp256k1 keys when creating JWK ([bcdd47c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/bcdd47c0526236cf1b7c3533a7047ebb23204a66))
- decompress comppressed secp256k1 keys when creating JWK ([31bacfb](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/31bacfb4c04e9b4363a4ef6e4e71a8cf7c1daced))
- public key mapping updates, fixing ed25519 with multibase encoding ([489d4f2](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/489d4f20e0f354eb50b1a16a91472d4e85588113))

# [0.14.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.13.0...v0.14.0) (2023-08-09)

### Bug Fixes

- RSA import fixes ([1e78d70](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/1e78d70679ce8a70d82d2b7320c6f7489ff1a870))
- RSA import fixes ([77704a2](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/77704a2064e1c1d3ffc23e580ddbb36063fc70ae))
- RSA import fixes ([52c560b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/52c560b4d4fef999554ec00130cf7136dc2db1c6))

### Features

- Add verification functions to KMS (only RSA for now) ([8f58f23](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/8f58f2308bc0dd612d1bb47b5ae05e8b67cf2efb))

# [0.13.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.12.1...v0.13.0) (2023-07-30)

### Features

- Add agent resolver method ([3c7b21e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/3c7b21e13538fac64581c0c73d0450ef6e9b56f0))
- Add support for RSA key generation and RSA to JWK ([75ba154](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/75ba154bb110a50a1892a5308627895a93f527a4))

## [0.12.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.12.0...v0.12.1) (2023-06-24)

### Bug Fixes

- Fix EC handling for JWKs ([9061e29](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/9061e2968005931127c52febbb3326fddcd62fb2))
- Fix EC handling for JWKs ([dd423f2](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/dd423f24eff5fcc41a3b72c15d62d7e478fbe9b9))
- Fixes in JWK handling ([f5cd4dd](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f5cd4ddd4f0cd0f155dcbf3a7e8b43c89b97cacb))
- Make sure we set the saltLength for RSA PSS ([e19ed6c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/e19ed6c3a7b8454e8074111d33fc59a9c6bcc611))

# [0.12.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.11.0...v0.12.0) (2023-05-07)

### Features

- Move mnemonic seed generator to crypto extensions ([748a7f9](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/748a7f962d563c60aa543c0c6900aa0c0daea42d))

# [0.11.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.10.2...v0.11.0) (2023-04-30)

### Features

- add key utils package for common key functions ([0543254](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0543254d14b4ba54adeeab944315db5ba6221d47))

# [0.9.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.8.0...v0.9.0) (2023-03-09)

### Features

- add Alg support to DID:JWK. Although optional in reality several external systems expect it to be present ([12dae72](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/12dae72860fd0dc00e96a8121b136c2195843388))
- Add support for ES256/Secp256r1 DID JWKs ([1e447a6](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/1e447a6fedab92549d8848a13212e9dd8c75274a))
- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))

# Change Log
