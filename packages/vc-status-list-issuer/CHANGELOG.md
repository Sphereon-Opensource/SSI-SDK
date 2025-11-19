# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.36.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.34.0...v0.36.0) (2025-11-19)

### Bug Fixes

- class-validator has changed behavior, so fixating to the older version ([0f35c70](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0f35c70cda2b8763fdbe0bb68f73a7854ad63dc4))
- merge issues ([693d8f0](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/693d8f0b0c6566650a31647fda630a0715f960c7))

### Features

- Merge crypto extension modules now the build process is faster and we have turbo. Means we will have consistent versions between SDK and crypto extension modules ([6a366b9](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/6a366b905f34e154bba90d4ab20d9b1736336d01))

# [0.34.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.33.0...v0.34.0) (2025-05-22)

### Features

- Move to nx and fix a lot of tsconfig references in the process ([5e22c85](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/5e22c85999aeb34e81baa23e568f2b2acd5ed92e))
- move to vitest ([117285e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/117285ef15b2d0d7870a9c9487686366d6fe5b30))
- Packages are now ESM and CJS. Move to tsup and turborepo ([e68c8f7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/e68c8f738909485598160d0d032a2cae722cadea))
- Redesign of VCDM credential plugin. Now we have plugable providers, for JWT and JsonLD and a shiny new VCDM Credential Plugin using these providers. ([67da208](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/67da2083bb6408f9896ad06e87688178ab3e2d31))
- VCDM 2 - JOSE implementation mostly supported ([8e67307](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/8e673073daa8f1ebd1e75249a5a0646d076a91aa))

# [0.33.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.32.0...v0.33.0) (2025-03-14)

### Bug Fixes

- Do not retrieve AS metadata from store in case an external AS is used. Fetch from remote ([99c3f8e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/99c3f8e784f7b47c48aa7b0d4f1f270f37c37315))

### Features

- add default hasher implementation ([0a17930](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0a179306e0f4ae2c2ffc822b424eccd6a7d8794b))
- Add oid4vci state store ([56ec3e0](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/56ec3e0d65066a2331b5f46aab74308405e4bb2a))
- Add QR code generation to OID$VP Auth Request API ([c9749f7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/c9749f7356545d8ff9c36c499f56afc0fc9a5ac9))
- Add swagger Ui to the hosted context, so we have a swagger API per OID4VCI instance ([4de300e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4de300eab19c15b7fff596e2d049cf5a8cef8f3e))
- Improve status list handling and default status list handling ([ab043c7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/ab043c790480fc1e69e3252ac1458cd61f53ae1d))

### Reverts

- Revert "chore: reverted updateStatusListEntry for sd-jwt status lists" ([7978dec](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/7978dec89fab2be586093c0e2f4abb998c2a9ad7))

# [0.32.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.31.0...v0.32.0) (2024-12-05)

### Bug Fixes

- Format mapping for PD ([4e18635](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/4e1863586ff7d27c4fa8ccd1094e7618c364425f))

### Features

- Remove crypto.subtle as it is giving too many issues on RN. Moved to new implementation based on [@noble](https://github.com/noble) libs ([d86e7fa](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/d86e7fabdb83e73ff9c31b9308eb9c5e8110e61b))

## [0.30.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.30.0...v0.30.1) (2024-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.vc-status-list-issuer
