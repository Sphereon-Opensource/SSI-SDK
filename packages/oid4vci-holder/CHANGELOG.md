# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.23.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.2...v0.23.4) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-holder

## [0.23.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.0...v0.23.1) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-holder

# [0.23.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.22.0...v0.23.0) (2024-04-24)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-holder

# [0.22.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.1...v0.22.0) (2024-04-04)

### Features

- Add option noStateMachinePersistence to VCI link handler to skip state machine persistence ([315b076](https://github.com/Sphereon-Opensource/SSI-SDK/commit/315b0766839b693540d8f5f576ace8e96715887c))

## [0.21.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.0...v0.21.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-holder

# [0.21.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.19.0...v0.21.0) (2024-03-20)

### Bug Fixes

- Resume OID4VCI with linkhandler and auth code flow was broken ([654cef4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/654cef4b64b0eb46f52c209e8dd6ae82528b02c9))
- Use response_uri instead of redirect_uri ([9c7c9ef](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9c7c9efc9c766ab43a01760bc5cedf3abea4c769))

### Features

- Allow to use a customInstanceId as well as an existingInstanceId, so we can differentiate between re-using an existing machine and using a custom id ([3aeb93d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3aeb93d9b4dd373f445cec5cbe33d08364b2df74))

### Reverts

- Revert "chore: Make sure plugins having listener methods, actually expose the interface" ([99db568](https://github.com/Sphereon-Opensource/SSI-SDK/commit/99db56856054c86c2e8955d43a0b6e2c7a5228bf))
- Remove BBS support. ([205e0db](https://github.com/Sphereon-Opensource/SSI-SDK/commit/205e0db2bb985bf33a618576955d8b28a39ff932))

### BREAKING CHANGES

- Remove BBS support. Upstream support for Windows and RN is missing. Needs to be revisited at a later point in time

# [0.19.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.1...v0.19.0) (2024-03-02)

### Bug Fixes

- VCI holder agent plugin credential and branding storage fixes ([901ff44](https://github.com/Sphereon-Opensource/SSI-SDK/commit/901ff4479e5442e8bca14ee1cd24f05b827874c2))

### Features

- added oid4vci-holder plugin ([e8507d4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e8507d4c5ca361886adf800c21e368c44ee8ffac))

# Change Log
