# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.17.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.0...v0.17.1) (2023-09-28)


### Bug Fixes

* update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))





# [0.17.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.1...v0.16.0) (2023-09-28)

### Features

- Add auth support to VCI REST client ([c541b23](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/c541b2347f4d602e5a017116e5d0155e8d6290dd))
- Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))

## [0.15.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.15.0...v0.15.1) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.15.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.1...v0.15.0) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

## [0.14.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.14.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.13.0...v0.14.0) (2023-07-30)

### Bug Fixes

- VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))

# [0.13.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.11.0...v0.12.0) (2023-06-21)

### Bug Fixes

- added dev dependencies for oid4vci-issuer-rest-client plus prettier ([7b6c2b3](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/7b6c2b3d08aedfe357345fac47e94be4dcd3d243))
- added schema export for oid4vci-issuer-rest-client and some docs ([7db9c1b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/7db9c1be4775f55cf6db4470db1d99e0efdf5caa))
- skipped integration tests in oid4vci-issuer-rest-client ([c43759b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/c43759bebc7350cc400d668369105a8cff0e3ee1))

### Features

- Add issue status support to OID4VCI REST client ([40abd83](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/40abd8320dd0097e2e024c2e61ce2f03359926ab))
- Allow to supply data for VCI Issuer REST client and server during offer ([0878c28](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0878c2848aa5144ee863e6f192c9f8b8eb46ff34))
- changed the test structure and few other pr notes addressed ([6520fbe](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/6520fbe297ab9a1c5f5fbaff5cabb98f51d3cbea))
