# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.18.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.18.0...v0.18.1) (2024-01-19)

**Note:** Version bump only for package @sphereon/ssi-sdk.vc-status-list-issuer-rest-api

# [0.18.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.5...v0.18.0) (2024-01-13)

### Features

- Add static bearer token callback function option ([2d5cd5a](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2d5cd5ad429aa5bf7a1864ce6a09bf2196e37d63))

### Reverts

- Revert "chore: update deps" ([a1cd971](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/a1cd971c4edcff58e0ee225dd159a4e6958f58d1))

## [0.17.5](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.4...v0.17.5) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.vc-status-list-issuer-rest-api

## [0.17.4](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.3...v0.17.4) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.vc-status-list-issuer-rest-api

## [0.17.3](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.2...v0.17.3) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.vc-status-list-issuer-rest-api

## [0.17.2](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.1...v0.17.2) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.vc-status-list-issuer-rest-api

## [0.17.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.0...v0.17.1) (2023-09-28)

### Bug Fixes

- update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))

# [0.17.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.1...v0.16.0) (2023-09-28)

### Features

- statuslist2021 support ([46986dd](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/46986dd9eae27aaa6a980eac55a8d5e1d5c85a57))

# [0.14.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.13.0...v0.14.0) (2023-08-09)

### Bug Fixes

- RSA import fixes ([1e78d70](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/1e78d70679ce8a70d82d2b7320c6f7489ff1a870))
- RSA import fixes ([77704a2](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/77704a2064e1c1d3ffc23e580ddbb36063fc70ae))
- RSA import fixes ([52c560b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/52c560b4d4fef999554ec00130cf7136dc2db1c6))

### Features

- Add verification functions to KMS (only RSA for now) ([8f58f23](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/8f58f2308bc0dd612d1bb47b5ae05e8b67cf2efb))

# [0.13.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.12.1...v0.13.0) (2023-07-30)

### Features

- Add agent resolver method ([3c7b21e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/3c7b21e13538fac64581c0c73d0450ef6e9b56f0))
- Add support for RSA key generation and RSA to JWK ([75ba154](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/75ba154bb110a50a1892a5308627895a93f527a4))

## [0.12.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.12.0...v0.12.1) (2023-06-24)

### Bug Fixes

- Fix EC handling for JWKs ([9061e29](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/9061e2968005931127c52febbb3326fddcd62fb2))
- Fix EC handling for JWKs ([dd423f2](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/dd423f24eff5fcc41a3b72c15d62d7e478fbe9b9))
- Fixes in JWK handling ([f5cd4dd](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f5cd4ddd4f0cd0f155dcbf3a7e8b43c89b97cacb))
- Make sure we set the saltLength for RSA PSS ([e19ed6c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/e19ed6c3a7b8454e8074111d33fc59a9c6bcc611))

# [0.12.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.11.0...v0.12.0) (2023-05-07)

### Features

- Move mnemonic seed generator to crypto extensions ([748a7f9](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/748a7f962d563c60aa543c0c6900aa0c0daea42d))

# [0.11.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.10.2...v0.11.0) (2023-04-30)

### Features

- add key utils package for common key functions ([0543254](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0543254d14b4ba54adeeab944315db5ba6221d47))

# [0.9.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.8.0...v0.9.0) (2023-03-09)

### Features

- add Alg support to DID:JWK. Although optional in reality several external systems expect it to be present ([12dae72](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/12dae72860fd0dc00e96a8121b136c2195843388))
- Add support for ES256/Secp256r1 DID JWKs ([1e447a6](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/1e447a6fedab92549d8848a13212e9dd8c75274a))
- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))

# Change Log
