# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.34.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.33.0...v0.34.0) (2025-05-22)

### Features

- Move to nx and fix a lot of tsconfig references in the process ([5e22c85](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5e22c85999aeb34e81baa23e568f2b2acd5ed92e))
- move to vitest ([117285e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/117285ef15b2d0d7870a9c9487686366d6fe5b30))
- Packages are now ESM and CJS. Move to tsup and turborepo ([e68c8f7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e68c8f738909485598160d0d032a2cae722cadea))
- Redesign of VCDM credential plugin. Now we have plugable providers, for JWT and JsonLD and a shiny new VCDM Credential Plugin using these providers. ([67da208](https://github.com/Sphereon-Opensource/SSI-SDK/commit/67da2083bb6408f9896ad06e87688178ab3e2d31))
- VCDM 2 - JOSE implementation mostly supported ([8e67307](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8e673073daa8f1ebd1e75249a5a0646d076a91aa))

# [0.33.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.32.0...v0.33.0) (2025-03-14)

### Bug Fixes

- Do not retrieve AS metadata from store in case an external AS is used. Fetch from remote ([99c3f8e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/99c3f8e784f7b47c48aa7b0d4f1f270f37c37315))

### Features

- add default hasher implementation ([0a17930](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0a179306e0f4ae2c2ffc822b424eccd6a7d8794b))
- added sd-jwt vct metadata branding support ([a21d812](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a21d812ca0027eb0da8955d629a4022f9bab0a10))
- Make sure we set default hasher implementations in case an app forgets to provide them ([ad3a60d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ad3a60d95aced138cf228a2d3eb16e4103c09eb6))

# [0.32.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.31.0...v0.32.0) (2024-12-05)

### Bug Fixes

- Format mapping for PD ([4e18635](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4e1863586ff7d27c4fa8ccd1094e7618c364425f))

### Features

- Remove crypto.subtle as it is giving too many issues on RN. Moved to new implementation based on [@noble](https://github.com/noble) libs ([d86e7fa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d86e7fabdb83e73ff9c31b9308eb9c5e8110e61b))

## [0.30.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.30.0...v0.30.1) (2024-10-01)

### Bug Fixes

- fixes issuer signed flow ([44dabf4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/44dabf46d5ea45db0ba3dc4d8e55343980011464))

# [0.29.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.28.0...v0.29.0) (2024-08-01)

### Features

- update to new keyRefs instead of kids ([e969b97](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e969b97b387e62e2def5a0bac655f1fe5c7100a7))

# [0.28.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.27.0...v0.28.0) (2024-07-23)

**Note:** Version bump only for package @sphereon/ssi-sdk.sd-jwt

# [0.27.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.26.0...v0.27.0) (2024-07-07)

### Features

- Allow EBSI attestation client to be the start of a regular VCI flow ([afffd39](https://github.com/Sphereon-Opensource/SSI-SDK/commit/afffd399e2b5ad696047130b967f9b72cfd65649))
- Callback listeeners ([fce3670](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fce367041eed15ffc0d261ec2820470bf1615e3b))
- EBSI access token, attestation and DID support ([bed66b4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bed66b463c025dbd86637ba43c815ca08c5d16d2))
- EBSI DID registraiton/management ([7195786](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7195786bde800f3ce231ef4dd4fb1629a73143b2))
- Get the authorization URL from a TI using a cloud/service wallet when requesting a particular attestation credential ([222c4d4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/222c4d451e84b6eb0c21a4c7a615ce1480f9dba9))

# [0.26.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.25.0...v0.26.0) (2024-06-19)

**Note:** Version bump only for package @sphereon/ssi-sdk.sd-jwt

# [0.25.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.24.0...v0.25.0) (2024-06-13)

### Features

- added sd-jwt plugin ([85d8aeb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85d8aebd719b14ed8c275e30ae283d11d237730d))
