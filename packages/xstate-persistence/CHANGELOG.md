# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.36.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.34.0...v0.36.0) (2025-11-19)

### Features

- Merge crypto extension modules now the build process is faster and we have turbo. Means we will have consistent versions between SDK and crypto extension modules ([6a366b9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6a366b905f34e154bba90d4ab20d9b1736336d01))

# [0.34.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.33.0...v0.34.0) (2025-05-22)

### Bug Fixes

- VCDM2 context was not taken into account ([7765edb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7765edb3fd7f69b4fbd36f02a725821cb38e4e30))

### Features

- Move to nx and fix a lot of tsconfig references in the process ([5e22c85](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5e22c85999aeb34e81baa23e568f2b2acd5ed92e))
- move to vitest ([117285e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/117285ef15b2d0d7870a9c9487686366d6fe5b30))
- Packages are now ESM and CJS. Move to tsup and turborepo ([e68c8f7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e68c8f738909485598160d0d032a2cae722cadea))
- Redesign of VCDM credential plugin. Now we have plugable providers, for JWT and JsonLD and a shiny new VCDM Credential Plugin using these providers. ([67da208](https://github.com/Sphereon-Opensource/SSI-SDK/commit/67da2083bb6408f9896ad06e87688178ab3e2d31))

# [0.33.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.32.0...v0.33.0) (2025-03-14)

### Features

- add default hasher implementation ([0a17930](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0a179306e0f4ae2c2ffc822b424eccd6a7d8794b))

# [0.32.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.31.0...v0.32.0) (2024-12-05)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

## [0.30.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.30.0...v0.30.1) (2024-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

# [0.29.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.28.0...v0.29.0) (2024-08-01)

### Features

- update to new keyRefs instead of kids ([e969b97](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e969b97b387e62e2def5a0bac655f1fe5c7100a7))

# [0.28.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.27.0...v0.28.0) (2024-07-23)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

# [0.27.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.26.0...v0.27.0) (2024-07-07)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

# [0.26.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.25.0...v0.26.0) (2024-06-19)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

# [0.25.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.24.0...v0.25.0) (2024-06-13)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

# [0.24.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.4...v0.24.0) (2024-06-05)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

## [0.23.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.2...v0.23.4) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

# [0.23.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.22.0...v0.23.0) (2024-04-24)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

# [0.22.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.1...v0.22.0) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

## [0.21.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.0...v0.21.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk.xstate-machine-persistence

# [0.21.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.19.0...v0.21.0) (2024-03-20)

### Bug Fixes

- fixed XStatePersistence plugin and fixed the tests ([56d8f18](https://github.com/Sphereon-Opensource/SSI-SDK/commit/56d8f1883802208a2d15f2f25ec03b0bcfb0a4e3))

### Features

- Add rest client mode to xstate-machine-persistence, allowing to process local events but delegate the execution to a REST server ([02c5e12](https://github.com/Sphereon-Opensource/SSI-SDK/commit/02c5e12f68c94f7a2d099b59de1d13b4c77ea5a4))
- Add support to automatically cleanup on final states, as well as to cleanup all other instances when starting a machine ([484fc21](https://github.com/Sphereon-Opensource/SSI-SDK/commit/484fc215a95232b861b81d6def6e42260ac8a1f9))
- Add support to start and resume xstate statemachines, with automatic persistence on state changes ([f6baae0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f6baae0527a80acfd423e4efe1c2f2b79e60bb8c))
- added unit tests and refactored plugin methods ([31eac66](https://github.com/Sphereon-Opensource/SSI-SDK/commit/31eac66d70168a74e9a79c0bb2e50c7dc942682a))
- Allow to use a customInstanceId as well as an existingInstanceId, so we can differentiate between re-using an existing machine and using a custom id ([3aeb93d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3aeb93d9b4dd373f445cec5cbe33d08364b2df74))

### Reverts

- Revert "chore: Make sure plugins having listener methods, actually expose the interface" ([99db568](https://github.com/Sphereon-Opensource/SSI-SDK/commit/99db56856054c86c2e8955d43a0b6e2c7a5228bf))
- Remove BBS support. ([205e0db](https://github.com/Sphereon-Opensource/SSI-SDK/commit/205e0db2bb985bf33a618576955d8b28a39ff932))

### BREAKING CHANGES

- Remove BBS support. Upstream support for Windows and RN is missing. Needs to be revisited at a later point in time
