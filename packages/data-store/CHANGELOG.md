# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.30.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.30.0...v0.30.1) (2024-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

# [0.29.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.28.0...v0.29.0) (2024-08-01)

### Features

- expose date(time) types per database. Also enhance the datasources capabilities ([dd37e77](https://github.com/Sphereon-Opensource/SSI-SDK/commit/dd37e7703289acfd1f3d0afc8945bb7ebbe8d31f))
- update to new keyRefs instead of kids ([e969b97](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e969b97b387e62e2def5a0bac655f1fe5c7100a7))

# [0.28.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.27.0...v0.28.0) (2024-07-23)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

# [0.27.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.26.0...v0.27.0) (2024-07-07)

### Features

- added branding as an optional parameter to the party ([0b46c70](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0b46c701cc7104d2ef07672657b0493b09319e59))
- Callback listeeners ([fce3670](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fce367041eed15ffc0d261ec2820470bf1615e3b))
- EBSI DID registraiton/management ([7195786](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7195786bde800f3ce231ef4dd4fb1629a73143b2))
- EBSI headless attestation credentials ([6b6ad14](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6b6ad14d4be1c4cbca8e6d49cc73db4713e04f26))
- fixes after merge, modified some comment and prettier ([daebd26](https://github.com/Sphereon-Opensource/SSI-SDK/commit/daebd267102282971e98f9b3eb513d792dc50004))

# [0.26.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.25.0...v0.26.0) (2024-06-19)

### Bug Fixes

- a bug in migration CreateContacts ([0267460](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0267460f26705f70edffcfd0264c42e5afd2e0ce))
- clientId fixes ([cad41fc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cad41fc296a06b7e25dcd957da21eae4d02f7b46))

# [0.25.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.24.0...v0.25.0) (2024-06-13)

### Bug Fixes

- fix physical address building name validation ([b3508c0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b3508c0afb6d8b7736ec2edcd7121dccda193393))
- removed not null constraint from the SQL statement that adds the origin column ([95929d1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/95929d107dff75fcf88f52ee5dab84b9dcc8e64e))

### Features

- (WIP) added ownerId, tenantId, and origin. ([d9b8623](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d9b8623178b2a9f8dd7fae8ccfd3569e1e80d7b7))
- added pd-manager / pd-store ([ed77532](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ed77532c6b8c775870d3320f2e716a57b0da6ec1))
- Added the StudentEntity and refactored the migrations ([fb36a51](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fb36a513144354ca550d5f652d79b032995a20b7))

# [0.24.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.4...v0.24.0) (2024-06-05)

### Bug Fixes

- enum fixes ([dc3fb0d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/dc3fb0de9a6c61794cbce0e8a280a10be1c48314))

### Features

- updated oid4vci-holder to support full flow ([63be076](https://github.com/Sphereon-Opensource/SSI-SDK/commit/63be07625e3e9d60b686a849e7af556599a4f6c2))

## [0.23.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.2...v0.23.4) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

# [0.23.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.22.0...v0.23.0) (2024-04-24)

### Bug Fixes

- add PhysicalAddress migrations to postgres ([afd441c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/afd441ca1eccdb9438115de8b8e45d597dbf1fca))
- added default value to PartyType.origin ([8b9d5d2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8b9d5d205896b40c1f1f59bc0ab8dee9a4a2c16b))
- adjust PhysicalAddress postgres migration to follow code standards ([b8540fe](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b8540fecc85906f76ed8417e439324f833bc9983))
- Allowing null values of enum type column ([a4bc42b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a4bc42b404f26aebe110471b5248bbdaf1a672ba))
- Fixed origin column name ([d7a6ec1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d7a6ec15e9f7e9f422ca3a6574802d9602b85f60))
- made party origin mandatory in the \*Args types ([d8e8560](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d8e8560a27a61ff34e41b4513811e7a112bdd1a2))
- rework fix to include missing table in existing migration ([0862dbd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0862dbd4a479f120302afb83a4a21c70c9fe6e08))
- set uri to nullable in Party table ([38318ae](https://github.com/Sphereon-Opensource/SSI-SDK/commit/38318ae7a47e578c874d54495b6d75ebb03224e1))

### Features

- Added PartyOriginEnum to PartyType, wrote migrations and updated tests and updated the contact manager plugin ([07d8c1f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/07d8c1f7cdec110ced10277abd4d70edeb15c2d3))

# [0.22.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.1...v0.22.0) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

## [0.21.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.0...v0.21.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

# [0.21.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.19.0...v0.21.0) (2024-03-20)

### Bug Fixes

- changed the logic for getting validFrom ([7a7940b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7a7940b9e30358fef044f167622bc771df14a95f))
- fixed failing test cases and added more test cases for getting data from the raw data ([6f5b50b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6f5b50bbcc9c1822f2d0a4dbf5a13e197603d802))
- fixed import ([cf67a50](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cf67a507fdc5870e74a5e76b563721340c39fbfb))
- fixed XStatePersistence plugin and fixed the tests ([56d8f18](https://github.com/Sphereon-Opensource/SSI-SDK/commit/56d8f1883802208a2d15f2f25ec03b0bcfb0a4e3))
- refactored UniformCredential names to digitalCredential, added utility methods for getting the credential document type ([a0c5530](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a0c553048d3fbadaa55b7e987219064d32820221))

### Features

- (WIP) added tenant aware credential store ([db68113](https://github.com/Sphereon-Opensource/SSI-SDK/commit/db681137e4163a2144793c91c6efe3c46d76cce6))
- added pagination to digital credential store ([ecefdcf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ecefdcf4eccfa2d78fb9e815efdbe3881aa9e2f8))
- added tenant aware credential store ([312698e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/312698e42d18010e1c86ef14db7b96005043294f))
- Allow to use a customInstanceId as well as an existingInstanceId, so we can differentiate between re-using an existing machine and using a custom id ([3aeb93d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3aeb93d9b4dd373f445cec5cbe33d08364b2df74))
- Created migrations and refactored the database layer ([8672b82](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8672b82ecb9904223130bfc897855cedbf57cb29))

### Reverts

- Revert "chore: Make sure plugins having listener methods, actually expose the interface" ([99db568](https://github.com/Sphereon-Opensource/SSI-SDK/commit/99db56856054c86c2e8955d43a0b6e2c7a5228bf))
- Remove BBS support. ([205e0db](https://github.com/Sphereon-Opensource/SSI-SDK/commit/205e0db2bb985bf33a618576955d8b28a39ff932))

### BREAKING CHANGES

- Remove BBS support. Upstream support for Windows and RN is missing. Needs to be revisited at a later point in time

# [0.19.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.1...v0.19.0) (2024-03-02)

### Features

- added physical and electronic addresses to contact-manager ([76f78b3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/76f78b34b99c47b4c16fd9682d2520a7637219f7))
- event-logger improvements ([a3fdcd2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a3fdcd2c64c6ead46266e09a599785bbbdd45579))

## [0.18.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.0...v0.18.1) (2024-01-19)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

# [0.18.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.5...v0.18.0) (2024-01-13)

### Bug Fixes

- added ssi-sdk.core to data-store tsconfig plus added exposed query function to enablePostgresUuidExtension signature ([cb5d8cb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cb5d8cb2d9b5f89ced3957e3127d197190de03c2))
- added WithTypeOrmQuery type to core module and renamed enableUuidv4 to enablePostgresUuidExtension ([9bfb597](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9bfb597c378d3ca269cabcc001dc672f56a1be0a))
- document added ([80112ec](https://github.com/Sphereon-Opensource/SSI-SDK/commit/80112eca96026d09cc22b89f3651252559542e44))
- refactored usages of enablePostgresUuidExtension to accept queryRunner as the main param ([3654a8a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3654a8a070bed87fd9cab66184603cce4c298a05))

### Features

- Add bearer token support using callback function ([4528881](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4528881563104ac00b9af8d9615479c76af8a3be))
- Add static bearer token callback function option ([2d5cd5a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2d5cd5ad429aa5bf7a1864ce6a09bf2196e37d63))
- added enableUuidv4 to data-store exports ([d7c1237](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d7c1237c3c384fa6fc9d775f8f165abb6a96a40a))

## [0.17.5](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.4...v0.17.5) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

## [0.17.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.3...v0.17.4) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

## [0.17.3](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.2...v0.17.3) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

## [0.17.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.1...v0.17.2) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

## [0.17.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.0...v0.17.1) (2023-09-28)

### Bug Fixes

- update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))

# [0.17.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.1...v0.16.0) (2023-09-28)

### Features

- Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))
- statuslist2021 support ([2649b95](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2649b95dc5fe5882d6b43ccfdcf085e37918e713))
- statuslist2021 support ([46986dd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/46986dd9eae27aaa6a980eac55a8d5e1d5c85a57))

## [0.15.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.15.1) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-07-30)

### Bug Fixes

- VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))

# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-06-21)

### Features

- More support for definition Formats when creating VPs from SIOP ([846ef0b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/846ef0b359c4ec5755d9385c5f1c6db1fb14b0c1))
- move to pnpm ([2714a9c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2714a9c786b8591de41310a83aff19f62cf65e77))

# [0.11.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.1...v0.11.0) (2023-05-07)

### Features

- Create new agent-config module to replace the deps on Veramo cli, which pulls in everything ([673856f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/673856f587885743300aaafea791e3696d9c456f))

# [0.10.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.9.0...v0.10.0) (2023-04-30)

### Bug Fixes

- cleanup package.json files ([0cc08b6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0cc08b6acc168b838bff48b42fdabbdea4cd0899))

### Features

- Add better internal handling of JWT proof values used in JsonLD converted credentials ([90004c5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/90004c5886cd3f645f979b5e81dfc03e3ff3b862))
- added holder role to contact types ([728c8e1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/728c8e10be5ca3f5491c3f31870bbf57975c597b))
- Update to v2 PEX and v0.3 SIOP packages ([80398e3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/80398e36ab53ed46ebca715570242a466c83d5db))

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Features

- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.data-store
