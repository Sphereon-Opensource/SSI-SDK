# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)


### Bug Fixes

* Update ion deps to remove problematic did-key p384 from transmute which depended on webcypto-asl which is not compatible with node >=14. ([386efc7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/386efc71b18195004773fc74eb51b62cd3f5dd76))


### Features

* add Microsoft Request Service API support ([251ed60](https://github.com/Sphereon-Opensource/SSI-SDK/commit/251ed60ebd6984d5fe494a764d8cd662dd0eba6d))
* Add migration support to mnemonic seed manager plugin. Fix some entity props in the process ([f7641f4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f7641f4f56ebe99894ddad6c6827681406d21d2e))


### Reverts

* Revert "MYC-184 Update main Version change 0.5.1 -> 0.5.2" ([b1b8cc6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b1b8cc635ebccb07c29465df32c3d352c5798855))
* Revert "MYC-184 uncommitted changes are added" ([fb4f878](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fb4f878dc1e03b9e390a4f886cccac66841256be))





# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)


### Bug Fixes

* Fix unit tests for VC API ([f3c5eea](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f3c5eea0cf6a020c5885b2c9d6104694ded9d0e5))
* fixed and refactored some pr notes ([2ff95b9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2ff95b9010d24b9439fbb6918f0ac4d8663827a7))
* tests are now using env variables ([9cb6ec2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9cb6ec2589d9e443fb144ca5fe5420cc7c84dd9c))


### Features

* Add custom DID resolver support ([45cea11](https://github.com/Sphereon-Opensource/SSI-SDK/commit/45cea1182693b698611b062a9d664ad92e8dcd6a))
* Add default DID resolver support ([eebce18](https://github.com/Sphereon-Opensource/SSI-SDK/commit/eebce18bf9cc9d28a8bcdd6886100b7a8921bb2f))
* Add did resolver and method support per OpSession ([9378b45](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9378b451d4907c8d5385f464b27f858547409bb4))
* Add did resolver and method support per OpSession ([a9f7afc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a9f7afc386189ca4851ce967f5abf7db812d1003))
* Add supported DID methods ([df74ccd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/df74ccddcab06a032ca47a033a46bd0268826f72))
* Add supported DID methods ([7322265](https://github.com/Sphereon-Opensource/SSI-SDK/commit/732226544503c2bcc32bf4400da82e9154361abb))
* added piiLoggingEnabled and logLevel to optional params for clientCredential authentication ([584fb7b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/584fb7b8225198e890a484514e96279fbd642b59))
* added region to optional params for clientcredential authentication ([e21bd70](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e21bd7017a669bff0e5b6fd0c317393cac594f21))
* changed the structure of the module to be more like the ssi-core module of ours. Plus, changed some documents ([4480b3f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4480b3f33c887d92731260d5d09c8808cb5e9c13))





## [0.5.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.0...v0.5.1) (2022-02-23)

**Note:** Version bump only for package SSI-SDK-workspace





# [0.5.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.4.0...v0.5.0) (2022-02-23)


### Features

* Update waci pex implementation as it was serializing a SIOP Auth request including all options like private keys, not conforming to WACI-PEX ([90a1cba](https://github.com/Sphereon-Opensource/SSI-SDK/commit/90a1cba359b7a946951ef0d47746d01b3cbc225e))





# [0.4.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.4...v0.4.0) (2022-02-11)


### Bug Fixes

* ensure we set jsx to react ([c2a5e6f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c2a5e6f0cfb7895990fa1cc354c457fc93b640fd))


### Features

* Add WACI PEx QR generator for React ([7850e34](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7850e34ad2af58f62523a2346826d12280216d31))





## [0.3.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.3...v0.3.4) (2022-02-11)


### Bug Fixes

* fix imports ([738f4ca](https://github.com/Sphereon-Opensource/SSI-SDK/commit/738f4cafdf75c9d4831a3c31de1c0d5aff1d7285))





## [0.3.3](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.1...v0.3.3) (2022-02-10)


### Bug Fixes

* building of vc-handler-ld-local containing ts files + not copying files ([cdbfcab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cdbfcab114531947e6d0092e0bdb7bc9f818ac88))
* we imported a ts file from another package in the monorepo instead of using the module ([5d647df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5d647dffd9002ffca2a15a5c1ba56e33acec6716))





## [0.3.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.1...v0.3.2) (2022-02-04)


### Bug Fixes

* building of vc-handler-ld-local containing ts files + not copying files ([cdbfcab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cdbfcab114531947e6d0092e0bdb7bc9f818ac88))
* we imported a ts file from another package in the monorepo instead of using the module ([5d647df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5d647dffd9002ffca2a15a5c1ba56e33acec6716))





## [0.3.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package SSI-SDK-workspace





# [0.3.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.2.0...v0.3.0) (2022-01-16)


### Bug Fixes

* Add missing suites exports ([4a3b8ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a3b8ce93e36c55b3b17884e262db9d91c4459e6))
* Be a bit more relaxed when deleting an LTO DID, eventhough onchain support is not present ([7347914](https://github.com/Sphereon-Opensource/SSI-SDK/commit/73479148d6b02c194182370c14a15613dca6fcf2))
* Update test timeout for Factom ([9a934cf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9a934cfb507af3d5cc8629bb0e8f6fd70f785092))


### Features

* Add debug logging when creating VC, can be enabled by DEBUG=sphereon:ssi-sdk:ld-credential-module-local ([c0df2ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c0df2ce8bc67f2e407ef21b65aae6d364c47a6b9))





# [0.2.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.1.0...v0.2.0) (2021-12-16)


### Bug Fixes

* LTO DIDs use #sign for keys ([11daa98](https://github.com/Sphereon-Opensource/SSI-SDK/commit/11daa98c804232b9fad32d60afa707e86881b5bb))
* move to ES6 import for cross-fetch ([b855273](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b85527391fd2072c427dc34a69ad026b60a70be0))
* Multibase encoding didn't include the prefix char ([1be44b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1be44b7f281b82370a59a321f25057bee34d58de))
* update test to search for kid using #sign instead of #key as the LTO indexer impl changed ([fa0fae4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fa0fae43935e7c64e4d5628fb5cdd3dc8af447ce))
* workaround for bug in VeramoEd25519Signature2018 implementation ([13442eb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/13442eb417b809751133dfaf43e1fa0a703f2f80))


### Features

* Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([b4e8453](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b4e84534175c58aa7c744212099a69e852b1f299))
* Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([995f55e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/995f55efd5237e3fbd76e6569e09ee3bbcbb686c))
* Add local default contexts ([da29f02](https://github.com/Sphereon-Opensource/SSI-SDK/commit/da29f0290b21eab7d23027a7827ea967d1c3d1fa))
* Add Local JSON-LD VC and VP issuance and verification plugin ([aa1b45c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa1b45c2e118c5fb4c80b70d0544cf301b2a40c7))
* Add Mnemonic seed generation, verificaiton and secure storage ([d9a410a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d9a410a2cfd576afc885c6882e448c6d9e15f137))
* Add new ed25519 2018 signature and spec implementation using transmute's TS implementation ([ffbe876](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ffbe8760e1dc69964ba92aa0d8127274fcff61ac))
* Add proof purposes to issuance and verification methods. Add support to resolve verification methods from DID doc ([c8e7392](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c8e739227d226ac06619d20a4de0886236e05269))
* Add Self-Issued OpenID Connect and OpenID Connect for Verifiable Presentations support ([1ec1d1c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1ec1d1cacd08f12d4c21a8d72dfb51430f78deb3))
* Add suite lookup based on verification method type next to veramo key type ([5c18dc2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5c18dc2a2f61ddff213595408ad10b62a5e83476))
* Allow remote context loading ([742d3cc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/742d3ccfffb36a658e7a48b8feeb65fe3eb409e5))





# 0.1.0 (2021-11-26)


### Bug Fixes

* add missing env var for workflow for PRs ([c3198ca](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c3198ca86afb9017bdb20f5c007245fb0aed51f2))
* fix workflow env ([3acf669](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3acf6699e768b1aa64dd82fb1abd5b11110af3da))
* fix workflow for PRs ([eddad66](https://github.com/Sphereon-Opensource/SSI-SDK/commit/eddad66e9e92e5eae6a3e7ec8cf5848591a76bec))
* open handles and logging after test completes ([8cca899](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8cca899ff73c45564589c89d1635d0ba23b3e544))
* sync main into develop ([143927c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/143927c063bea8153c19cd0ee06b329632ada5b0))


### Features

* Add factom-did module ([e6e3cfb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e6e3cfb0e992df6f6caf776f0b27cfc7fe85f078))
* Add lto-did module ([236ca01](https://github.com/Sphereon-Opensource/SSI-SDK/commit/236ca0101951186b224aee51f49b3ab77148d64b))
* Add ssi-sdk core module ([42a5b65](https://github.com/Sphereon-Opensource/SSI-SDK/commit/42a5b65fa3795284fc16b06d2a36c4bf4ea87668))
* Add workspace/lerna files and structures ([2c2b112](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2c2b11244c2e5e3d2d1b1db76af3d86ec300bc72))
