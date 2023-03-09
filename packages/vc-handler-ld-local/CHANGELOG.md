# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)


### Bug Fixes

* default contexts are not using node fs/path anymore ([5a87aa3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5a87aa3eeed588b910636b358c7d718ae74f54c9))
* default contexts are not using node fs/path anymore ([8f1b17a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8f1b17aa12014abb393f77833f4fb8b22bfc7d2b))
* default contexts are not using node fs/path anymore ([51fd687](https://github.com/Sphereon-Opensource/SSI-SDK/commit/51fd687fba69aaeda7e686d2ec6241fb4668e229))
* Disable factom tests ([099a303](https://github.com/Sphereon-Opensource/SSI-SDK/commit/099a303c93d366a3714ef57384b3793b96a8fee3))
* Fix DID handling in OP session ([926e358](https://github.com/Sphereon-Opensource/SSI-SDK/commit/926e358ef3eadf19fc3c8f7c9940fe6322c5ff85))
* Incorrect verification method id returned when signing credentials in some cases ([bdbf4ef](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bdbf4ef55e50a9d19d7998a5ceac7136034524ef))
* Incorrect verification method id returned when signing credentials in some cases ([c508507](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c508507ddd2e35fcb377a79bad3c82d695b3d93d))
* make sure cross-fetch is used to fetch ([7033a2e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7033a2e5a80935335e5ad7989f1c03850270a986))
* Make sure we follow JWS detached signing for JsonWebSignature2020 ([3da5bad](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3da5bad3a79efc42755e354e86ecedc76a2828eb))
* missing awaits for signing presentations ([518b8fc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/518b8fc82e26711bc6204d5e0d66bbf04b0844c1))
* Remove workaround for verifier missing with ed25519 key ([2e97af6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2e97af6eeab2fe0530cd12425fd6eaf72f42a012))
* RSA fixes for suite ([b163872](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b163872e14a43b3566db1413497885cb918b982b))
* RSA fixes for suite ([d6f57b8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d6f57b86b07a74e81c3949fa2663e5ab4732760f))
* RSA fixes for suite ([9eb47d1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9eb47d1147d15f87bf9e6ac8861bede21a2511dc))
* RSA fixes for suite ([834642a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/834642a3881b14195ac47f5bdd639bdaae35c7a5))
* RSA fixes for suite ([3df79ab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3df79ab1012764ac61e6f3ac910b9a91cb19f996))
* testing unimodules-core removal ([ffdc606](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ffdc606a95d43d831fa9fe2eabfacf47e62d1361))


### Features

* Add jsonwebsignature2020 context to presentations if missing ([1f3f6b5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1f3f6b5078868ad4447a6c2e60c81160d428025e))
* Add RSA support to JsonWebKey/Signature2020 ([94c0e73](https://github.com/Sphereon-Opensource/SSI-SDK/commit/94c0e73d6dbc9a95e74816131765e4961126e2c5))
* Allow supplying signer/verifier ([00892e2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/00892e2bb7fd279e2fdc3583cd132292708f71c6))
* Allow supplying signer/verifier ([625ea6f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/625ea6feb62a08d3ce013850c6de7da8d833bc35))
* Allow supplying signer/verifier ([b010d7a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b010d7ac65ba49d4e85641558ce801e1c3fea730))
* Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))
* did utils package ([d98b358](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d98b358ff7f9c787667b4bf48fd748ae9f58197a))
* Jsonweb2020 sig support ([43a3adf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/43a3adfbe683ee4040a293cc5b75d17a029d7c49))
* make sure the vc-handler-ld-local can deal with keys in JWK format ([26cff51](https://github.com/Sphereon-Opensource/SSI-SDK/commit/26cff511b345e412dc37586ef3c3c8fe678cd574))


### Reverts

* Revert "fix: make sure to explicitly depend on @digitalcredentials VC packages" ([dae695d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/dae695d9e17fb3d73bd2e264510551c060d780bb))
* Revert "fix: make sure to explicitly depend on @digitalcredentials VC packages" ([e2be77a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e2be77aed1e518049379c3c092590382d794e660))





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
