# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.17.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.1...v0.16.0) (2023-09-28)

### Bug Fixes

- Fix multibase/codec code ([4354927](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/43549278bb1a2f10f8eb4fab03abcd78c234bda2))

### Features

- Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))

## [0.15.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.0...v0.15.1) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.15.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.1...v0.15.0) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

## [0.14.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.14.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.13.0...v0.14.0) (2023-07-30)

### Bug Fixes

- Fix relative DID resolution and Json websignature 2020 verification for ED25519 and some other algs ([ca2682c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/ca2682c0b747f5052143c943a06f23acc7aa22cc))
- VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))

# [0.13.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.11.0...v0.12.0) (2023-06-21)

### Features

- move to pnpm ([2714a9c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2714a9c786b8591de41310a83aff19f62cf65e77))

# [0.11.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.10.1...v0.11.0) (2023-05-07)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.10.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.9.0...v0.10.0) (2023-04-30)

### Bug Fixes

- cleanup package.json files ([0cc08b6](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0cc08b6acc168b838bff48b42fdabbdea4cd0899))

# [0.9.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.8.0...v0.9.0) (2023-03-09)

### Bug Fixes

- Move parseDid method to ssi-types ([0b28de3](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0b28de3de21afd0a224d3d174103e072162231ed))

### Features

- Add jwt as signature when decoding JWT VCs/VPs ([f089ac1](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f089ac18dc470f0b8c581b49e70e7eba64d72bc3))
- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))

# [0.8.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.7.0...v0.8.0) (2022-09-03)

### Bug Fixes

- Remove most deps from ssi-sdk-core to prevent circular deps ([b4151a9](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/b4151a9cde3e5e5dcabb32367e7a6b6ab99cb6cd))

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
