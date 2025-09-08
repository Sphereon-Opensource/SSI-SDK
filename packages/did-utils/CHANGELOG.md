# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.29.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.28.0...v0.29.0) (2025-05-22)

### Bug Fixes

- commonjs import ([0824bc3](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/0824bc3742682b422936cc413ed1b2b509998b78))
- Make sure we always compare RSA keys as raw keys, as they can be expressed as raw, or as X.509 keys ([d413275](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/d41327554c8ad92fdd214e3aa6832218384f265f))
- oidf client ([24ca549](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/24ca549841533d8ae29184b42dc92a416bdb246d))
- oidf imports ([52b2065](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/52b2065fb8793c613c9971acc843decd6fc29685))
- RSA related signature creation and validation fixes ([1aa66d6](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/1aa66d64d3e4050f5bc798f6f903f7aa64246d72))
- Skip ethereum account id VMs in a DID when converting to JWKs ([da01a63](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/da01a63ada370784d62a8e97517fab349ac86469))

### Features

- Add support to lookup by kmsKeyRef when mapping did VMs ([bd5b8cb](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/bd5b8cb036256253c3b95c9d9edc8bf1986611ff))
- Ensure OYD now also is build as esm and cjs module and uses vitest for testing ([3b27367](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/3b273671c2d2dc6b6d992ab65698c606c7f1b676))
- move to esm-js ([bcd26c1](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/bcd26c1d8e790a9f71aa5aed96509db99bf9c500))
- move to vitest ([558ed35](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/558ed35c895fa6c473da1ef7612e1cb9fe121cfe))

# [0.28.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.27.0...v0.28.0) (2025-03-14)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-utils

# [0.27.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.26.0...v0.27.0) (2024-12-05)

### Bug Fixes

- Move away from using crypto.subtle for signature verifications, as it is too problematic in React-native. Replaced with audited noble implementations ([69ec9a6](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/69ec9a68a655eb34060a70ba64d83ef0df770bac))

# [0.26.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.25.0...v0.26.0) (2024-11-26)

### Bug Fixes

- Add support for P-384/521 external JWKs ([7f4a809](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/7f4a8090121ee2aedae64af06ccc42e7b069bd6b))

### Features

- Add OYD DID support in enum ([01fe1d0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/01fe1d0168b6b8da929a85586eedb7d398a239a3))

# [0.25.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.24.0...v0.25.0) (2024-10-28)

### Features

- Add JWS signature verification; Add cose key conversions and resolution (managed and external) ([9f76393](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/9f7639322d825bd7ec0a276adfb6ab4a934fc571))
- Create seperate function to handle KMS managed identifiers of different types as the assumption always was DIDs ([944b425](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/944b42566461a125a4e14e7c0caba94040fac862))
- External resolution of keys and validations for DIDs and x5c ([01db327](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/01db32715f7e7a95b57e07c23b7f3cc5b6ffa578))
- Have a method on the Key Management System as well as a separate function to get a named or the default KMS. Remove dep/enum for kms local. We only have KMSs names at runtime. We should not rely on static KMS names ever! ([c0ca69f](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/c0ca69fe0f10cfd9cdafa94b7af31a6cf6100680))

# [0.24.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.23.0...v0.24.0) (2024-08-01)

### Features

- Improve kid determination. Rename most `kid` arguments to kmsKeyRef, as these are only the internal KMS kids. Preventing confusion. Improve did functions to accept object args. ([22f465c](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/22f465c9b7bfc5b5f628557c6a0631ae5817d444))

# [0.23.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.22.0...v0.23.0) (2024-07-23)

### Bug Fixes

- did web resolution from identifier was not taking keys into account that had no purpose set ([8447426](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/8447426c7be54f81398c77f3a29c029c7250380d))
- did web resolution from identifier was not taking keys into account that had no purpose set ([980075b](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/980075b6ee8702b0a2fa31779aa21420827dda1d))
- get or create primary identifier was incorrectly constructing the identifier provider from the DID method ([d89542e](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/d89542e18e3a48a5ad048000330d97ecf8d861e5))
- get or create primary identifier was not searching for the correct DID methods ([8b1aad7](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/8b1aad7d0f3de534266972023b23c8f3881fd106))

### Features

- Make key/vm from identifier/did functions more future proof and add option to search for controller keys and key types ([f691789](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/f6917899680c1f39a98a0afbf181e821edadd4a3))

