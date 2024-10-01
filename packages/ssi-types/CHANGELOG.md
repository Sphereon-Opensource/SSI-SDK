# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.30.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.30.0...v0.30.1) (2024-10-01)

**Note:** Version bump only for package @sphereon/ssi-types

# [0.29.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.28.0...v0.29.0) (2024-08-01)

### Bug Fixes

- Logger fixes ([75b6925](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/75b692530f01a4c83515a194fc6232418b802259))

# [0.28.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.27.0...v0.28.0) (2024-07-23)

**Note:** Version bump only for package @sphereon/ssi-types

# [0.27.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.26.0...v0.27.0) (2024-07-07)

### Features

- EBSI DID registraiton/management ([7195786](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/7195786bde800f3ce231ef4dd4fb1629a73143b2))
- EBSI headless attestation credentials ([6b6ad14](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/6b6ad14d4be1c4cbca8e6d49cc73db4713e04f26))

# [0.26.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.25.0...v0.26.0) (2024-06-19)

**Note:** Version bump only for package @sphereon/ssi-types

# [0.25.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.24.0...v0.25.0) (2024-06-13)

### Bug Fixes

- Ensure logger is initialized early preventing potential issues when importing from other libraries ([eae66f2](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/eae66f2e93a4fb54520284ed948feca09d829398))
- Order of static keys to ensure default namespace key is available when creating the default logger ([dc56df2](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/dc56df22045944f48a2f7c32b04d099ac7b231e9))

# [0.24.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.23.4...v0.24.0) (2024-06-05)

**Note:** Version bump only for package @sphereon/ssi-types

## [0.23.4](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.23.2...v0.23.4) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-types

# [0.23.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.22.0...v0.23.0) (2024-04-24)

### Features

- add kb-jwt to sd-jwt ([e066f2b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/e066f2b1a0c3d89796ce00af39511ce8a05b39e7))

# [0.22.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.21.1...v0.22.0) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-types

## [0.21.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.21.0...v0.21.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-types

# [0.21.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.19.0...v0.21.0) (2024-03-20)

### Bug Fixes

- fixed failing test cases and added more test cases for getting data from the raw data ([6f5b50b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/6f5b50bbcc9c1822f2d0a4dbf5a13e197603d802))
- refactored UniformCredential names to digitalCredential, added utility methods for getting the credential document type ([a0c5530](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/a0c553048d3fbadaa55b7e987219064d32820221))

### Features

- upgrade SD-JWT package ([6563973](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/656397349c5d36334cde10f08c469242eb4c48f5))

### Reverts

- Remove BBS support. ([205e0db](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/205e0db2bb985bf33a618576955d8b28a39ff932))

### BREAKING CHANGES

- Remove BBS support. Upstream support for Windows and RN is missing. Needs to be revisited at a later point in time

# [0.19.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.18.1...v0.19.0) (2024-03-02)

### Bug Fixes

- JWT VP sometimes was constructed as a JSON LD VP with JwtProof2020 ([abb012c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/abb012c99ff4fbce241b3c78b602783d22c88b5e))

### Features

- Add initial OID4VP ID2 support ([85325ae](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/85325ae7cdf6b28d32442a38779f25ee627dd86f))
- Allow i18n for JSONLD credentials ([1ce843e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/1ce843e01cf842adbe9a82f9e6f69c94af9610b5))

## [0.18.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.18.0...v0.18.1) (2024-01-19)

**Note:** Version bump only for package @sphereon/ssi-types

# [0.18.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.5...v0.18.0) (2024-01-13)

### Features

- Add bearer token support using callback function ([4528881](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4528881563104ac00b9af8d9615479c76af8a3be))
- Add static bearer token callback function option ([2d5cd5a](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2d5cd5ad429aa5bf7a1864ce6a09bf2196e37d63))
- **ssi-types:** add kid to cnf ([0fb3886](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0fb3886eb36e1b9e31f38a4a7812cd8e36437f54))
- **ssi-types:** sd-jwt support ([b9154a0](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/b9154a097cb3428204f65eca024222e70e8ca17b))

## [0.17.5](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.4...v0.17.5) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-types

## [0.17.4](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.3...v0.17.4) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-types

## [0.17.3](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.2...v0.17.3) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-types

## [0.17.2](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.1...v0.17.2) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-types

## [0.17.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.0...v0.17.1) (2023-09-28)

### Bug Fixes

- update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))

# [0.17.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.1...v0.16.0) (2023-09-28)

### Bug Fixes

- Create a issuer.id in a uniform credential in case the issuer is already an object and there is an iss claim in the JWT ([706baff](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/706baffee81c1a6993bf1573a083696c45cb3ab9))

