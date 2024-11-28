# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.30.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.30.0...v0.30.1) (2024-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-holder

# [0.29.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.28.0...v0.29.0) (2024-08-01)

### Bug Fixes

- Doesn't make sense to always download issuer images, even if we already have it stored. Other stability improvements for image handling ([b836ca1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b836ca1c21307174a3f706234981d98c5dbe0e52))

### Features

- update to new keyRefs instead of kids ([e969b97](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e969b97b387e62e2def5a0bac655f1fe5c7100a7))

# [0.28.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.27.0...v0.28.0) (2024-07-23)

### Bug Fixes

- Make sure we do not use the jwk thumbprint as kid default value when not in EBSI ([c4a22aa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c4a22aa684c1dd948ee9cd2f452eb40558355c36))
- Make sure we do not use the jwk thumbprint as kid default value when not in EBSI ([9a3bf56](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9a3bf568ebdddfcced66cdd5c52bd28aa0263bb6))
- Make sure we search for display and legal name based on issuer metadata name as well ([9a4cafd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9a4cafd286cedbc94b0b35a132bb87bd9b4db072))

# [0.27.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.26.0...v0.27.0) (2024-07-07)

### Bug Fixes

- added a guard to check the issuerBranding ([c6d8de2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c6d8de2ea8b3c02e940fcb098c037e7a0de1f7e4))
- fixed addIssuerBranding step ([3008b11](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3008b11d442c1ae9e619ef63d41ee609975c173f))
- fixed addIssuerBranding step after adding identity ([17aa278](https://github.com/Sphereon-Opensource/SSI-SDK/commit/17aa2781c4393fe03136a38e6371b7174353bc8c))

### Features

- added addIssuerBranding step to the vci machine ([6fba515](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6fba515b85c0f927856950e3d9c78bfb1f5b7917))
- Allow EBSI attestation client to be the start of a regular VCI flow ([afffd39](https://github.com/Sphereon-Opensource/SSI-SDK/commit/afffd399e2b5ad696047130b967f9b72cfd65649))
- Callback listeeners ([fce3670](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fce367041eed15ffc0d261ec2820470bf1615e3b))
- EBSI access token, attestation and DID support ([bed66b4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bed66b463c025dbd86637ba43c815ca08c5d16d2))
- EBSI DID registraiton/management ([7195786](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7195786bde800f3ce231ef4dd4fb1629a73143b2))
- EBSI headless attestation credentials ([6b6ad14](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6b6ad14d4be1c4cbca8e6d49cc73db4713e04f26))
- fixes after merge, modified some comment and prettier ([daebd26](https://github.com/Sphereon-Opensource/SSI-SDK/commit/daebd267102282971e98f9b3eb513d792dc50004))
- Get the authorization URL from a TI using a cloud/service wallet when requesting a particular attestation credential ([222c4d4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/222c4d451e84b6eb0c21a4c7a615ce1480f9dba9))
- Introduce EBSI attestation service to get VCs, for instance to onboard ([59f1809](https://github.com/Sphereon-Opensource/SSI-SDK/commit/59f1809a7098f96bab6eca25476314a4d0d245fc))

# [0.26.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.25.0...v0.26.0) (2024-06-19)

### Bug Fixes

- a bug in selecting the type of the credential that we're going to request ([c49b237](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c49b237e4d18baef520c59027f1f935df6a127d2))
- clientId fixes ([4fc568b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4fc568b852a1d444d32ba7a76e2bb8d8154428a8))
- clientId fixes ([cad41fc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cad41fc296a06b7e25dcd957da21eae4d02f7b46))
- Fixed broken tests ([d01859d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d01859dae7b04f311ed88bfa622b71201021f80d))
- updated vci package and fixed getSupportedCredential function ([780a377](https://github.com/Sphereon-Opensource/SSI-SDK/commit/780a37782881da1558f7b97d4d8c0ffd71317d21))
- updated version of vci and fixed the libs for it ([ceb6074](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ceb60748920fd78d318cb3544f69bef54b365c94))
- updated version of vci and fixed the libs for it ([de1d6aa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/de1d6aadcea1aac18bcd72a5651e3bb1e9f386d6))

### Features

- Adapted the plugin to accept https urls, added tests and documentation about the changes ([73ab5ae](https://github.com/Sphereon-Opensource/SSI-SDK/commit/73ab5ae19d49229128db067b2fcfa396d7ace466))
- allow default auth request options for VCI links/machines, like clientId and redirectUri ([434196e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/434196e4ce2f895b43ec9992d682a603aaa612a3))
- Allow to pass in state for url handler handle methods, allowing a statemachine to continue, without database persistence ([16e06e8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/16e06e8c2b879c6fe706568a48e254ab2693bf78))
- Run prettier ([2a9be95](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2a9be958378f14ea935a0d0d7d4d4ba254036c43))
- Support http(s) urls ([b3cc812](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b3cc8126e02ca1ae638180644518ec47cfcafbf7))
- Updated dependencies on the @sphereon/oid4vci ([00810ff](https://github.com/Sphereon-Opensource/SSI-SDK/commit/00810ff4a11f5b7794fdab431b47ca66f5e8f3f4))

# [0.25.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.24.0...v0.25.0) (2024-06-13)

### Features

- (WIP) added ownerId, tenantId, and origin. ([d9b8623](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d9b8623178b2a9f8dd7fae8ccfd3569e1e80d7b7))

# [0.24.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.4...v0.24.0) (2024-06-05)

### Features

- updated oid4vci-holder to support full flow ([63be076](https://github.com/Sphereon-Opensource/SSI-SDK/commit/63be07625e3e9d60b686a849e7af556599a4f6c2))

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