# [0.22.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.21.0...v0.22.0) (2024-07-02)

### Bug Fixes

- better local DID Document conversion from identifiers ([e332562](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/e332562ee79a57bd7a2b57426dcd08373f91195c))
- determine kid function can have a null verification method which was not taken into account ([d80a945](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/d80a9455ae6ff2eccf9a6001e12d371bad8dd742))
- getKey method was not looking at existing vms or purpose metadata values ([36619d6](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/36619d6db64fbb3b071f71a2687d60243fe4bcd6))
- getKey method was not working well with did#vm or #vm key ids ([b04eb3f](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/b04eb3fee9406bc5c550d392fd97c9a31455b9be))
- kid determination of a key should look for jwk thumbprint as well ([d00e984](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/d00e98446601d7a2593db32529ba958629fe4005))

### Features

- Add service and key for EBSI DIDs ([4ec6f18](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/4ec6f18e5e8f5b90de09c80eda7c44cf9f748985))
- Add support to find keys by thumbprint, and not have to resolve to DID resolution in all cases ([d37c772](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/d37c772b0eb3ce65a1e0a5f99b97acf641515d6b))
- Added getAuthenticationKey getPrimaryIdentifier & createIdentifier to did-utils ([7360ab6](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/7360ab606b6b22a9c8cd259e1994198a04a4ab3e))

# [0.21.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.20.0...v0.21.0) (2024-06-19)

### Bug Fixes

- Multiple DID EBSI fixes ([131faa0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/131faa0b583063cb3d8d5e77a33f337a23b90536))

### Features

- Ensure we can actually pass in bearer tokens & misc cleanups ([4abc507](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/4abc507e2b0dda53cc77cb00a55d4b432e6c38de))

# [0.20.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.19.0...v0.20.0) (2024-06-13)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-utils

# [0.19.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.18.2...v0.19.0) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-utils

## [0.18.2](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.18.1...v0.18.2) (2024-04-24)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-utils

## [0.18.1](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.18.0...v0.18.1) (2024-04-04)

### Bug Fixes

- Padding had incorrect length comparison ([d141050](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/d141050b31bd1b846a2f5471a2e9673895e1239b))

# [0.18.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.17.0...v0.18.0) (2024-03-19)

### Bug Fixes

- unknown point format ([b25d6de](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/b25d6de6e8c938d36cf2aa6e8679a549bd41aea5))

### Features

- Ensure proper key type is used for did:key in case codeName is JCS/EBSI ([af11a99](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/af11a99b0912d911e2d11fad94e7ccf02068afbd))

# [0.17.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.16.0...v0.17.0) (2024-02-29)

**Note:** Version bump only for package @sphereon/ssi-sdk-ext.did-utils

# [0.16.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.15.0...v0.16.0) (2024-01-13)

### Bug Fixes

- did:key ebsi / jcs codec value was wrong ([a71279e](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/a71279e3b79bff4add9fa4c889459264419accc6))

# [0.15.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.14.1...v0.15.0) (2023-09-30)

### Features

- check whether resolution is configured properly ([01a693b](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/01a693b94cd612826312168973caf15b0441ebf0))

## [0.14.1](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.14.0...v0.14.1) (2023-09-28)

### Bug Fixes

- public key mapping updates, fixing ed25519 with multibase encoding ([489d4f2](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/489d4f20e0f354eb50b1a16a91472d4e85588113))

# [0.14.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.13.0...v0.14.0) (2023-08-09)

### Bug Fixes

- Allow also for local did resolution ([0f92566](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/0f92566758eab0fe7edbf3ac8f04c32f6d9fdbb7))
- Allow also for local did resolution ([a678459](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/a678459a74b6b8a39f5b2229e790ca06a346d93e))
- Allow also for local did resolution ([91def9c](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/91def9c446849521f5e9da5beb07bab6871501d1))
- RSA import fixes ([77704a2](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/77704a2064e1c1d3ffc23e580ddbb36063fc70ae))

### Features

- Do not resolve DIDs when a DID doc is provided already when matching local keys ([b5b7f76](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/b5b7f76496e328e264aa38f351f5a64c4ca03dba))

# [0.13.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.12.1...v0.13.0) (2023-07-30)

### Features

