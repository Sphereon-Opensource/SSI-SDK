# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.17.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.1...v0.17.2) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-express-support





## [0.17.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.0...v0.17.1) (2023-09-28)


### Bug Fixes

* update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))





# [0.17.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.1...v0.16.0) (2023-09-28)

### Bug Fixes

- Make sure we do not throw an error when the IDP does not have an end_session_url ([781e250](https://github.com/Sphereon-Opensource/SSI-SDK/commit/781e2500a3296fb74f3c774b8e2862cbca9abdb0))

### Features

- Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))
- web3 headless provider and wallet ([00fc40a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/00fc40a6fd2ade1cab03d750a1c012ca8cb6d05a))
- web3 headless provider and wallet ([c69cf9e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c69cf9e65de30180e2898ed2289c572fe228eb20))
- web3 headless provider and wallet ([62dc7df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/62dc7dfb43b0461707d4ef2afc6f21406e57ae5e))

## [0.15.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.15.1) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-express-support

# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-08-10)

### Features

- Add graceful http server termination ([bba073b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bba073b22afe1e09663532ac4427cf3a16a9e734))

## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/ssi-express-support

# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-07-30)

### Features

- Add express builder, cors configurer, passport authentication and casbin authorization support for APIs. ([cb04fe8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cb04fe8b84ce6f4c840afef43d628f23cb8e9e36))
- Add global web resolution provider. Add json error handler ([f19d1d1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f19d1d135a9944a6c9e4c6040c58e7563c4442f2))
- Allow objects for error response. Improve json handling in error responses ([4151c73](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4151c73b4cdeb931c0deb8b8f34ed9c215efe5ba))
