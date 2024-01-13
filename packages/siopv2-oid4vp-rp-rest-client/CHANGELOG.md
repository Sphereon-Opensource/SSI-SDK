# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.17.5](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.4...v0.17.5) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.siopv2-oid4vp-rp-rest-client

## [0.17.4](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.3...v0.17.4) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.siopv2-oid4vp-rp-rest-client

## [0.17.3](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.2...v0.17.3) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.siopv2-oid4vp-rp-rest-client

## [0.17.2](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.1...v0.17.2) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.siopv2-oid4vp-rp-rest-client

## [0.17.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.0...v0.17.1) (2023-09-28)

### Bug Fixes

- update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))

# [0.17.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.1...v0.16.0) (2023-09-28)

### Features

- Add static header support to siop rest client ([e9fb5ee](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/e9fb5ee97e9f466b87a7a0424392571cff9fd56c))
- Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))

## [0.15.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.0...v0.15.1) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.siopv2-oid4vp-rp-rest-client

# [0.15.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.1...v0.15.0) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.siopv2-oid4vp-rp-rest-client

## [0.14.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/ssi-sdk.siopv2-oid4vp-rp-rest-client

# [0.14.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.13.0...v0.14.0) (2023-07-30)

### Bug Fixes

- VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))

# [0.13.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.11.0...v0.12.0) (2023-06-21)

### Bug Fixes

- fix test cases and REST arguments ([975801e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/975801e1e6c8270fd470acd7e2ce67ae4971a16f))
- fixed a bug in calling cross-fetch with post, modified the tests ([a3defeb](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/a3defeb5d62ff7f4007a88cd772b2164c136da7a))
- unify naming ([ec7d0b6](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/ec7d0b6ced54a792ede23937c7043e53d7121e42))
- unify naming ([94165cd](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/94165cdb8d1cf14f866de7fc5fe2c518a97b1986))

### Features

- Add key value store plugin ([95244fa](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/95244fa9f6c79d47660f1afee39c2c9db50f0e27))
- More support for definition Formats when creating VPs from SIOP ([846ef0b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/846ef0b359c4ec5755d9385c5f1c6db1fb14b0c1))
- move schema generation to own plugin because of transitive dependency issues upstream ([58002a8](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/58002a861f7ed504b0e1d4250d556f8414f961a0))
- move to pnpm ([2714a9c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2714a9c786b8591de41310a83aff19f62cf65e77))
