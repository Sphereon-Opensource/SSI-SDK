# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.33.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.32.0...v0.33.0) (2025-03-14)

### Bug Fixes

- Do not retrieve AS metadata from store in case an external AS is used. Fetch from remote ([99c3f8e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/99c3f8e784f7b47c48aa7b0d4f1f270f37c37315))
- Do not try OIDF resolution on http:// urls ([fe88114](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fe88114c0faaba18602f756121392651bffdc2b1))
- Fixed type issues and updated oid4vc dependency ([f919a29](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f919a297d56517da7cbe1db845dd164a848ffc2e))
- Issuer opts are not AS opts. Make sure we actually return issuer opts when requested ([18b4ced](https://github.com/Sphereon-Opensource/SSI-SDK/commit/18b4ced48911a04c546262da6f5cf5b2d82ed8f9))
- Removed local dependencies ([a50eb33](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a50eb3370348285cfab74db09584821fe2b1be42))
- Updated dependencies and fixed broken code ([4982faa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4982faa1bdf78d03f53f28f4fe9ec3471ed34cc8))

### Features

- add default hasher implementation ([0a17930](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0a179306e0f4ae2c2ffc822b424eccd6a7d8794b))
- Add swagger Ui to the hosted context, so we have a swagger API per OID4VCI instance ([4de300e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4de300eab19c15b7fff596e2d049cf5a8cef8f3e))

# [0.32.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.31.0...v0.32.0) (2024-12-05)

### Bug Fixes

- Format mapping for PD ([4e18635](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4e1863586ff7d27c4fa8ccd1094e7618c364425f))

### Features

- Remove crypto.subtle as it is giving too many issues on RN. Moved to new implementation based on [@noble](https://github.com/noble) libs ([d86e7fa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d86e7fabdb83e73ff9c31b9308eb9c5e8110e61b))

## [0.30.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.30.0...v0.30.1) (2024-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.ebsi-support

# [0.29.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.28.0...v0.29.0) (2024-08-01)

### Features

- update to new keyRefs instead of kids ([e969b97](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e969b97b387e62e2def5a0bac655f1fe5c7100a7))

# [0.28.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.27.0...v0.28.0) (2024-07-23)

### Bug Fixes

- Add ebsi plugin schema ([422cf14](https://github.com/Sphereon-Opensource/SSI-SDK/commit/422cf14182d798dd0a0d6c126995edba14af9e3a))
- Ensure we always use the ES256 key for EBSI auth ([be7dc15](https://github.com/Sphereon-Opensource/SSI-SDK/commit/be7dc15537ec005fb7b3745c70dd0b7c4fd75300))

### Features

- Allow to pass in additional keys for EBSI ([16aa9e2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/16aa9e21180b69643d03ba137b7e3d014d092caf))

# [0.27.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.26.0...v0.27.0) (2024-07-07)

### Features

- EBSI access token, attestation and DID support ([bed66b4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bed66b463c025dbd86637ba43c815ca08c5d16d2))
- EBSI DID registraiton/management ([7195786](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7195786bde800f3ce231ef4dd4fb1629a73143b2))