### Features

- Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))
- statuslist2021 support ([46986dd](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/46986dd9eae27aaa6a980eac55a8d5e1d5c85a57))

## [0.15.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.0...v0.15.1) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-types

# [0.15.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.1...v0.15.0) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-types

## [0.14.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/ssi-types

# [0.14.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.13.0...v0.14.0) (2023-07-30)

### Bug Fixes

- VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))

# [0.13.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.11.0...v0.12.0) (2023-06-21)

### Features

- Add Presentation Exchange module ([a085c81](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/a085c81a2608dd072e9b2c3d49174b76dab9705a))
- More support for definition Formats when creating VPs from SIOP ([846ef0b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/846ef0b359c4ec5755d9385c5f1c6db1fb14b0c1))

# [0.11.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.10.1...v0.11.0) (2023-05-07)

### Bug Fixes

- make credential mapper a bit more resilient ([7248fae](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/7248fae74f4d3a300bce5bdfb1180267b7bd9c2d))

### Features

- Create new agent-config module to replace the deps on Veramo cli, which pulls in everything ([673856f](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/673856f587885743300aaafea791e3696d9c456f))
- instead of returning a boolean value, return an object with more information about verification of LD creds/VPs ([7df0e64](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/7df0e64ad6553e8153cf96d62156867fde8e4cef))

# [0.10.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.9.0...v0.10.0) (2023-04-30)

### Bug Fixes

- cleanup package.json files ([0cc08b6](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0cc08b6acc168b838bff48b42fdabbdea4cd0899))
- decoded JWT VPs/VCs did not contain everything ([fd7ff68](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/fd7ff680bbfbfbfbf0cd4ba96948b805ac97c6dd))

### Features

- Add better internal handling of JWT proof values used in JsonLD converted credentials ([90004c5](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/90004c5886cd3f645f979b5e81dfc03e3ff3b862))
- Update to v2 PEX and v0.3 SIOP packages ([80398e3](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/80398e36ab53ed46ebca715570242a466c83d5db))

# [0.9.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.8.0...v0.9.0) (2023-03-09)

### Bug Fixes

- credential mapper for jtw ([f04345b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f04345b97ff9a78a3dff096599f0b675b3239a3e))
- JWT claims would overwrite the issuer object in the credential. Disable Factom tests ([f41cf64](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f41cf64790d484ad8b9721fe347e81e2153898b9))
- Move parseDid method to ssi-types ([0b28de3](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0b28de3de21afd0a224d3d174103e072162231ed))
- Remove non dev dep on veramo-core ([8cb8efe](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/8cb8efec1fc97581640a8254fe412abc8fea4305))
- Tests to allow multiple subjects for credentials ([5e407ac](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/5e407accd822ccb099677876df192e850b17ccd1))
- Tests to allow multiple subjects for credentials ([52b1662](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/52b1662c9f7dc911f7f67d2e56a0b86cb7535c8c))
- Tests to allow multiple subjects for credentials ([110d78e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/110d78e29304a230359e30d6ae54cdf2cfe10882))

### Features

- Add jwt as signature when decoding JWT VCs/VPs ([f089ac1](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f089ac18dc470f0b8c581b49e70e7eba64d72bc3))
- Allow multiple subjects for credentials ([6300ccc](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/6300ccc4db803e76abeeafb489374120b983af71))
- Create VP in OP Authenticator and allow for callbacks ([0ed86d8](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0ed86d8d2b655a718d7c8cf1a946e0150bf877ce))

# [0.8.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.7.0...v0.8.0) (2022-09-03)

### Features

- Create common SSI types package ([0fdc372](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0fdc3722e3bc47ac13c3c586535937fa1ebe6f68))

# [0.7.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.6.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.5.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.4.0...v0.5.0) (2022-02-23)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.4.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.3.4...v0.4.0) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

## [0.3.4](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.3.3...v0.3.4) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

## [0.3.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.3.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.2.0...v0.3.0) (2022-01-16)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.2.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.1.0...v0.2.0) (2021-12-16)

### Bug Fixes

- Multibase encoding didn't include the prefix char ([1be44b7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/1be44b7f281b82370a59a321f25057bee34d58de))

### Features

- Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([995f55e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/995f55efd5237e3fbd76e6569e09ee3bbcbb686c))

# 0.1.0 (2021-11-26)

### Features

- Add ssi-sdk core module ([42a5b65](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/42a5b65fa3795284fc16b06d2a36c4bf4ea87668))
- Add workspace/lerna files and structures ([2c2b112](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2c2b11244c2e5e3d2d1b1db76af3d86ec300bc72))
