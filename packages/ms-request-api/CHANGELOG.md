# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.15.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.15.1) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.ms-request-api





# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.ms-request-api





## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/ssi-sdk.ms-request-api

# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-07-30)

### Bug Fixes

- VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))

### Features

- Better support for MS Azure auth and re-using a MSAL client from Azure Request API ([61bdfaf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/61bdfaf202ee8e5fc6f1e9b83138298798a7a440))

# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-06-21)

### Features

- move schema generation to own plugin because of transitive dependency issues upstream ([58002a8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/58002a861f7ed504b0e1d4250d556f8414f961a0))
- move to pnpm ([2714a9c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2714a9c786b8591de41310a83aff19f62cf65e77))

# [0.11.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.1...v0.11.0) (2023-05-07)

### Features

- Create new agent-config module to replace the deps on Veramo cli, which pulls in everything ([673856f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/673856f587885743300aaafea791e3696d9c456f))

# [0.10.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.9.0...v0.10.0) (2023-04-30)

### Bug Fixes

- cleanup package.json files ([0cc08b6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0cc08b6acc168b838bff48b42fdabbdea4cd0899))

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Features

- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/ssi-sdk.ms-request-api

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

### Bug Fixes

- Update ion deps to remove problematic did-key p384 from transmute which depended on webcypto-asl which is not compatible with node >=14. ([386efc7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/386efc71b18195004773fc74eb51b62cd3f5dd76))

### Features

- add Microsoft Request Service API support ([251ed60](https://github.com/Sphereon-Opensource/SSI-SDK/commit/251ed60ebd6984d5fe494a764d8cd662dd0eba6d))

### Reverts

- Revert "MYC-184 Update main Version change 0.5.1 -> 0.5.2" ([b1b8cc6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b1b8cc635ebccb07c29465df32c3d352c5798855))
- Revert "MYC-184 uncommitted changes are added" ([fb4f878](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fb4f878dc1e03b9e390a4f886cccac66841256be))
