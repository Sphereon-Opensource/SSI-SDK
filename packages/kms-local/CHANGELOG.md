# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.29.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.28.0...v0.29.0) (2025-05-22)

### Bug Fixes

- commonjs import ([0824bc3](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/0824bc3742682b422936cc413ed1b2b509998b78))
- oidf client ([24ca549](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/24ca549841533d8ae29184b42dc92a416bdb246d))
- oidf imports ([52b2065](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/52b2065fb8793c613c9971acc843decd6fc29685))
- plugin schemas ([2798b8a](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/2798b8a20a75f69f89c712d3b72f4a968185cdd9))
- RSA related signature creation and validation fixes ([1aa66d6](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/1aa66d64d3e4050f5bc798f6f903f7aa64246d72))

### Features

- Ensure OYD now also is build as esm and cjs module and uses vitest for testing ([3b27367](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/3b273671c2d2dc6b6d992ab65698c606c7f1b676))
- move to esm-js ([bcd26c1](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/bcd26c1d8e790a9f71aa5aed96509db99bf9c500))
- move to vitest ([558ed35](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/558ed35c895fa6c473da1ef7612e1cb9fe121cfe))

# [0.28.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.27.0...v0.28.0) (2025-03-14)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.kms-local

# [0.27.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.26.0...v0.27.0) (2024-12-05)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.kms-local

# [0.26.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.25.0...v0.26.0) (2024-11-26)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.kms-local

# [0.25.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.24.0...v0.25.0) (2024-10-28)

### Features

- Add JWS signature verification; Add cose key conversions and resolution (managed and external) ([9f76393](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/9f7639322d825bd7ec0a276adfb6ab4a934fc571))
- added calculation and querying based on jwk thumbprints ([5ce83cc](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/5ce83cca64d55b664a2b0e6eb04660d299e2655c))
- External resolution of keys and validations for DIDs and x5c ([01db327](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/01db32715f7e7a95b57e07c23b7f3cc5b6ffa578))
- Have a method on the Key Management System as well as a separate function to get a named or the default KMS. Remove dep/enum for kms local. We only have KMSs names at runtime. We should not rely on static KMS names ever! ([c0ca69f](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/c0ca69fe0f10cfd9cdafa94b7af31a6cf6100680))

# [0.24.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.0...v0.24.0) (2024-08-01)

### Bug Fixes

- **breaking:** Remove BLS crypto from Mattr for now. It is not very well maintained, and is proving to be very difficult in both Windows and React-Native environments. Will be replaced later with a different implementation ([e097e25](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e097e2502ce7baa38f78f6afd1924d989f918dea))
- Fix key usages for jwks when importing keys ([c473572](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c473572dc14105fec4626f596b21aebf180079da))

### Features

- remove isomorphic-webcrypto ([1adc1fe](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1adc1fee3a80c4b7df69eca46e5c7469d6ce9f71))

# [0.23.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.22.0...v0.23.0) (2024-07-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.kms-local

# [0.22.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.0...v0.22.0) (2024-07-02)

### Bug Fixes

- Key metadata was switched for Secp256k1 and Secp256r1 keys ([ae174aa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ae174aa833a4989f921b92f2778bbeb63d867d3b))

# [0.21.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.20.0...v0.21.0) (2024-06-19)

### Bug Fixes

- Multiple DID EBSI fixes ([131faa0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/131faa0b583063cb3d8d5e77a33f337a23b90536))

# [0.20.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.19.0...v0.20.0) (2024-06-13)

### Bug Fixes

- added a few fixes and type definitions ([7040799](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7040799e509da9546ca3c52c1a209a5a7679ac13))

### Features

- (wip) added list keys functionality. the kms-local function works but we face error on key-manager level ([bde93d3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bde93d3e4d131ac0257ae4c04671be6bce014b1e))

# [0.19.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.2...v0.19.0) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.kms-local

## [0.18.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.1...v0.18.2) (2024-04-24)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.kms-local

## [0.18.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.0...v0.18.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.kms-local

# [0.18.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.0...v0.18.0) (2024-03-19)

### Bug Fixes

- Make sure bbs-sig packages are peer deps, because of heir poor Windows and RN support ([32d6bd9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/32d6bd9c0857f431c9b7a845e73437536f2d377b))
- Make sure secp256k1 keys are compressed ([15493c1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/15493c1b310c34bb70f6140c26819252e1b7b697))

# [0.17.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.16.0...v0.17.0) (2024-02-29)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.kms-local