- Add agent resolver method ([462b5e3](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/462b5e33d31bfdc55bc4d8cf05868a4c945ea386))
- Add agent resolver method ([3c7b21e](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/3c7b21e13538fac64581c0c73d0450ef6e9b56f0))
- Check also for other supported encryption algorithms when JWK use property is used ([36a8ae4](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/36a8ae45105791464432eb287988976b1ddfdb1e))
- Identifier to DID Document and DID resolution ([76e7212](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/76e7212cd6f7f27315d6b6bfdb17154124f3158e))

## [0.12.1](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.12.0...v0.12.1) (2023-06-24)

### Bug Fixes

- Fix EC handling for DID resolution ([5f3d708](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/5f3d70898783d56f5aa7a36e4fd56faf5907dbeb))
- Fix EC handling for JWKs ([9061e29](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/9061e2968005931127c52febbb3326fddcd62fb2))
- Fix EC handling for JWKs ([b60825b](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/b60825b155971dc8b01d2b4779faf71cecbacfa6))
- Fixes in JWK handling ([f5cd4dd](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/f5cd4ddd4f0cd0f155dcbf3a7e8b43c89b97cacb))
- Make sure we set the saltLength for RSA PSS ([e19ed6c](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/e19ed6c3a7b8454e8074111d33fc59a9c6bcc611))

# [0.12.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.11.0...v0.12.0) (2023-05-07)

### Features

- Move mnemonic seed generator to crypto extensions ([748a7f9](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/748a7f962d563c60aa543c0c6900aa0c0daea42d))

# [0.11.0](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/compare/v0.10.2...v0.11.0) (2023-04-30)

### Features

- add key utils package for common key functions ([0543254](https://github.com/Sphereon-OpenSource/ssi-sdk-crypto-extensions/commit/0543254d14b4ba54adeeab944315db5ba6221d47))

# [0.9.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.8.0...v0.9.0) (2023-03-09)

### Bug Fixes

- Fix DID handling in OP session ([926e358](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/926e358ef3eadf19fc3c8f7c9940fe6322c5ff85))
- fix private key hex from Pem ([0204094](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0204094e7b7fd33314a31df5d06344f54e6f6442))

### Features

- allow existing did document for mapping ([5f183ce](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/5f183ce655a40332a65480634b356ae8fa4d7a84))
- allow existing did document for mapping ([4d82518](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4d82518653ff456383561c22870856f110976aa0))
- did utils package ([d98b358](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/d98b358ff7f9c787667b4bf48fd748ae9f58197a))
- make sure the vc-handler-ld-local can deal with keys in JWK format ([26cff51](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/26cff511b345e412dc37586ef3c3c8fe678cd574))
- Update SIOP OP to be in line wiht latest SIOP and also supporting late binding of identifiers ([2beea04](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2beea04a6604d82b12ecbc11e68a9f41775c22ed))

# [0.8.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.7.0...v0.8.0) (2022-09-03)

### Bug Fixes

- Remove most deps from ssi-sdk-core to prevent circular deps ([b4151a9](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/b4151a9cde3e5e5dcabb32367e7a6b6ab99cb6cd))

### Features

- Create common SSI types package ([0fdc372](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0fdc3722e3bc47ac13c3c586535937fa1ebe6f68))

# [0.7.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ssi-sdk-core

# [0.6.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/ssi-sdk-core

# [0.5.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.4.0...v0.5.0) (2022-02-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-core

# [0.4.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.3.4...v0.4.0) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk-core

## [0.3.4](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.3.3...v0.3.4) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk-core

## [0.3.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package @sphereon/ssi-sdk-core

# [0.3.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.2.0...v0.3.0) (2022-01-16)

**Note:** Version bump only for package @sphereon/ssi-sdk-core

# [0.2.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.1.0...v0.2.0) (2021-12-16)

### Bug Fixes

- Multibase encoding didn't include the prefix char ([1be44b7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/1be44b7f281b82370a59a321f25057bee34d58de))

### Features

- Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([995f55e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/995f55efd5237e3fbd76e6569e09ee3bbcbb686c))

# 0.1.0 (2021-11-26)

### Features

- Add ssi-sdk core module ([42a5b65](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/42a5b65fa3795284fc16b06d2a36c4bf4ea87668))
- Add workspace/lerna files and structures ([2c2b112](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2c2b11244c2e5e3d2d1b1db76af3d86ec300bc72))
