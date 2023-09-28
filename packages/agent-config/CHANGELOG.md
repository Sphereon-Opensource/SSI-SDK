# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.17.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.0...v0.17.1) (2023-09-28)


### Bug Fixes

* update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))





# [0.17.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.1...v0.16.0) (2023-09-28)

### Features

- Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))
- statuslist2021 support ([2649b95](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2649b95dc5fe5882d6b43ccfdcf085e37918e713))
- statuslist2021 support ([46986dd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/46986dd9eae27aaa6a980eac55a8d5e1d5c85a57))

## [0.15.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.15.1) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.agent-config

# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.agent-config

## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/ssi-sdk.agent-config

# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-07-30)

### Bug Fixes

- VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))

# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-06-21)

**Note:** Version bump only for package @sphereon/ssi-sdk.agent-config

# [0.11.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.1...v0.11.0) (2023-05-07)

### Features

- Create new agent-config module to replace the deps on Veramo cli, which pulls in everything ([673856f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/673856f587885743300aaafea791e3696d9c456f))

# [0.10.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.9.0...v0.10.0) (2023-04-30)

### Features

- Add better internal handling of JWT proof values used in JsonLD converted credentials ([90004c5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/90004c5886cd3f645f979b5e81dfc03e3ff3b862))

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Features

- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))
- Jsonweb2020 sig support ([43a3adf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/43a3adfbe683ee4040a293cc5b75d17a029d7c49))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/ssi-sdk-connection-manager

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ssi-sdk-connection-manager

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/ssi-sdk-connection-manager
