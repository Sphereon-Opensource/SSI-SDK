# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.10.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.0...v0.10.1) (2023-05-01)

**Note:** Version bump only for package SSI-SDK-workspace

# [0.10.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.9.0...v0.10.0) (2023-04-30)

### Bug Fixes

- bbs+ fixes and updates ([84c08f1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/84c08f19f2d40ba7aef0c3b5642c99fe857a2d84))
- bbs+ fixes and updates ([fc228a2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fc228a2e85d72e0e1118d71ed8ce6252f4bc273b))
- bbs+ fixes and updates ([efcbf2c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/efcbf2c6a7efc68746d2fc1873fee372cc7cc94a))
- bbs+ fixes and updates ([871cf66](https://github.com/Sphereon-Opensource/SSI-SDK/commit/871cf6669374bfd83c6c2d05608aaf502bbd9a7b))
- bbs+ fixes and updates ([ae9e903](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ae9e9032b23036d44b3791da416229cd6db5b776))
- cleanup package.json files ([aca017b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aca017b322fa302461d7a8482f4814c7fe1b0f9d))
- cleanup package.json files ([0cc08b6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0cc08b6acc168b838bff48b42fdabbdea4cd0899))
- decoded JWT VPs/VCs did not contain everything ([612b082](https://github.com/Sphereon-Opensource/SSI-SDK/commit/612b082d754eb90402160f423d939f3a6f9ec181))
- decoded JWT VPs/VCs did not contain everything ([fd7ff68](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fd7ff680bbfbfbfbf0cd4ba96948b805ac97c6dd))

### Features

- Add better internal handling of JWT proof values used in JsonLD converted credentials ([90004c5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/90004c5886cd3f645f979b5e81dfc03e3ff3b862))
- added holder role to contact types ([728c8e1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/728c8e10be5ca3f5491c3f31870bbf57975c597b))
- More support for definition Formats when creating VPs from SIOP ([61c4120](https://github.com/Sphereon-Opensource/SSI-SDK/commit/61c412015a4d1ddf2a306e05185738cdecfc535f))
- Update to v2 PEX and v0.3 SIOP packages ([80398e3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/80398e36ab53ed46ebca715570242a466c83d5db))

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Bug Fixes

- credential mapper for jtw ([f04345b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f04345b97ff9a78a3dff096599f0b675b3239a3e))
- default contexts are not using node fs/path anymore ([5a87aa3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5a87aa3eeed588b910636b358c7d718ae74f54c9))
- default contexts are not using node fs/path anymore ([8f1b17a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8f1b17aa12014abb393f77833f4fb8b22bfc7d2b))
- default contexts are not using node fs/path anymore ([51fd687](https://github.com/Sphereon-Opensource/SSI-SDK/commit/51fd687fba69aaeda7e686d2ec6241fb4668e229))
- deps ([ec062f8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ec062f8ec01de800469ef10b05b0a79a5ba5dea7))
- Disable factom tests ([099a303](https://github.com/Sphereon-Opensource/SSI-SDK/commit/099a303c93d366a3714ef57384b3793b96a8fee3))
- Fix DID handling in OP session ([926e358](https://github.com/Sphereon-Opensource/SSI-SDK/commit/926e358ef3eadf19fc3c8f7c9940fe6322c5ff85))
- fix private key hex from Pem ([0204094](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0204094e7b7fd33314a31df5d06344f54e6f6442))
- Incorrect verification method id returned when signing credentials in some cases ([bdbf4ef](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bdbf4ef55e50a9d19d7998a5ceac7136034524ef))
- Incorrect verification method id returned when signing credentials in some cases ([c508507](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c508507ddd2e35fcb377a79bad3c82d695b3d93d))
- JWT claims would overwrite the issuer object in the credential. Disable Factom tests ([f41cf64](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f41cf64790d484ad8b9721fe347e81e2153898b9))
- make sure cross-fetch is used to fetch ([7033a2e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7033a2e5a80935335e5ad7989f1c03850270a986))
- Make sure we follow JWS detached signing for JsonWebSignature2020 ([3da5bad](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3da5bad3a79efc42755e354e86ecedc76a2828eb))
- missing awaits for signing presentations ([518b8fc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/518b8fc82e26711bc6204d5e0d66bbf04b0844c1))
- Move parseDid method to ssi-types ([0b28de3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0b28de3de21afd0a224d3d174103e072162231ed))
- QR code testing. Remove enzyme as it is not compatible with React 18 ([62debd9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/62debd972f51a3f1ad90e922115eed4c2f56cefb))
- Remove non dev dep on veramo-core ([8cb8efe](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8cb8efec1fc97581640a8254fe412abc8fea4305))
- Remove workaround for verifier missing with ed25519 key ([2e97af6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2e97af6eeab2fe0530cd12425fd6eaf72f42a012))
- RSA fixes for suite ([b163872](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b163872e14a43b3566db1413497885cb918b982b))
- RSA fixes for suite ([d6f57b8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d6f57b86b07a74e81c3949fa2663e5ab4732760f))
- RSA fixes for suite ([9eb47d1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9eb47d1147d15f87bf9e6ac8861bede21a2511dc))
- RSA fixes for suite ([834642a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/834642a3881b14195ac47f5bdd639bdaae35c7a5))
- RSA fixes for suite ([3df79ab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3df79ab1012764ac61e6f3ac910b9a91cb19f996))
- testing unimodules-core removal ([ffdc606](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ffdc606a95d43d831fa9fe2eabfacf47e62d1361))
- Tests to allow multiple subjects for credentials ([5e407ac](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5e407accd822ccb099677876df192e850b17ccd1))
- Tests to allow multiple subjects for credentials ([52b1662](https://github.com/Sphereon-Opensource/SSI-SDK/commit/52b1662c9f7dc911f7f67d2e56a0b86cb7535c8c))
- Tests to allow multiple subjects for credentials ([110d78e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/110d78e29304a230359e30d6ae54cdf2cfe10882))

### Features

- add Alg support to DID:JWK. Although optional in reality several external systems expect it to be present ([12dae72](https://github.com/Sphereon-Opensource/SSI-SDK/commit/12dae72860fd0dc00e96a8121b136c2195843388))
- Add jsonwebsignature2020 context to presentations if missing ([1f3f6b5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1f3f6b5078868ad4447a6c2e60c81160d428025e))
- Add jwt as signature when decoding JWT VCs/VPs ([f089ac1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f089ac18dc470f0b8c581b49e70e7eba64d72bc3))
- Add RSA support to JsonWebKey/Signature2020 ([94c0e73](https://github.com/Sphereon-Opensource/SSI-SDK/commit/94c0e73d6dbc9a95e74816131765e4961126e2c5))
- Add support for ES256/Secp256r1 DID JWKs ([1e447a6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1e447a6fedab92549d8848a13212e9dd8c75274a))
- allow existing did document for mapping ([5f183ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5f183ce655a40332a65480634b356ae8fa4d7a84))
- allow existing did document for mapping ([4d82518](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4d82518653ff456383561c22870856f110976aa0))
- Allow multiple subjects for credentials ([6300ccc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6300ccc4db803e76abeeafb489374120b983af71))
- Allow supplying signer/verifier ([00892e2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/00892e2bb7fd279e2fdc3583cd132292708f71c6))
- Allow supplying signer/verifier ([625ea6f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/625ea6feb62a08d3ce013850c6de7da8d833bc35))
- Allow supplying signer/verifier ([b010d7a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b010d7ac65ba49d4e85641558ce801e1c3fea730))
- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))
- Create VP in OP Authenticator and allow for callbacks ([0ed86d8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0ed86d8d2b655a718d7c8cf1a946e0150bf877ce))
- did utils package ([d98b358](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d98b358ff7f9c787667b4bf48fd748ae9f58197a))
- Jsonweb2020 sig support ([43a3adf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/43a3adfbe683ee4040a293cc5b75d17a029d7c49))
- make sure the vc-handler-ld-local can deal with keys in JWK format ([26cff51](https://github.com/Sphereon-Opensource/SSI-SDK/commit/26cff511b345e412dc37586ef3c3c8fe678cd574))
- Make sure VP type corresponds with PEX definition ([129b663](https://github.com/Sphereon-Opensource/SSI-SDK/commit/129b66383752e05ab3067e459bff591a07aac690))
- Make sure VP type corresponds with PEX definition ([3dafa3f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3dafa3ff4c794d13eff3e2e0b6a85675667db089))
- New QR code provider plugin. Can generate both SIOPv2 and DIDCommv2 OOB QRs. Support for text generation and React QR codes as SVG ([d40ba75](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d40ba75600b3dadd07bff6ecc423000023f3d958))
- Update SIOP OP to be in line wiht latest SIOP and also supporting late binding of identifiers ([2beea04](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2beea04a6604d82b12ecbc11e68a9f41775c22ed))

### Reverts

- Revert "fix: make sure to explicitly depend on @digitalcredentials VC packages" ([dae695d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/dae695d9e17fb3d73bd2e264510551c060d780bb))
- Revert "fix: make sure to explicitly depend on @digitalcredentials VC packages" ([e2be77a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e2be77aed1e518049379c3c092590382d794e660))
- Revert "fix: deps" ([5b0df98](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5b0df989ec25ac49a2f413021693d6fae7ff9c3c))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

### Bug Fixes

- Remove most deps from ssi-sdk-core to prevent circular deps ([b4151a9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b4151a9cde3e5e5dcabb32367e7a6b6ab99cb6cd))

### Features

- Add support for update and recovery keys ([85bcf7e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bcf7e0ebc08d1c15540bfef1c7a237dba7811b))
- Create common SSI types package ([0fdc372](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0fdc3722e3bc47ac13c3c586535937fa1ebe6f68))

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

### Bug Fixes

- Update ion deps to remove problematic did-key p384 from transmute which depended on webcypto-asl which is not compatible with node >=14. ([386efc7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/386efc71b18195004773fc74eb51b62cd3f5dd76))

### Features

- add Microsoft Request Service API support ([251ed60](https://github.com/Sphereon-Opensource/SSI-SDK/commit/251ed60ebd6984d5fe494a764d8cd662dd0eba6d))
- Add migration support to mnemonic seed manager plugin. Fix some entity props in the process ([f7641f4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f7641f4f56ebe99894ddad6c6827681406d21d2e))

### Reverts

- Revert "MYC-184 Update main Version change 0.5.1 -> 0.5.2" ([b1b8cc6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b1b8cc635ebccb07c29465df32c3d352c5798855))
- Revert "MYC-184 uncommitted changes are added" ([fb4f878](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fb4f878dc1e03b9e390a4f886cccac66841256be))

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

### Bug Fixes

- Fix unit tests for VC API ([f3c5eea](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f3c5eea0cf6a020c5885b2c9d6104694ded9d0e5))
- fixed and refactored some pr notes ([2ff95b9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2ff95b9010d24b9439fbb6918f0ac4d8663827a7))
- tests are now using env variables ([9cb6ec2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9cb6ec2589d9e443fb144ca5fe5420cc7c84dd9c))

### Features

- Add custom DID resolver support ([45cea11](https://github.com/Sphereon-Opensource/SSI-SDK/commit/45cea1182693b698611b062a9d664ad92e8dcd6a))
- Add default DID resolver support ([eebce18](https://github.com/Sphereon-Opensource/SSI-SDK/commit/eebce18bf9cc9d28a8bcdd6886100b7a8921bb2f))
- Add did resolver and method support per OpSession ([9378b45](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9378b451d4907c8d5385f464b27f858547409bb4))
- Add did resolver and method support per OpSession ([a9f7afc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a9f7afc386189ca4851ce967f5abf7db812d1003))
- Add supported DID methods ([df74ccd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/df74ccddcab06a032ca47a033a46bd0268826f72))
- Add supported DID methods ([7322265](https://github.com/Sphereon-Opensource/SSI-SDK/commit/732226544503c2bcc32bf4400da82e9154361abb))
- added piiLoggingEnabled and logLevel to optional params for clientCredential authentication ([584fb7b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/584fb7b8225198e890a484514e96279fbd642b59))
- added region to optional params for clientcredential authentication ([e21bd70](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e21bd7017a669bff0e5b6fd0c317393cac594f21))
- changed the structure of the module to be more like the ssi-core module of ours. Plus, changed some documents ([4480b3f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4480b3f33c887d92731260d5d09c8808cb5e9c13))

## [0.5.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.0...v0.5.1) (2022-02-23)

**Note:** Version bump only for package SSI-SDK-workspace

# [0.5.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.4.0...v0.5.0) (2022-02-23)

### Features

- Update waci pex implementation as it was serializing a SIOP Auth request including all options like private keys, not conforming to WACI-PEX ([90a1cba](https://github.com/Sphereon-Opensource/SSI-SDK/commit/90a1cba359b7a946951ef0d47746d01b3cbc225e))

# [0.4.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.4...v0.4.0) (2022-02-11)

### Bug Fixes

- ensure we set jsx to react ([c2a5e6f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c2a5e6f0cfb7895990fa1cc354c457fc93b640fd))

### Features

- Add WACI PEx QR generator for React ([7850e34](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7850e34ad2af58f62523a2346826d12280216d31))

## [0.3.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.3...v0.3.4) (2022-02-11)

### Bug Fixes

- fix imports ([738f4ca](https://github.com/Sphereon-Opensource/SSI-SDK/commit/738f4cafdf75c9d4831a3c31de1c0d5aff1d7285))

## [0.3.3](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.1...v0.3.3) (2022-02-10)

### Bug Fixes

- building of vc-handler-ld-local containing ts files + not copying files ([cdbfcab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cdbfcab114531947e6d0092e0bdb7bc9f818ac88))
- we imported a ts file from another package in the monorepo instead of using the module ([5d647df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5d647dffd9002ffca2a15a5c1ba56e33acec6716))

## [0.3.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.1...v0.3.2) (2022-02-04)

### Bug Fixes

- building of vc-handler-ld-local containing ts files + not copying files ([cdbfcab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cdbfcab114531947e6d0092e0bdb7bc9f818ac88))
- we imported a ts file from another package in the monorepo instead of using the module ([5d647df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5d647dffd9002ffca2a15a5c1ba56e33acec6716))

## [0.3.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package SSI-SDK-workspace

# [0.3.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.2.0...v0.3.0) (2022-01-16)

### Bug Fixes

- Add missing suites exports ([4a3b8ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a3b8ce93e36c55b3b17884e262db9d91c4459e6))
- Be a bit more relaxed when deleting an LTO DID, eventhough onchain support is not present ([7347914](https://github.com/Sphereon-Opensource/SSI-SDK/commit/73479148d6b02c194182370c14a15613dca6fcf2))
- Update test timeout for Factom ([9a934cf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9a934cfb507af3d5cc8629bb0e8f6fd70f785092))

### Features

- Add debug logging when creating VC, can be enabled by DEBUG=sphereon:ssi-sdk:ld-credential-module-local ([c0df2ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c0df2ce8bc67f2e407ef21b65aae6d364c47a6b9))

# [0.2.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.1.0...v0.2.0) (2021-12-16)

### Bug Fixes

- LTO DIDs use #sign for keys ([11daa98](https://github.com/Sphereon-Opensource/SSI-SDK/commit/11daa98c804232b9fad32d60afa707e86881b5bb))
- move to ES6 import for cross-fetch ([b855273](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b85527391fd2072c427dc34a69ad026b60a70be0))
- Multibase encoding didn't include the prefix char ([1be44b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1be44b7f281b82370a59a321f25057bee34d58de))
- update test to search for kid using #sign instead of #key as the LTO indexer impl changed ([fa0fae4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fa0fae43935e7c64e4d5628fb5cdd3dc8af447ce))
- workaround for bug in VeramoEd25519Signature2018 implementation ([13442eb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/13442eb417b809751133dfaf43e1fa0a703f2f80))

### Features

- Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([b4e8453](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b4e84534175c58aa7c744212099a69e852b1f299))
- Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([995f55e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/995f55efd5237e3fbd76e6569e09ee3bbcbb686c))
- Add local default contexts ([da29f02](https://github.com/Sphereon-Opensource/SSI-SDK/commit/da29f0290b21eab7d23027a7827ea967d1c3d1fa))
- Add Local JSON-LD VC and VP issuance and verification plugin ([aa1b45c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa1b45c2e118c5fb4c80b70d0544cf301b2a40c7))
- Add Mnemonic seed generation, verificaiton and secure storage ([d9a410a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d9a410a2cfd576afc885c6882e448c6d9e15f137))
- Add new ed25519 2018 signature and spec implementation using transmute's TS implementation ([ffbe876](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ffbe8760e1dc69964ba92aa0d8127274fcff61ac))
- Add proof purposes to issuance and verification methods. Add support to resolve verification methods from DID doc ([c8e7392](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c8e739227d226ac06619d20a4de0886236e05269))
- Add Self-Issued OpenID Connect and OpenID Connect for Verifiable Presentations support ([1ec1d1c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1ec1d1cacd08f12d4c21a8d72dfb51430f78deb3))
- Add suite lookup based on verification method type next to veramo key type ([5c18dc2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5c18dc2a2f61ddff213595408ad10b62a5e83476))
- Allow remote context loading ([742d3cc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/742d3ccfffb36a658e7a48b8feeb65fe3eb409e5))

# 0.1.0 (2021-11-26)

### Bug Fixes

- add missing env var for workflow for PRs ([c3198ca](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c3198ca86afb9017bdb20f5c007245fb0aed51f2))
- fix workflow env ([3acf669](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3acf6699e768b1aa64dd82fb1abd5b11110af3da))
- fix workflow for PRs ([eddad66](https://github.com/Sphereon-Opensource/SSI-SDK/commit/eddad66e9e92e5eae6a3e7ec8cf5848591a76bec))
- open handles and logging after test completes ([8cca899](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8cca899ff73c45564589c89d1635d0ba23b3e544))
- sync main into develop ([143927c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/143927c063bea8153c19cd0ee06b329632ada5b0))

### Features

- Add factom-did module ([e6e3cfb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e6e3cfb0e992df6f6caf776f0b27cfc7fe85f078))
- Add lto-did module ([236ca01](https://github.com/Sphereon-Opensource/SSI-SDK/commit/236ca0101951186b224aee51f49b3ab77148d64b))
- Add ssi-sdk core module ([42a5b65](https://github.com/Sphereon-Opensource/SSI-SDK/commit/42a5b65fa3795284fc16b06d2a36c4bf4ea87668))
- Add workspace/lerna files and structures ([2c2b112](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2c2b11244c2e5e3d2d1b1db76af3d86ec300bc72))
