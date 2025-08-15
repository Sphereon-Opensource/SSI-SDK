# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.29.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.28.0...v0.29.0) (2025-05-22)

### Bug Fixes

- commonjs import ([0824bc3](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/0824bc3742682b422936cc413ed1b2b509998b78))
- oidf client ([24ca549](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/24ca549841533d8ae29184b42dc92a416bdb246d))
- oidf imports ([52b2065](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/52b2065fb8793c613c9971acc843decd6fc29685))

### Features

- Ensure OYD now also is build as esm and cjs module and uses vitest for testing ([3b27367](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/3b273671c2d2dc6b6d992ab65698c606c7f1b676))
- move to esm-js ([bcd26c1](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/bcd26c1d8e790a9f71aa5aed96509db99bf9c500))
- move to vitest ([558ed35](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/558ed35c895fa6c473da1ef7612e1cb9fe121cfe))

# [0.28.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.27.0...v0.28.0) (2025-03-14)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-provider-key

# [0.27.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.26.0...v0.27.0) (2024-12-05)

### Bug Fixes

- add some additional tests for did:key ([59b1161](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/59b11614f67416a763b3f8eaedf0aad925666ec8))
- update x.509 test with latest cert ([175cd80](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/175cd8041e4b7f8c761b5519d44ec0602e2be88c))

# [0.26.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.25.0...v0.26.0) (2024-11-26)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-provider-key

# [0.25.0](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/compare/v0.24.0...v0.25.0) (2024-10-28)

### Bug Fixes

- applied importProvidedOrGeneratedKey in KeyDidProvider ([841a1da](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/841a1daf9ad9a3eef8cbad89ac2624c7ec253ca0))
- fixed didManagerCreate test ([b3b6756](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/b3b6756b3ba231c9721a6d104bb48c46b7dd13d4))

### Features

- Add JWS signature verification; Add cose key conversions and resolution (managed and external) ([9f76393](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/9f7639322d825bd7ec0a276adfb6ab4a934fc571))
- External resolution of keys and validations for DIDs and x5c ([01db327](https://github.com/Sphereon-OpenSource/SSI-SDK-crypto-extensions/commit/01db32715f7e7a95b57e07c23b7f3cc5b6ffa578))

# [0.24.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.0...v0.24.0) (2024-08-01)

### Bug Fixes

- Fix key usages for jwks when importing keys ([c473572](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c473572dc14105fec4626f596b21aebf180079da))

# [0.23.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.22.0...v0.23.0) (2024-07-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-provider-key

# [0.22.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.0...v0.22.0) (2024-07-02)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-provider-key

# [0.21.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.20.0...v0.21.0) (2024-06-19)

### Bug Fixes

- Multiple DID EBSI fixes ([131faa0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/131faa0b583063cb3d8d5e77a33f337a23b90536))

# [0.20.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.19.0...v0.20.0) (2024-06-13)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-provider-key

# [0.19.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.2...v0.19.0) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-provider-key

## [0.18.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.1...v0.18.2) (2024-04-24)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-provider-key

## [0.18.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.0...v0.18.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-provider-key

# [0.18.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.0...v0.18.0) (2024-03-19)

### Bug Fixes

- Key did provider fixes for invalid did:key encodings ([194c480](https://github.com/Sphereon-Opensource/SSI-SDK/commit/194c4808221ef232b0791ce04ce48459980611a2))

### Features

- Ensure proper key type is used for did:key in case codeName is JCS/EBSI ([af11a99](https://github.com/Sphereon-Opensource/SSI-SDK/commit/af11a99b0912d911e2d11fad94e7ccf02068afbd))

# [0.17.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.16.0...v0.17.0) (2024-02-29)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-provider-key

# [0.16.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.16.0) (2024-01-13)

### Bug Fixes

- did:key ebsi / jcs codec value was wrong ([a71279e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a71279e3b79bff4add9fa4c889459264419accc6))

### Features

- ebsi resolver. Add support for fallback/multiple registries, so a client isn't required to specify a registry perse ([dedd959](https://github.com/Sphereon-Opensource/SSI-SDK/commit/dedd95986debbe2822fef298b4bc91a252e64ef7))

# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-09-30)

### Features

- check whether resolution is configured properly ([01a693b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/01a693b94cd612826312168973caf15b0441ebf0))

## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-09-28)

### Bug Fixes

- public key mapping updates, fixing ed25519 with multibase encoding ([489d4f2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/489d4f20e0f354eb50b1a16a91472d4e85588113))

# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-08-09)

### Bug Fixes

- RSA import fixes ([77704a2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/77704a2064e1c1d3ffc23e580ddbb36063fc70ae))

# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.1...v0.13.0) (2023-07-30)

### Features

- Add agent resolver method ([3c7b21e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3c7b21e13538fac64581c0c73d0450ef6e9b56f0))
- Add DID web provider, with RSA and multi key import support ([8335fbe](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8335fbe16e4a7740a11e225c99afb516c305d27f))

## [0.12.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.12.1) (2023-06-24)

### Bug Fixes

- Make sure we set the saltLength for RSA PSS ([e19ed6c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e19ed6c3a7b8454e8074111d33fc59a9c6bcc611))

# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-05-07)

### Features

- Move mnemonic seed generator to crypto extensions ([748a7f9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/748a7f962d563c60aa543c0c6900aa0c0daea42d))

# [0.11.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.2...v0.11.0) (2023-04-30)

### Features

- Add EBSI LE DID Provider (does not persist into the registry yet) ([7a8cf56](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7a8cf5687152ba0a7449d93eeb40289d6af07acf))
- add ebsi v1 did driver ([8869643](https://github.com/Sphereon-Opensource/SSI-SDK/commit/88696430b671d46127d3dcff41936cbcb1a66d4c))
- add key utils package for common key functions ([0543254](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0543254d14b4ba54adeeab944315db5ba6221d47))
- Move to pnpm from yarn ([6ed9bd5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6ed9bd5fe72645364e631be1628710f57d5deb19))
- Reorganize SSI-SDK crypto extensions and DIDs ([5578914](https://github.com/Sphereon-Opensource/SSI-SDK/commit/55789146f48b31e8efdd64afa464a42779a2137b))

## [0.10.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.0...v0.10.1) (2023-03-10)

**Note:** Version bump only for package @sphereon/bls-did-provider-key

# [0.10.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.9.1...v0.10.0) (2023-03-09)

### Bug Fixes

- move to maintained isomorphic-webcrypto ([#2](https://github.com/Sphereon-Opensource/SSI-SDK/issues/2)) ([b392ca5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b392ca521b676ce2c578ab507dcc444c45881033))

### Features

- Add RSA support ([6bbd283](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6bbd283e82ee33a11feb8ad8346776d0948dcb80))

## 0.9.1 (2022-12-16)

**Note:** Version bump only for package @sphereon/bls-did-provider-key

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/bls-did-provider-key

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/bls-did-provider-key

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/bls-did-provider-key
