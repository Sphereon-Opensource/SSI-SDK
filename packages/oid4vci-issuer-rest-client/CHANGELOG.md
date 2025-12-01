# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.36.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.34.0...v0.36.0) (2025-11-19)

### Bug Fixes

- class-validator has changed behavior, so fixating to the older version ([0f35c70](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0f35c70cda2b8763fdbe0bb68f73a7854ad63dc4))

### Features

- Merge crypto extension modules now the build process is faster and we have turbo. Means we will have consistent versions between SDK and crypto extension modules ([6a366b9](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/6a366b905f34e154bba90d4ab20d9b1736336d01))

# [0.34.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.33.0...v0.34.0) (2025-05-22)

### Bug Fixes

- VCDM2 context was not taken into account ([7765edb](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/7765edb3fd7f69b4fbd36f02a725821cb38e4e30))

### Features

- Move to nx and fix a lot of tsconfig references in the process ([5e22c85](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/5e22c85999aeb34e81baa23e568f2b2acd5ed92e))
- move to vitest ([117285e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/117285ef15b2d0d7870a9c9487686366d6fe5b30))
- Packages are now ESM and CJS. Move to tsup and turborepo ([e68c8f7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/e68c8f738909485598160d0d032a2cae722cadea))

# [0.33.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.32.0...v0.33.0) (2025-03-14)

### Bug Fixes

- Do not try OIDF resolution on http:// urls ([fe88114](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/fe88114c0faaba18602f756121392651bffdc2b1))
- Fixed type issues and updated oid4vc dependency ([f919a29](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f919a297d56517da7cbe1db845dd164a848ffc2e))
- Issuer opts are not AS opts. Make sure we actually return issuer opts when requested ([18b4ced](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/18b4ced48911a04c546262da6f5cf5b2d82ed8f9))
- Removed local dependencies ([a50eb33](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/a50eb3370348285cfab74db09584821fe2b1be42))
- Updated dependencies and fixed broken code ([4982faa](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4982faa1bdf78d03f53f28f4fe9ec3471ed34cc8))

### Features

- Add swagger Ui to the hosted context, so we have a swagger API per OID4VCI instance ([4de300e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4de300eab19c15b7fff596e2d049cf5a8cef8f3e))
- added first party flow to holder plugin ([2f19e12](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2f19e125be1fb5bd06c97d3d409dd776c9368af6))

# [0.32.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.31.0...v0.32.0) (2024-12-05)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

## [0.30.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.30.0...v0.30.1) (2024-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.29.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.28.0...v0.29.0) (2024-08-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.28.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.27.0...v0.28.0) (2024-07-23)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.27.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.26.0...v0.27.0) (2024-07-07)

### Features

- Callback listeeners ([fce3670](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/fce367041eed15ffc0d261ec2820470bf1615e3b))
- EBSI headless attestation credentials ([6b6ad14](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/6b6ad14d4be1c4cbca8e6d49cc73db4713e04f26))

# [0.26.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.25.0...v0.26.0) (2024-06-19)

### Bug Fixes

- clientId fixes ([cad41fc](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/cad41fc296a06b7e25dcd957da21eae4d02f7b46))
- updated vci package and fixed getSupportedCredential function ([780a377](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/780a37782881da1558f7b97d4d8c0ffd71317d21))
- updated version of vci and fixed the libs for it ([ceb6074](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/ceb60748920fd78d318cb3544f69bef54b365c94))
- updated version of vci and fixed the libs for it ([de1d6aa](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/de1d6aadcea1aac18bcd72a5651e3bb1e9f386d6))

### Features

- allow default auth request options for VCI links/machines, like clientId and redirectUri ([434196e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/434196e4ce2f895b43ec9992d682a603aaa612a3))

# [0.25.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.24.0...v0.25.0) (2024-06-13)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.24.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.23.4...v0.24.0) (2024-06-05)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

## [0.23.4](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.23.2...v0.23.4) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

## [0.23.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.23.0...v0.23.1) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.23.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.22.0...v0.23.0) (2024-04-24)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.22.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.21.1...v0.22.0) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

## [0.21.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.21.0...v0.21.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.21.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.19.0...v0.21.0) (2024-03-20)

### Reverts

- Remove BBS support. ([205e0db](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/205e0db2bb985bf33a618576955d8b28a39ff932))

### BREAKING CHANGES

- Remove BBS support. Upstream support for Windows and RN is missing. Needs to be revisited at a later point in time

# [0.19.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.18.1...v0.19.0) (2024-03-02)

### Features

- Add initial OID4VP ID2 support ([85325ae](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/85325ae7cdf6b28d32442a38779f25ee627dd86f))

## [0.18.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.18.0...v0.18.1) (2024-01-19)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

# [0.18.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.5...v0.18.0) (2024-01-13)

### Features

- Add bearer token support using callback function ([4528881](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4528881563104ac00b9af8d9615479c76af8a3be))
- Add static bearer token callback function option ([2d5cd5a](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2d5cd5ad429aa5bf7a1864ce6a09bf2196e37d63))

## [0.17.5](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.4...v0.17.5) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

## [0.17.4](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.3...v0.17.4) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

## [0.17.3](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.2...v0.17.3) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

## [0.17.2](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.1...v0.17.2) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer-rest-client

## [0.17.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.17.0...v0.17.1) (2023-09-28)

### Bug Fixes

- update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))

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
