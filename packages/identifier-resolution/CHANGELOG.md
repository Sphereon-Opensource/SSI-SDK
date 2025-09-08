# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.29.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.28.0...v0.29.0) (2025-05-22)

### Bug Fixes

- commonjs import ([0824bc3](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/0824bc3742682b422936cc413ed1b2b509998b78))
- Ensure we also do offline did resolution in case a managed DID is being resolved using the identifier resolution service ([7210d74](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/7210d74b296b2fdf38d4a4a3e3ad7cfc582b3358))
- oidf client ([24ca549](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/24ca549841533d8ae29184b42dc92a416bdb246d))
- oidf imports ([52b2065](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/52b2065fb8793c613c9971acc843decd6fc29685))
- plugin schemas ([5e3162c](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/5e3162cbeae5490acb70e1a7393d14c56fecc776))
- plugin schemas ([2798b8a](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/2798b8a20a75f69f89c712d3b72f4a968185cdd9))

### Features

- Ensure OYD now also is build as esm and cjs module and uses vitest for testing ([3b27367](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/3b273671c2d2dc6b6d992ab65698c606c7f1b676))
- move to esm-js ([bcd26c1](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/bcd26c1d8e790a9f71aa5aed96509db99bf9c500))
- move to vitest ([558ed35](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/558ed35c895fa6c473da1ef7612e1cb9fe121cfe))

# [0.28.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.27.0...v0.28.0) (2025-03-14)

### Bug Fixes

- Fixed jwt decoding ([8c2ba79](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/8c2ba7951e23650a8b2df0a20db13109357fc284))
- Fixed jwt type ([67b5af1](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/67b5af10a1af66aaa03c225c0303cd323a2d5c80))
- merging issue ([f1862bf](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/f1862bf57b3488fffaad2222174ed6927e5e3a05))
- potential undefined idOpts in legacy conversion ([7161cdc](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/7161cdca6d24315f01b785ed437edb27ef49f0f3))

### Features

- Improve managed kid resolution in case we encounter a DID ([83d966d](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/83d966d3b3b7a873f2c6aad441c05f32b16cc272))

# [0.27.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.26.0...v0.27.0) (2024-12-05)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.identifier-resolution

# [0.26.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.25.0...v0.26.0) (2024-11-26)

### Bug Fixes

- Add support for P-384/521 external JWKs ([7f4a809](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/7f4a8090121ee2aedae64af06ccc42e7b069bd6b))

# [0.25.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.24.0...v0.25.0) (2024-10-28)

### Features

- Add JWS signature verification; Add cose key conversions and resolution (managed and external) ([9f76393](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/9f7639322d825bd7ec0a276adfb6ab4a934fc571))
- Add support for setting or inferring kid and issuer. Which will be handy for JWS signing. Also split managed functions into separate functions, like we do for the external identifier resolution. ([c17edaf](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/c17edaf8f7fa14a0a998d7ea5b5370e5014dbc0b))
- Add support to convert any identifier resolution to JWK and Key resolution ([60da6b8](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/60da6b8eefe5f2a07af102eae64902b81256b089))
- added managed issuer identifier resolution ([d5ca58e](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/d5ca58e02c86702ed8f18374d65b78cd337dd7c2))
- Allow main managed identifier get method to be lazy when a resolved identifier is passed in ([28fb763](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/28fb763f611e845d64342c8f726cea9fd38bd95e))
- Allow main managed identifier get method to be lazy when a resolved identifier is passed in ([7d4fa81](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/7d4fa81b44cfae44a23339125076bf825503b887))
- Expose managed identifier lazy result method, as we are using lazy resolution more and more ([b2c8065](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/b2c80655b05eec627f2f3d957cece1b6468375cf))
- External resolution of keys and validations for DIDs and x5c ([01db327](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/01db32715f7e7a95b57e07c23b7f3cc5b6ffa578))
- New JWS signature service that makes use of the managed identifier resolution, allowing for easier and more flexible JWT signing. ([941996e](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/941996ea69fc042680b29d39667b92b56690887f))

# [0.24.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.0...v0.24.0) (2024-08-01)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

# [0.23.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.22.0...v0.23.0) (2024-07-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

# [0.22.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.0...v0.22.0) (2024-07-02)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

# [0.21.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.20.0...v0.21.0) (2024-06-19)

### Bug Fixes

- Multiple DID EBSI fixes ([131faa0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/131faa0b583063cb3d8d5e77a33f337a23b90536))

# [0.20.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.19.0...v0.20.0) (2024-06-13)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

# [0.19.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.2...v0.19.0) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

## [0.18.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.1...v0.18.2) (2024-04-24)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

## [0.18.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.0...v0.18.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

# [0.18.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.0...v0.18.0) (2024-03-19)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

# [0.17.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.16.0...v0.17.0) (2024-02-29)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

# [0.16.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.16.0) (2024-01-13)

### Bug Fixes

- did:key ebsi / jcs codec value was wrong ([a71279e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a71279e3b79bff4add9fa4c889459264419accc6))

# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.mnemonic-seed-manager

## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-09-28)

### Bug Fixes

- public key mapping updates, fixing ed25519 with multibase encoding ([489d4f2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/489d4f20e0f354eb50b1a16a91472d4e85588113))

# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-08-09)

### Bug Fixes

- RSA import fixes ([77704a2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/77704a2064e1c1d3ffc23e580ddbb36063fc70ae))

# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.1...v0.13.0) (2023-07-30)

### Features

- Add agent resolver method ([3c7b21e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3c7b21e13538fac64581c0c73d0450ef6e9b56f0))

## [0.12.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.12.1) (2023-06-24)

### Bug Fixes

- Make sure we set the saltLength for RSA PSS ([e19ed6c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e19ed6c3a7b8454e8074111d33fc59a9c6bcc611))

# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-05-07)

### Features

- Move mnemonic seed generator to crypto extensions ([748a7f9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/748a7f962d563c60aa543c0c6900aa0c0daea42d))
- Move mnemonic seed generator to crypto extensions ([173ef88](https://github.com/Sphereon-Opensource/SSI-SDK/commit/173ef883deafa4c87f0d589963fb36ccb8789d1b))

# [0.10.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.9.0...v0.10.0) (2023-04-30)

### Bug Fixes

- bbs+ fixes and updates ([ae9e903](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ae9e9032b23036d44b3791da416229cd6db5b776))
- cleanup package.json files ([0cc08b6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0cc08b6acc168b838bff48b42fdabbdea4cd0899))

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Features

- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/ssi-sdk-mnemonic-seed-manager

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

### Features

- Add migration support to mnemonic seed manager plugin. Fix some entity props in the process ([f7641f4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f7641f4f56ebe99894ddad6c6827681406d21d2e))

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/ssi-sdk-mnemonic-seed-manager

# [0.5.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.4.0...v0.5.0) (2022-02-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-mnemonic-seed-manager

# [0.4.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.4...v0.4.0) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk-mnemonic-seed-manager

## [0.3.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.3...v0.3.4) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk-mnemonic-seed-manager

## [0.3.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package @sphereon/ssi-sdk-mnemonic-seed-manager

# [0.3.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.2.0...v0.3.0) (2022-01-16)

**Note:** Version bump only for package @sphereon/ssi-sdk-mnemonic-seed-manager

# [0.2.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.1.0...v0.2.0) (2021-12-16)

**Note:** Version bump only for package @sphereon/ssi-sdk-mnemonic-info-generator
