# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/ssi-sdk-vc-handler-ld-local

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ssi-sdk-vc-handler-ld-local

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/ssi-sdk-vc-handler-ld-local

# [0.5.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.4.0...v0.5.0) (2022-02-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-vc-handler-ld-local

# [0.4.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.4...v0.4.0) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk-vc-handler-ld-local

## [0.3.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.3...v0.3.4) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk-vc-handler-ld-local

## [0.3.3](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.1...v0.3.3) (2022-02-10)

### Bug Fixes

- building of vc-handler-ld-local containing ts files + not copying files ([cdbfcab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cdbfcab114531947e6d0092e0bdb7bc9f818ac88))
- we imported a ts file from another package in the monorepo instead of using the module ([5d647df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5d647dffd9002ffca2a15a5c1ba56e33acec6716))

## [0.3.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.1...v0.3.2) (2022-02-04)

### Bug Fixes

- building of vc-handler-ld-local containing ts files + not copying files ([cdbfcab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cdbfcab114531947e6d0092e0bdb7bc9f818ac88))
- we imported a ts file from another package in the monorepo instead of using the module ([5d647df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5d647dffd9002ffca2a15a5c1ba56e33acec6716))

## [0.3.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package @sphereon/ssi-sdk-vc-handler-ld-local

# [0.3.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.2.0...v0.3.0) (2022-01-16)

### Bug Fixes

- Add missing suites exports ([4a3b8ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a3b8ce93e36c55b3b17884e262db9d91c4459e6))

### Features

- Add debug logging when creating VC, can be enabled by DEBUG=sphereon:ssi-sdk:ld-credential-module-local ([c0df2ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c0df2ce8bc67f2e407ef21b65aae6d364c47a6b9))

# [0.2.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.1.0...v0.2.0) (2021-12-16)

### Bug Fixes

- workaround for bug in VeramoEd25519Signature2018 implementation ([13442eb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/13442eb417b809751133dfaf43e1fa0a703f2f80))

### Features

- Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([b4e8453](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b4e84534175c58aa7c744212099a69e852b1f299))
- Add local default contexts ([da29f02](https://github.com/Sphereon-Opensource/SSI-SDK/commit/da29f0290b21eab7d23027a7827ea967d1c3d1fa))
- Add new ed25519 2018 signature and spec implementation using transmute's TS implementation ([ffbe876](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ffbe8760e1dc69964ba92aa0d8127274fcff61ac))
- Add proof purposes to issuance and verification methods. Add support to resolve verification methods from DID doc ([c8e7392](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c8e739227d226ac06619d20a4de0886236e05269))
- Add suite lookup based on verification method type next to veramo key type ([5c18dc2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5c18dc2a2f61ddff213595408ad10b62a5e83476))
- Allow remote context loading ([742d3cc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/742d3ccfffb36a658e7a48b8feeb65fe3eb409e5))