# [0.16.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.16.0) (2024-01-13)

### Bug Fixes

- did:key ebsi / jcs codec value was wrong ([a71279e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a71279e3b79bff4add9fa4c889459264419accc6))

# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-09-30)

### Features

- check whether resolution is configured properly ([01a693b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/01a693b94cd612826312168973caf15b0441ebf0))

## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-09-28)

### Bug Fixes

- public key mapping updates, fixing ed25519 with multibase encoding ([489d4f2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/489d4f20e0f354eb50b1a16a91472d4e85588113))

# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-08-09)

### Bug Fixes

- RSA import fixes ([77704a2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/77704a2064e1c1d3ffc23e580ddbb36063fc70ae))

### Features

- Add verification functions to KMS (only RSA for now) ([8f58f23](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8f58f2308bc0dd612d1bb47b5ae05e8b67cf2efb))

# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.1...v0.13.0) (2023-07-30)

### Features

- Add agent resolver method ([3c7b21e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3c7b21e13538fac64581c0c73d0450ef6e9b56f0))
- Add support for RSA key generation and RSA to JWK ([75ba154](https://github.com/Sphereon-Opensource/SSI-SDK/commit/75ba154bb110a50a1892a5308627895a93f527a4))

## [0.12.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.12.1) (2023-06-24)

### Bug Fixes

- Fixes in JWK handling ([f5cd4dd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f5cd4ddd4f0cd0f155dcbf3a7e8b43c89b97cacb))
- Make sure we set the saltLength for RSA PSS ([e19ed6c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e19ed6c3a7b8454e8074111d33fc59a9c6bcc611))

# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-05-07)

### Features

- Move mnemonic seed generator to crypto extensions ([748a7f9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/748a7f962d563c60aa543c0c6900aa0c0daea42d))

# [0.11.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.2...v0.11.0) (2023-04-30)

### Features

- Add 2020 ed25519 support. ([50cc65e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/50cc65e249001809c18d1ef0e2e751c8428ccc70))
- add key utils package for common key functions ([0543254](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0543254d14b4ba54adeeab944315db5ba6221d47))
- Move to pnpm from yarn ([6ed9bd5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6ed9bd5fe72645364e631be1628710f57d5deb19))
- Reorganize SSI-SDK crypto extensions and DIDs ([5578914](https://github.com/Sphereon-Opensource/SSI-SDK/commit/55789146f48b31e8efdd64afa464a42779a2137b))

## [0.10.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.1...v0.10.2) (2023-03-11)

**Note:** Version bump only for package @sphereon/bls-kms-local

## [0.10.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.0...v0.10.1) (2023-03-10)

**Note:** Version bump only for package @sphereon/bls-kms-local

# [0.10.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.9.1...v0.10.0) (2023-03-09)

### Bug Fixes

- Fix kms string used when importing keys, whilst we are already the KMS. Fix alias/kid handling for RSA keys ([20ed263](https://github.com/Sphereon-Opensource/SSI-SDK/commit/20ed26354c4fa10d1361405378acafb99d42a6ba))
- move to maintained isomorphic-webcrypto ([#2](https://github.com/Sphereon-Opensource/SSI-SDK/issues/2)) ([b392ca5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b392ca521b676ce2c578ab507dcc444c45881033))

### Features

- Add RSA support ([6bbd283](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6bbd283e82ee33a11feb8ad8346776d0948dcb80))
- fix sigs ([5c64585](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5c645857e8e7d6c24e02332d1a4183ebf0f88c44))
- make sure signature is base64url and not base64urlpad ([3b31a2f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3b31a2fb86080e7d09a343c99ac47c12753425a3))
- make sure signature is base64url and not base64urlpad ([086d280](https://github.com/Sphereon-Opensource/SSI-SDK/commit/086d280627c9ce0e9f862fb4b2577acd0bfad47c))
- make sure signature is base64url and not base64urlpad ([aba391b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aba391b900c21204f78ded098def5eb92077ef1c))
- make sure signature is base64url and not only base64 ([6a7f915](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6a7f915684cf3df1182a44870a92981fe62edfa2))
- replace jsencrypt with isomorphic-webcrypto ([4a7ca7a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a7ca7acc995d5050c159a89f2a7dee3f71e67af))

## 0.9.1 (2022-12-16)

**Note:** Version bump only for package @sphereon/bls-kms-local

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/bls-kms-local

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/bls-kms-local

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/bls-kms-local
