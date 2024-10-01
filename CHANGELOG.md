# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.30.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.30.0...v0.30.1) (2024-10-01)

### Bug Fixes

- codecov ([e5a7eb7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e5a7eb771da447f09b0901d3570d7246a14888d4))
- codecov ([bc65177](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bc651778754e769c58de5fe225d429a7b1d01bd9))
- fixes issuer signed flow ([44dabf4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/44dabf46d5ea45db0ba3dc4d8e55343980011464))
- lerna version ([789d4d5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/789d4d551ecd2a7b1b7b9e0fe48cde64d01bb1ef))

# [0.29.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.28.0...v0.29.0) (2024-08-01)

### Bug Fixes

- Doesn't make sense to always download issuer images, even if we already have it stored. Other stability improvements for image handling ([b836ca1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b836ca1c21307174a3f706234981d98c5dbe0e52))
- Logger fixes ([75b6925](https://github.com/Sphereon-Opensource/SSI-SDK/commit/75b692530f01a4c83515a194fc6232418b802259))

### Features

- expose date(time) types per database. Also enhance the datasources capabilities ([dd37e77](https://github.com/Sphereon-Opensource/SSI-SDK/commit/dd37e7703289acfd1f3d0afc8945bb7ebbe8d31f))
- Remove dep on isomorphic-webcrypto ([44331b8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/44331b8781fb5e5627816509c744c4aef7f128cd))
- update to new keyRefs instead of kids ([e969b97](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e969b97b387e62e2def5a0bac655f1fe5c7100a7))

# [0.28.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.27.0...v0.28.0) (2024-07-23)

### Bug Fixes

- Add ebsi plugin schema ([422cf14](https://github.com/Sphereon-Opensource/SSI-SDK/commit/422cf14182d798dd0a0d6c126995edba14af9e3a))
- Ensure we always use the ES256 key for EBSI auth ([be7dc15](https://github.com/Sphereon-Opensource/SSI-SDK/commit/be7dc15537ec005fb7b3745c70dd0b7c4fd75300))
- Make sure we do not use the jwk thumbprint as kid default value when not in EBSI ([c4a22aa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c4a22aa684c1dd948ee9cd2f452eb40558355c36))
- Make sure we do not use the jwk thumbprint as kid default value when not in EBSI ([9a3bf56](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9a3bf568ebdddfcced66cdd5c52bd28aa0263bb6))
- Make sure we search for display and legal name based on issuer metadata name as well ([9a4cafd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9a4cafd286cedbc94b0b35a132bb87bd9b4db072))

### Features

- Allow to pass in additional keys for EBSI ([16aa9e2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/16aa9e21180b69643d03ba137b7e3d014d092caf))

# [0.27.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.26.0...v0.27.0) (2024-07-07)

### Bug Fixes

- added a guard to check the issuerBranding ([c6d8de2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c6d8de2ea8b3c02e940fcb098c037e7a0de1f7e4))
- extract PD name & purpose from definitionPayload ([9573ced](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9573cedf6031510b93c64c6f34dea97eb3a654d5))
- fixed addIssuerBranding step ([3008b11](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3008b11d442c1ae9e619ef63d41ee609975c173f))
- fixed addIssuerBranding step after adding identity ([17aa278](https://github.com/Sphereon-Opensource/SSI-SDK/commit/17aa2781c4393fe03136a38e6371b7174353bc8c))
- remove execution of loading env files ([1937c14](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1937c14a7021054b6015a7ff9dabb6b5b2bb08dd))

### Features

- Add JWKS hosting per DID ([70e41d7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/70e41d797b50f6dd5e9fe250f4cec1fdb615c029))
- added addIssuerBranding step to the vci machine ([6fba515](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6fba515b85c0f927856950e3d9c78bfb1f5b7917))
- added branding as an optional parameter to the party ([0b46c70](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0b46c701cc7104d2ef07672657b0493b09319e59))
- Allow EBSI attestation client to be the start of a regular VCI flow ([afffd39](https://github.com/Sphereon-Opensource/SSI-SDK/commit/afffd399e2b5ad696047130b967f9b72cfd65649))
- Callback listeeners ([fce3670](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fce367041eed15ffc0d261ec2820470bf1615e3b))
- EBSI access token, attestation and DID support ([bed66b4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bed66b463c025dbd86637ba43c815ca08c5d16d2))
- EBSI DID registraiton/management ([7195786](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7195786bde800f3ce231ef4dd4fb1629a73143b2))
- EBSI headless attestation credentials ([6b6ad14](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6b6ad14d4be1c4cbca8e6d49cc73db4713e04f26))
- fixes after merge, modified some comment and prettier ([daebd26](https://github.com/Sphereon-Opensource/SSI-SDK/commit/daebd267102282971e98f9b3eb513d792dc50004))
- Get the authorization URL from a TI using a cloud/service wallet when requesting a particular attestation credential ([222c4d4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/222c4d451e84b6eb0c21a4c7a615ce1480f9dba9))
- implement Oid4VP authorization token support ([5fdbd65](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5fdbd6597ce1fa00ba914e56810fc3f4f8ec06b8))
- Introduce EBSI attestation service to get VCs, for instance to onboard ([59f1809](https://github.com/Sphereon-Opensource/SSI-SDK/commit/59f1809a7098f96bab6eca25476314a4d0d245fc))
- Siopv2Holder module implementing xstate Siopv2Machine ([7dd0651](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7dd0651c4f94f42c241e0eeaf3fe905e572f03ed))

# [0.26.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.25.0...v0.26.0) (2024-06-19)

### Bug Fixes

- a bug in migration CreateContacts ([0267460](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0267460f26705f70edffcfd0264c42e5afd2e0ce))
- a bug in selecting the type of the credential that we're going to request ([c49b237](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c49b237e4d18baef520c59027f1f935df6a127d2))
- clientId fixes ([4fc568b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4fc568b852a1d444d32ba7a76e2bb8d8154428a8))
- clientId fixes ([cad41fc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cad41fc296a06b7e25dcd957da21eae4d02f7b46))
- Fixed broken tests ([d01859d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d01859dae7b04f311ed88bfa622b71201021f80d))
- Make sure we import path/fs only when really needed for object-creation. Ensure we use agent-config plugin only in places it is needed ([76b4f53](https://github.com/Sphereon-Opensource/SSI-SDK/commit/76b4f53693ba6105fc00bdd93d78587defc9e183))
- updated vci package and fixed getSupportedCredential function ([780a377](https://github.com/Sphereon-Opensource/SSI-SDK/commit/780a37782881da1558f7b97d4d8c0ffd71317d21))
- updated version of vci and fixed the libs for it ([ceb6074](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ceb60748920fd78d318cb3544f69bef54b365c94))
- updated version of vci and fixed the libs for it ([de1d6aa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/de1d6aadcea1aac18bcd72a5651e3bb1e9f386d6))

### Features

- Adapted the plugin to accept https urls, added tests and documentation about the changes ([73ab5ae](https://github.com/Sphereon-Opensource/SSI-SDK/commit/73ab5ae19d49229128db067b2fcfa396d7ace466))
- allow default auth request options for VCI links/machines, like clientId and redirectUri ([434196e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/434196e4ce2f895b43ec9992d682a603aaa612a3))
- Allow to pass in options when emitting link handler events ([0293342](https://github.com/Sphereon-Opensource/SSI-SDK/commit/02933423f1e3c68621b4fc80c574b531e47211b4))
- Allow to pass in state for url handler handle methods, allowing a statemachine to continue, without database persistence ([16e06e8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/16e06e8c2b879c6fe706568a48e254ab2693bf78))
- Run prettier ([2a9be95](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2a9be958378f14ea935a0d0d7d4d4ba254036c43))
- Support http(s) urls ([b3cc812](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b3cc8126e02ca1ae638180644518ec47cfcafbf7))
- Updated dependencies on the @sphereon/oid4vci ([00810ff](https://github.com/Sphereon-Opensource/SSI-SDK/commit/00810ff4a11f5b7794fdab431b47ca66f5e8f3f4))

# [0.25.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.24.0...v0.25.0) (2024-06-13)

### Bug Fixes

- Ensure logger is initialized early preventing potential issues when importing from other libraries ([eae66f2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/eae66f2e93a4fb54520284ed948feca09d829398))
- fix physical address building name validation ([b3508c0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b3508c0afb6d8b7736ec2edcd7121dccda193393))
- Order of static keys to ensure default namespace key is available when creating the default logger ([dc56df2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/dc56df22045944f48a2f7c32b04d099ac7b231e9))
- removed not null constraint from the SQL statement that adds the origin column ([95929d1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/95929d107dff75fcf88f52ee5dab84b9dcc8e64e))

### Features

- (WIP) added ownerId, tenantId, and origin. ([d9b8623](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d9b8623178b2a9f8dd7fae8ccfd3569e1e80d7b7))
- added pd-manager / pd-store ([ed77532](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ed77532c6b8c775870d3320f2e716a57b0da6ec1))
- added sd-jwt plugin ([85d8aeb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85d8aebd719b14ed8c275e30ae283d11d237730d))
- Added the StudentEntity and refactored the migrations ([fb36a51](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fb36a513144354ca550d5f652d79b032995a20b7))

# [0.24.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.4...v0.24.0) (2024-06-05)

### Bug Fixes

- enum fixes ([dc3fb0d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/dc3fb0de9a6c61794cbce0e8a280a10be1c48314))

### Features

- added deactivateDidEndpoint function according to decentralized-identity's universal-registrar and renamed previous method as deleteDidEndpoint and marked it as deprecated ([39a6601](https://github.com/Sphereon-Opensource/SSI-SDK/commit/39a660160fd245a86b368479b3792485f13bee32))
- expose contact manager methods for rest implementation ([37bbfd2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/37bbfd21db2197c1af027a958aab9551a932aaca))
- updated oid4vci-holder to support full flow ([63be076](https://github.com/Sphereon-Opensource/SSI-SDK/commit/63be07625e3e9d60b686a849e7af556599a4f6c2))

## [0.23.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.2...v0.23.4) (2024-04-25)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

## [0.23.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.1...v0.23.2) (2024-04-25)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

## [0.23.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.0...v0.23.1) (2024-04-25)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

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

- add kb-jwt to sd-jwt ([e066f2b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e066f2b1a0c3d89796ce00af39511ce8a05b39e7))
- Added PartyOriginEnum to PartyType, wrote migrations and updated tests and updated the contact manager plugin ([07d8c1f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/07d8c1f7cdec110ced10277abd4d70edeb15c2d3))

# [0.22.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.1...v0.22.0) (2024-04-04)

### Features

- Add option noStateMachinePersistence to VCI link handler to skip state machine persistence ([315b076](https://github.com/Sphereon-Opensource/SSI-SDK/commit/315b0766839b693540d8f5f576ace8e96715887c))

## [0.21.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.0...v0.21.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

# [0.21.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.19.0...v0.21.0) (2024-03-20)

### Bug Fixes

- changed the logic for getting validFrom ([7a7940b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7a7940b9e30358fef044f167622bc771df14a95f))
- fixed failing test cases and added more test cases for getting data from the raw data ([6f5b50b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6f5b50bbcc9c1822f2d0a4dbf5a13e197603d802))
- fixed import ([cf67a50](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cf67a507fdc5870e74a5e76b563721340c39fbfb))
- fixed XStatePersistence plugin and fixed the tests ([56d8f18](https://github.com/Sphereon-Opensource/SSI-SDK/commit/56d8f1883802208a2d15f2f25ec03b0bcfb0a4e3))
- refactored UniformCredential names to digitalCredential, added utility methods for getting the credential document type ([a0c5530](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a0c553048d3fbadaa55b7e987219064d32820221))
- Resume OID4VCI with linkhandler and auth code flow was broken ([654cef4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/654cef4b64b0eb46f52c209e8dd6ae82528b02c9))
- Use response_uri instead of redirect_uri ([9c7c9ef](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9c7c9efc9c766ab43a01760bc5cedf3abea4c769))

### Features

- (WIP) added tenant aware credential store ([db68113](https://github.com/Sphereon-Opensource/SSI-SDK/commit/db681137e4163a2144793c91c6efe3c46d76cce6))
- Add rest client mode to xstate-machine-persistence, allowing to process local events but delegate the execution to a REST server ([02c5e12](https://github.com/Sphereon-Opensource/SSI-SDK/commit/02c5e12f68c94f7a2d099b59de1d13b4c77ea5a4))
- Add support to automatically cleanup on final states, as well as to cleanup all other instances when starting a machine ([484fc21](https://github.com/Sphereon-Opensource/SSI-SDK/commit/484fc215a95232b861b81d6def6e42260ac8a1f9))
- Add support to create DID on demand when talking to RP with SIOP ([68a6dee](https://github.com/Sphereon-Opensource/SSI-SDK/commit/68a6dee252e1325f4eb6fbdfa3b1a2a5d9ccaf61))
- Add support to start and resume xstate statemachines, with automatic persistence on state changes ([f6baae0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f6baae0527a80acfd423e4efe1c2f2b79e60bb8c))
- added pagination to digital credential store ([ecefdcf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ecefdcf4eccfa2d78fb9e815efdbe3881aa9e2f8))
- added tenant aware credential store ([312698e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/312698e42d18010e1c86ef14db7b96005043294f))
- added unit tests and refactored plugin methods ([31eac66](https://github.com/Sphereon-Opensource/SSI-SDK/commit/31eac66d70168a74e9a79c0bb2e50c7dc942682a))
- Allow to use a customInstanceId as well as an existingInstanceId, so we can differentiate between re-using an existing machine and using a custom id ([3aeb93d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3aeb93d9b4dd373f445cec5cbe33d08364b2df74))
- Basic structure of plugin created ([16160de](https://github.com/Sphereon-Opensource/SSI-SDK/commit/16160decdc991d3628d8f540bf4c1bd4a58676c5))
- Created migrations and refactored the database layer ([8672b82](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8672b82ecb9904223130bfc897855cedbf57cb29))
- upgrade SD-JWT package ([6563973](https://github.com/Sphereon-Opensource/SSI-SDK/commit/656397349c5d36334cde10f08c469242eb4c48f5))

### Reverts

- Revert "chore: Make sure plugins having listener methods, actually expose the interface" ([99db568](https://github.com/Sphereon-Opensource/SSI-SDK/commit/99db56856054c86c2e8955d43a0b6e2c7a5228bf))
- Remove BBS support. ([205e0db](https://github.com/Sphereon-Opensource/SSI-SDK/commit/205e0db2bb985bf33a618576955d8b28a39ff932))

### BREAKING CHANGES

- Remove BBS support. Upstream support for Windows and RN is missing. Needs to be revisited at a later point in time

# [0.19.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.1...v0.19.0) (2024-03-02)

### Bug Fixes

- changed image-size library version to a react friendly one ([308bad7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/308bad797278ed1ba79102a4115d36ff53c4207a))
- changed the image-size usage to handle uint8array ([1a0e080](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1a0e0808b05208dad3392d0e3292aa0438cfd4af))
- fixed the svg problem with image-size ([d7823eb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d7823eb6ee48fb3529e868e7f22a9a001f70983e))
- Instead of figuring out the proof format, we defaulted to JWT credentials if the format was not supplied, bypassing the detection code ([8cba122](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8cba12221d70e8436eaace2d1e770017199aa6ce))
- JWT VP sometimes was constructed as a JSON LD VP with JwtProof2020 ([abb012c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/abb012c99ff4fbce241b3c78b602783d22c88b5e))
- modified handling svg files in ssi-sdk.core ([c86188e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c86188e5725e5d2d3cf8e18612ba987cea6944f0))
- Several JWT Verifiable Presentation fixes, like missing kid, iat, exp values. Also include a holder in the vp payload, as some RPs require it, although it is optional for a JWT ([30d8c54](https://github.com/Sphereon-Opensource/SSI-SDK/commit/30d8c549d9d2387808407e173a0ef80850d9b9c0))
- VCI holder agent plugin credential and branding storage fixes ([901ff44](https://github.com/Sphereon-Opensource/SSI-SDK/commit/901ff4479e5442e8bca14ee1cd24f05b827874c2))

### Features

- Add initial OID4VP ID2 support ([85325ae](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85325ae7cdf6b28d32442a38779f25ee627dd86f))
- added oid4vci-holder plugin ([e8507d4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e8507d4c5ca361886adf800c21e368c44ee8ffac))
- added physical and electronic addresses to contact-manager ([76f78b3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/76f78b34b99c47b4c16fd9682d2520a7637219f7))
- added remote-server-rest-api ([0076160](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0076160849ea57f37228819d675a797595c1df32))
- Allow i18n for JSONLD credentials ([1ce843e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1ce843e01cf842adbe9a82f9e6f69c94af9610b5))
- Allow to pass in nonce when creating the auth request URI ([82f82ef](https://github.com/Sphereon-Opensource/SSI-SDK/commit/82f82efe4dd058dc3c30c977493f2ed5f1fe206f))
- Correct submission_data when send in incorrectly as string ([c5d6b76](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c5d6b7663cbddd4ff62260508b64faab90ade097))
- event-logger improvements ([a3fdcd2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a3fdcd2c64c6ead46266e09a599785bbbdd45579))
- Reuse existing PEX for performance ([9c8966c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9c8966c94e39130aeace3ad73ac6583312ba42f2))
- Support selecting did methods from aud claim of request. ([0bfc03d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0bfc03d3e5713b6d8c4e129c79fcbb8eb1ac794a))

### Reverts

- Revert "chore: update deps" ([f83aee5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f83aee5e7c3a22a6727ed55dd9b92f33ba5c0fc8))

## [0.18.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.0...v0.18.1) (2024-01-19)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

# [0.18.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.5...v0.18.0) (2024-01-13)

### Bug Fixes

- added ssi-sdk.core to data-store tsconfig plus added exposed query function to enablePostgresUuidExtension signature ([cb5d8cb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cb5d8cb2d9b5f89ced3957e3127d197190de03c2))
- added WithTypeOrmQuery type to core module and renamed enableUuidv4 to enablePostgresUuidExtension ([9bfb597](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9bfb597c378d3ca269cabcc001dc672f56a1be0a))
- document added ([80112ec](https://github.com/Sphereon-Opensource/SSI-SDK/commit/80112eca96026d09cc22b89f3651252559542e44))
- export enablePostgresUuidExtension and WithTypeOrmQuery to core exports ([5161837](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5161837faa55b7632cbaa66200d6875ae3534569))
- refactored usages of enablePostgresUuidExtension to accept queryRunner as the main param ([3654a8a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3654a8a070bed87fd9cab66184603cce4c298a05))

### Features

- Add bearer token support using callback function ([4528881](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4528881563104ac00b9af8d9615479c76af8a3be))
- Add static bearer token callback function option ([2d5cd5a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2d5cd5ad429aa5bf7a1864ce6a09bf2196e37d63))
- added enableUuidv4 to data-store exports ([d7c1237](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d7c1237c3c384fa6fc9d775f8f165abb6a96a40a))
- **ssi-types:** add kid to cnf ([0fb3886](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0fb3886eb36e1b9e31f38a4a7812cd8e36437f54))
- **ssi-types:** sd-jwt support ([b9154a0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b9154a097cb3428204f65eca024222e70e8ca17b))

### Reverts

- Revert "chore: update deps" ([a1cd971](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a1cd971c4edcff58e0ee225dd159a4e6958f58d1))

## [0.17.5](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.4...v0.17.5) (2023-10-01)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

## [0.17.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.3...v0.17.4) (2023-10-01)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

## [0.17.3](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.2...v0.17.3) (2023-09-30)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

## [0.17.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.1...v0.17.2) (2023-09-30)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

## [0.17.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.0...v0.17.1) (2023-09-28)

### Bug Fixes

- update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))

# [0.17.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([2dde4b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2dde4b7ec63f579d208a8ea676e063cfe3b3a2ed))
- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.1...v0.16.0) (2023-09-28)

### Bug Fixes

- Create a issuer.id in a uniform credential in case the issuer is already an object and there is an iss claim in the JWT ([706baff](https://github.com/Sphereon-Opensource/SSI-SDK/commit/706baffee81c1a6993bf1573a083696c45cb3ab9))
- Ed25519 2018 handling for verification ([b858710](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b858710167a34a6a1c968f459cfae207b0d5a226))
- Ed25519 2018 handling for verification ([14125e5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/14125e58070e89b0c1a95769f24af79c0c1e1df5))
- Fix multibase/codec code ([4354927](https://github.com/Sphereon-Opensource/SSI-SDK/commit/43549278bb1a2f10f8eb4fab03abcd78c234bda2))
- fixed partyId property in rest api ([51861fd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/51861fd35110b57975c4d897893a65f670e50430))
- Internally alg needs uppercase ([0388f11](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0388f117d6cf1d753cf0eff10a3ab6a98f10faa0))
- Make sure we do not throw an error when the IDP does not have an end_session_url ([781e250](https://github.com/Sphereon-Opensource/SSI-SDK/commit/781e2500a3296fb74f3c774b8e2862cbca9abdb0))
- Secp256k recovery 2020 fix ([196ad4c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/196ad4c158cc5c51400c17ed52f521b3deeb52e8))
- Secp256k recovery 2020 fix ([8be1da2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8be1da2a13572ec3dace13d87f9206d357f34266))

### Features

- Add auth support to VCI REST client ([c541b23](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c541b2347f4d602e5a017116e5d0155e8d6290dd))
- Add initial versions of VC API clients back ([f6465cf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f6465cf91e32e29349e91e203a2354cb229052ad))
- Add static header support to siop rest client ([e9fb5ee](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e9fb5ee97e9f466b87a7a0424392571cff9fd56c))
- Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))
- Add web3 signer/wallet support directly using KMS, so you can use keys managed by the KMS in web3, without ever having to expose private keys ([e3d3df7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e3d3df746efd076a93d8452c79360840026f58b5))
- added contact test data ([daeb87d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/daeb87d5a5f3f955b096be44e098d053f78a885b))
- Allow VCI issuer to also supply the issuer DID when the credential issuer is an object without an id ([7c72d31](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7c72d31e05b90d0064dcff5ab25c985636438ec8))
- statuslist2021 functions ([61729f3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/61729f3c2808a96339ee64a82ff8cce12b1ecef2))
- statuslist2021 support ([2649b95](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2649b95dc5fe5882d6b43ccfdcf085e37918e713))
- statuslist2021 support ([46986dd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/46986dd9eae27aaa6a980eac55a8d5e1d5c85a57))
- web3 headless provider and wallet ([00fc40a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/00fc40a6fd2ade1cab03d750a1c012ca8cb6d05a))
- web3 headless provider and wallet ([c69cf9e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c69cf9e65de30180e2898ed2289c572fe228eb20))
- web3 headless provider and wallet ([62dc7df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/62dc7dfb43b0461707d4ef2afc6f21406e57ae5e))

## [0.15.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.15.1) (2023-08-10)

### Bug Fixes

- /well-known/did/json wasn't resolving anymore because of an incorrect path match ([e94f4da](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e94f4dad1eef2f1e428eef0967b4c75c6509f77c))

# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-08-10)

### Bug Fixes

- Alg header was not correctly set, and we do support ES256 for JsonWebSignature2020 now ([d8e961c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d8e961c984ca522ebb657b420853e4c0687161f8))
- Authentication fixes ([adafd6b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/adafd6bd09142492f7b3bddbab8d03ae24cf8600))

### Features

- Add graceful http server termination ([bba073b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bba073b22afe1e09663532ac4427cf3a16a9e734))
- Add morgan logging to express builder. Allow expres to start from build result ([caa4909](https://github.com/Sphereon-Opensource/SSI-SDK/commit/caa4909009d33d0bade1df637b354af8a89d9a4b))
- Add optional entra ID auth builder ([960f2df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/960f2dfc645ca09567765e6cb67df5915cd02183))
- Add optional static bearer auth builder, with hashed tokens ([6a7dd17](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6a7dd1799ada74a4fa8d1a8b0ce3f89ffc043d5a))
- Allow document loader to also load DID from the agent and fall back to the universal resolver (all configurable) ([f2f9fbc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f2f9fbc0c999664c8c1cfdd4b0f0204ea1b8ccf1))
- allow signing credential with local resolved DID. Especially handy for did:web that is not yet published/exposed ([34793e9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/34793e9bacc7dfcc689ad8c11119d5f7d7b1d3ef))
- Separate SIOPv2 REST API into individual functions and use express-support ([2495980](https://github.com/Sphereon-Opensource/SSI-SDK/commit/24959808b9a4b59cec5171e2abb5fdc260448b98))

## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace

# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-07-30)

### Bug Fixes

- also publish when on a fix branch ([e8b678e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e8b678e13205c68e44c0ec63d8a915c5e7d63b24))
- also publish when on a fix branch. Also run a diff before the frozen lockfile install so we can see what's going on ([69a3200](https://github.com/Sphereon-Opensource/SSI-SDK/commit/69a3200b6185498dd9554193717db0c81fbdd31a))
- CI was still using yarn instead if pnpm in several places ([ca16f70](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ca16f70274168a50fed284aeea2f29ed40e4ec5b))
- CI was still using yarn instead if pnpm in several places ([c167259](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c16725978df96647cb346c47c8a1ef4489ab13cb))
- Fix relative DID resolution and Json websignature 2020 verification for ED25519 and some other algs ([ca2682c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ca2682c0b747f5052143c943a06f23acc7aa22cc))
- Use agent resolver if not set, with fallback to universal resolver. Fix bug in response message ([43c9313](https://github.com/Sphereon-Opensource/SSI-SDK/commit/43c9313ee623fa0848dca8dcd4e2e509692c28d7))
- VCI did resolution from agent ([7aa2bd3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7aa2bd30e4ee51d3322415b8a06533e91f07b97d))
- VCI did resolution from agent ([2c913db](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2c913dbe635337f0931032023a17c0cfd3d739ce))
- VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))

### Features

- Add express builder, cors configurer, passport authentication and casbin authorization support for APIs. ([cb04fe8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cb04fe8b84ce6f4c840afef43d628f23cb8e9e36))
- Add global web resolution provider. Add json error handler ([f19d1d1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f19d1d135a9944a6c9e4c6040c58e7563c4442f2))
- Add partial DIF Universal Registrar and Resolver support ([69c8046](https://github.com/Sphereon-Opensource/SSI-SDK/commit/69c8046b214771b54d731c19f295341cf22d0616))
- Add seperate did:web service to host did.json files managed by the agent ([0a8a0bb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0a8a0bb201742c3208f98267f9a03fcaeb32ec56))
- Add support for ES256(k/r) in JsonWebsignature2020 signing ([cd511d5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cd511d55a66798936218b5968f8daac9a549a9b7))
- Allow objects for error response. Improve json handling in error responses ([4151c73](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4151c73b4cdeb931c0deb8b8f34ed9c215efe5ba))
- Better support for MS Azure auth and re-using a MSAL client from Azure Request API ([61bdfaf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/61bdfaf202ee8e5fc6f1e9b83138298798a7a440))
- Move VC API endpoints to functions, to more easily create your own API server, only supporting certain endpoints ([fc03507](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fc0350735c8cd42a60e1152add9cb49da5c39e62))

# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- allow default opts to be set when OID4VCI is running ([7142273](https://github.com/Sphereon-Opensource/SSI-SDK/commit/71422737036c01c095459676858b754b7b10ddfd))
- allow did opts from default options to be populated in instance options ([41deb99](https://github.com/Sphereon-Opensource/SSI-SDK/commit/41deb9974dcffcca007c4fba9f037f2f75a0bda4))
- allow instance opts to be set when OID4VCI is running but only when having access to the object directly ([51f873e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/51f873e34dec7ddca92cae6d625c1694a483b2cb))
- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-06-21)

### Bug Fixes

- added dev dependencies for oid4vci-issuer-rest-client plus prettier ([7b6c2b3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7b6c2b3d08aedfe357345fac47e94be4dcd3d243))
- added schema export for oid4vci-issuer-rest-client and some docs ([7db9c1b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7db9c1be4775f55cf6db4470db1d99e0efdf5caa))
- changed credentials and grants to mandatory plus renamed the uri to url ([2df3612](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2df36125a3062250ab0a7a69eca3c83cdb8c450d))
- fix test cases and REST arguments ([975801e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/975801e1e6c8270fd470acd7e2ce67ae4971a16f))
- fixed a bug in calling cross-fetch with post, modified the tests ([a3defeb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a3defeb5d62ff7f4007a88cd772b2164c136da7a))
- skipped integration tests in oid4vci-issuer-rest-client ([c43759b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c43759bebc7350cc400d668369105a8cff0e3ee1))
- unify naming ([aee0bf1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aee0bf1a7a94142c10561fd7295d1d0950c29221))
- unify naming ([ec7d0b6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ec7d0b6ced54a792ede23937c7043e53d7121e42))
- unify naming ([94165cd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/94165cdb8d1cf14f866de7fc5fe2c518a97b1986))
- updated generate-plugin-schema for oid4vci-rest-client ([70e7820](https://github.com/Sphereon-Opensource/SSI-SDK/commit/70e7820b6e59b3bfdd9de5b15de0718de1826738))

### Features

- Add issue status support to OID4VCI REST client ([40abd83](https://github.com/Sphereon-Opensource/SSI-SDK/commit/40abd8320dd0097e2e024c2e61ce2f03359926ab))
- Add key value store plugin ([95244fa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/95244fa9f6c79d47660f1afee39c2c9db50f0e27))
- Add OID4VCI issuer modules ([af85f1e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/af85f1e2aace201c5749eef2e1a3fb8223ae7937))
- Add Presentation Exchange module ([a085c81](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a085c81a2608dd072e9b2c3d49174b76dab9705a))
- Add SIOPv2 Relying Party logic and REST API ([01f2023](https://github.com/Sphereon-Opensource/SSI-SDK/commit/01f2023a4112f04412df4df318c6eacf9da536a7))
- Add SIOPv2OID4VP RP auth and REST module ([91b1da3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/91b1da3548fd425aa93424411339e1ec2a2e0fd3))
- added oid4vci-rest-client package ([910f697](https://github.com/Sphereon-Opensource/SSI-SDK/commit/910f697f08dc05e3c16dafb239b7ee85bc68b431))
- Allow to supply data for VCI Issuer REST client and server during offer ([0878c28](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0878c2848aa5144ee863e6f192c9f8b8eb46ff34))
- changed the test structure and few other pr notes addressed ([6520fbe](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6520fbe297ab9a1c5f5fbaff5cabb98f51d3cbea))
- More support for definition Formats when creating VPs from SIOP ([846ef0b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/846ef0b359c4ec5755d9385c5f1c6db1fb14b0c1))
- move schema generation to own plugin because of transitive dependency issues upstream ([51c5156](https://github.com/Sphereon-Opensource/SSI-SDK/commit/51c5156bdf83e12d55bc4e609d741c6ff878daa8))
- move schema generation to own plugin because of transitive dependency issues upstream ([58002a8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/58002a861f7ed504b0e1d4250d556f8414f961a0))
- move to pnpm ([2714a9c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2714a9c786b8591de41310a83aff19f62cf65e77))

### Reverts

- Revert "chore: remove plugin schemas" ([2870d77](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2870d77a6e1919e94f554e71100fbcdb4fed47af))
- Revert "chore: remove plugin schemas" ([07af699](https://github.com/Sphereon-Opensource/SSI-SDK/commit/07af6996b3209e86d588666c0c0da9ea9e17442c))

# [0.11.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.1...v0.11.0) (2023-05-07)

### Bug Fixes

- make credential mapper a bit more resilient ([36c420e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/36c420e5070a9233568bbd389ffd8a3190e65ec7))
- make credential mapper a bit more resilient ([ce5b487](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ce5b487d4b5831aa033615fec9e4a45c19c1f3f7))
- make credential mapper a bit more resilient ([7248fae](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7248fae74f4d3a300bce5bdfb1180267b7bd9c2d))

### Features

- Create new agent-config module to replace the deps on Veramo cli, which pulls in everything ([6ac4ec0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6ac4ec0469ef2bd2344da0a2f7e6c9673c20e232))
- Create new agent-config module to replace the deps on Veramo cli, which pulls in everything ([673856f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/673856f587885743300aaafea791e3696d9c456f))
- instead of returning a boolean value, return an object with more information about verification of LD creds/VPs ([7df0e64](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7df0e64ad6553e8153cf96d62156867fde8e4cef))

## [0.10.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.0...v0.10.1) (2023-05-01)

**Note:** Version bump only for package SSI-SDK-workspace

# [0.10.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.9.0...v0.10.0) (2023-04-30)

### Bug Fixes

- bbs+ fixes and updates ([84c08f1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/84c08f19f2d40ba7aef0c3b5642c99fe857a2d84))
- bbs+ fixes and updates ([fc228a2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fc228a2e85d72e0e1118d71ed8ce6252f4bc273b))
- bbs+ fixes and updates ([efcbf2c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/efcbf2c6a7efc68746d2fc1873fee372cc7cc94a))
- bbs+ fixes and updates ([871cf66](https://github.com/Sphereon-Opensource/SSI-SDK/commit/871cf6669374bfd83c6c2d05608aaf502bbd9a7b))
- bbs+ fixes and updates ([ae9e903](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ae9e9032b23036d44b3791da416229cd6db5b776))
- cleanup package.json files ([aca017b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aca017b322fa302461d7a8482f4814c7fe1b0f9d))
- cleanup package.json files ([0cc08b6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0cc08b6acc168b838bff48b42fdabbdea4cd0899))
- decoded JWT VPs/VCs did not contain everything ([612b082](https://github.com/Sphereon-Opensource/SSI-SDK/commit/612b082d754eb90402160f423d939f3a6f9ec181))
- decoded JWT VPs/VCs did not contain everything ([fd7ff68](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fd7ff680bbfbfbfbf0cd4ba96948b805ac97c6dd))

### Features

- Add better internal handling of JWT proof values used in JsonLD converted credentials ([90004c5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/90004c5886cd3f645f979b5e81dfc03e3ff3b862))
- added holder role to contact types ([728c8e1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/728c8e10be5ca3f5491c3f31870bbf57975c597b))
- More support for definition Formats when creating VPs from SIOP ([61c4120](https://github.com/Sphereon-Opensource/SSI-SDK/commit/61c412015a4d1ddf2a306e05185738cdecfc535f))
- Update to v2 PEX and v0.3 SIOP packages ([80398e3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/80398e36ab53ed46ebca715570242a466c83d5db))

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Bug Fixes

- credential mapper for jtw ([f04345b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f04345b97ff9a78a3dff096599f0b675b3239a3e))
- default contexts are not using node fs/path anymore ([5a87aa3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5a87aa3eeed588b910636b358c7d718ae74f54c9))
- default contexts are not using node fs/path anymore ([8f1b17a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8f1b17aa12014abb393f77833f4fb8b22bfc7d2b))
- default contexts are not using node fs/path anymore ([51fd687](https://github.com/Sphereon-Opensource/SSI-SDK/commit/51fd687fba69aaeda7e686d2ec6241fb4668e229))
- deps ([ec062f8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ec062f8ec01de800469ef10b05b0a79a5ba5dea7))
- Disable factom tests ([099a303](https://github.com/Sphereon-Opensource/SSI-SDK/commit/099a303c93d366a3714ef57384b3793b96a8fee3))
- Fix DID handling in OP session ([926e358](https://github.com/Sphereon-Opensource/SSI-SDK/commit/926e358ef3eadf19fc3c8f7c9940fe6322c5ff85))
- fix private key hex from Pem ([0204094](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0204094e7b7fd33314a31df5d06344f54e6f6442))
- Incorrect verification method id returned when signing credentials in some cases ([bdbf4ef](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bdbf4ef55e50a9d19d7998a5ceac7136034524ef))
- Incorrect verification method id returned when signing credentials in some cases ([c508507](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c508507ddd2e35fcb377a79bad3c82d695b3d93d))
- JWT claims would overwrite the issuer object in the credential. Disable Factom tests ([f41cf64](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f41cf64790d484ad8b9721fe347e81e2153898b9))
- make sure cross-fetch is used to fetch ([7033a2e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7033a2e5a80935335e5ad7989f1c03850270a986))
- Make sure we follow JWS detached signing for JsonWebSignature2020 ([3da5bad](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3da5bad3a79efc42755e354e86ecedc76a2828eb))
- missing awaits for signing presentations ([518b8fc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/518b8fc82e26711bc6204d5e0d66bbf04b0844c1))
- Move parseDid method to ssi-types ([0b28de3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0b28de3de21afd0a224d3d174103e072162231ed))
- QR code testing. Remove enzyme as it is not compatible with React 18 ([62debd9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/62debd972f51a3f1ad90e922115eed4c2f56cefb))
- Remove non dev dep on veramo-core ([8cb8efe](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8cb8efec1fc97581640a8254fe412abc8fea4305))
- Remove workaround for verifier missing with ed25519 key ([2e97af6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2e97af6eeab2fe0530cd12425fd6eaf72f42a012))
- RSA fixes for suite ([b163872](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b163872e14a43b3566db1413497885cb918b982b))
- RSA fixes for suite ([d6f57b8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d6f57b86b07a74e81c3949fa2663e5ab4732760f))
- RSA fixes for suite ([9eb47d1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9eb47d1147d15f87bf9e6ac8861bede21a2511dc))
- RSA fixes for suite ([834642a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/834642a3881b14195ac47f5bdd639bdaae35c7a5))
- RSA fixes for suite ([3df79ab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3df79ab1012764ac61e6f3ac910b9a91cb19f996))
- testing unimodules-core removal ([ffdc606](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ffdc606a95d43d831fa9fe2eabfacf47e62d1361))
- Tests to allow multiple subjects for credentials ([5e407ac](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5e407accd822ccb099677876df192e850b17ccd1))
- Tests to allow multiple subjects for credentials ([52b1662](https://github.com/Sphereon-Opensource/SSI-SDK/commit/52b1662c9f7dc911f7f67d2e56a0b86cb7535c8c))
- Tests to allow multiple subjects for credentials ([110d78e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/110d78e29304a230359e30d6ae54cdf2cfe10882))

### Features

- add Alg support to DID:JWK. Although optional in reality several external systems expect it to be present ([12dae72](https://github.com/Sphereon-Opensource/SSI-SDK/commit/12dae72860fd0dc00e96a8121b136c2195843388))
- Add jsonwebsignature2020 context to presentations if missing ([1f3f6b5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1f3f6b5078868ad4447a6c2e60c81160d428025e))
- Add jwt as signature when decoding JWT VCs/VPs ([f089ac1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f089ac18dc470f0b8c581b49e70e7eba64d72bc3))
- Add RSA support to JsonWebKey/Signature2020 ([94c0e73](https://github.com/Sphereon-Opensource/SSI-SDK/commit/94c0e73d6dbc9a95e74816131765e4961126e2c5))
- Add support for ES256/Secp256r1 DID JWKs ([1e447a6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1e447a6fedab92549d8848a13212e9dd8c75274a))
- allow existing did document for mapping ([5f183ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5f183ce655a40332a65480634b356ae8fa4d7a84))
- allow existing did document for mapping ([4d82518](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4d82518653ff456383561c22870856f110976aa0))
- Allow multiple subjects for credentials ([6300ccc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6300ccc4db803e76abeeafb489374120b983af71))
- Allow supplying signer/verifier ([00892e2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/00892e2bb7fd279e2fdc3583cd132292708f71c6))
- Allow supplying signer/verifier ([625ea6f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/625ea6feb62a08d3ce013850c6de7da8d833bc35))
- Allow supplying signer/verifier ([b010d7a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b010d7ac65ba49d4e85641558ce801e1c3fea730))
- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))
- Create VP in OP Authenticator and allow for callbacks ([0ed86d8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0ed86d8d2b655a718d7c8cf1a946e0150bf877ce))
- did utils package ([d98b358](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d98b358ff7f9c787667b4bf48fd748ae9f58197a))
- Jsonweb2020 sig support ([43a3adf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/43a3adfbe683ee4040a293cc5b75d17a029d7c49))
- make sure the vc-handler-ld-local can deal with keys in JWK format ([26cff51](https://github.com/Sphereon-Opensource/SSI-SDK/commit/26cff511b345e412dc37586ef3c3c8fe678cd574))
- Make sure VP type corresponds with PEX definition ([129b663](https://github.com/Sphereon-Opensource/SSI-SDK/commit/129b66383752e05ab3067e459bff591a07aac690))
- Make sure VP type corresponds with PEX definition ([3dafa3f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3dafa3ff4c794d13eff3e2e0b6a85675667db089))
- New QR code provider plugin. Can generate both SIOPv2 and DIDCommv2 OOB QRs. Support for text generation and React QR codes as SVG ([d40ba75](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d40ba75600b3dadd07bff6ecc423000023f3d958))
- Update SIOP OP to be in line wiht latest SIOP and also supporting late binding of identifiers ([2beea04](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2beea04a6604d82b12ecbc11e68a9f41775c22ed))

### Reverts

- Revert "fix: make sure to explicitly depend on @digitalcredentials VC packages" ([dae695d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/dae695d9e17fb3d73bd2e264510551c060d780bb))
- Revert "fix: make sure to explicitly depend on @digitalcredentials VC packages" ([e2be77a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e2be77aed1e518049379c3c092590382d794e660))
- Revert "fix: deps" ([5b0df98](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5b0df989ec25ac49a2f413021693d6fae7ff9c3c))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

### Bug Fixes

- Remove most deps from ssi-sdk-core to prevent circular deps ([b4151a9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b4151a9cde3e5e5dcabb32367e7a6b6ab99cb6cd))

### Features

- Add support for update and recovery keys ([85bcf7e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bcf7e0ebc08d1c15540bfef1c7a237dba7811b))
- Create common SSI types package ([0fdc372](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0fdc3722e3bc47ac13c3c586535937fa1ebe6f68))

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

### Bug Fixes

- Update ion deps to remove problematic did-key p384 from transmute which depended on webcypto-asl which is not compatible with node >=14. ([386efc7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/386efc71b18195004773fc74eb51b62cd3f5dd76))

### Features

- add Microsoft Request CoseCryptoService API support ([251ed60](https://github.com/Sphereon-Opensource/SSI-SDK/commit/251ed60ebd6984d5fe494a764d8cd662dd0eba6d))
- Add migration support to mnemonic seed manager plugin. Fix some entity props in the process ([f7641f4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f7641f4f56ebe99894ddad6c6827681406d21d2e))

### Reverts

- Revert "MYC-184 Update main Version change 0.5.1 -> 0.5.2" ([b1b8cc6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b1b8cc635ebccb07c29465df32c3d352c5798855))
- Revert "MYC-184 uncommitted changes are added" ([fb4f878](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fb4f878dc1e03b9e390a4f886cccac66841256be))

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

### Bug Fixes

- Fix unit tests for VC API ([f3c5eea](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f3c5eea0cf6a020c5885b2c9d6104694ded9d0e5))
- fixed and refactored some pr notes ([2ff95b9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2ff95b9010d24b9439fbb6918f0ac4d8663827a7))
- tests are now using env variables ([9cb6ec2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9cb6ec2589d9e443fb144ca5fe5420cc7c84dd9c))

### Features

- Add custom DID resolver support ([45cea11](https://github.com/Sphereon-Opensource/SSI-SDK/commit/45cea1182693b698611b062a9d664ad92e8dcd6a))
- Add default DID resolver support ([eebce18](https://github.com/Sphereon-Opensource/SSI-SDK/commit/eebce18bf9cc9d28a8bcdd6886100b7a8921bb2f))
- Add did resolver and method support per OpSession ([9378b45](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9378b451d4907c8d5385f464b27f858547409bb4))
- Add did resolver and method support per OpSession ([a9f7afc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a9f7afc386189ca4851ce967f5abf7db812d1003))
- Add supported DID methods ([df74ccd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/df74ccddcab06a032ca47a033a46bd0268826f72))
- Add supported DID methods ([7322265](https://github.com/Sphereon-Opensource/SSI-SDK/commit/732226544503c2bcc32bf4400da82e9154361abb))
- added piiLoggingEnabled and logLevel to optional params for clientCredential authentication ([584fb7b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/584fb7b8225198e890a484514e96279fbd642b59))
- added region to optional params for clientcredential authentication ([e21bd70](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e21bd7017a669bff0e5b6fd0c317393cac594f21))
- changed the structure of the module to be more like the ssi-core module of ours. Plus, changed some documents ([4480b3f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4480b3f33c887d92731260d5d09c8808cb5e9c13))

## [0.5.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.0...v0.5.1) (2022-02-23)

**Note:** Version bump only for package SSI-SDK-workspace

# [0.5.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.4.0...v0.5.0) (2022-02-23)

### Features

- Update waci pex implementation as it was serializing a SIOP Auth request including all options like private keys, not conforming to WACI-PEX ([90a1cba](https://github.com/Sphereon-Opensource/SSI-SDK/commit/90a1cba359b7a946951ef0d47746d01b3cbc225e))

# [0.4.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.4...v0.4.0) (2022-02-11)

### Bug Fixes

- ensure we set jsx to react ([c2a5e6f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c2a5e6f0cfb7895990fa1cc354c457fc93b640fd))

### Features

- Add WACI PEx QR generator for React ([7850e34](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7850e34ad2af58f62523a2346826d12280216d31))

## [0.3.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.3...v0.3.4) (2022-02-11)

### Bug Fixes

- fix imports ([738f4ca](https://github.com/Sphereon-Opensource/SSI-SDK/commit/738f4cafdf75c9d4831a3c31de1c0d5aff1d7285))

## [0.3.3](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.1...v0.3.3) (2022-02-10)

### Bug Fixes

- building of vc-handler-ld-local containing ts files + not copying files ([cdbfcab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cdbfcab114531947e6d0092e0bdb7bc9f818ac88))
- we imported a ts file from another package in the monorepo instead of using the module ([5d647df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5d647dffd9002ffca2a15a5c1ba56e33acec6716))

## [0.3.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.1...v0.3.2) (2022-02-04)

### Bug Fixes

- building of vc-handler-ld-local containing ts files + not copying files ([cdbfcab](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cdbfcab114531947e6d0092e0bdb7bc9f818ac88))
- we imported a ts file from another package in the monorepo instead of using the module ([5d647df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5d647dffd9002ffca2a15a5c1ba56e33acec6716))

## [0.3.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package SSI-SDK-workspace

# [0.3.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.2.0...v0.3.0) (2022-01-16)

### Bug Fixes

- Add missing suites exports ([4a3b8ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a3b8ce93e36c55b3b17884e262db9d91c4459e6))
- Be a bit more relaxed when deleting an LTO DID, eventhough onchain support is not present ([7347914](https://github.com/Sphereon-Opensource/SSI-SDK/commit/73479148d6b02c194182370c14a15613dca6fcf2))
- Update test timeout for Factom ([9a934cf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9a934cfb507af3d5cc8629bb0e8f6fd70f785092))

### Features

- Add debug logging when creating VC, can be enabled by DEBUG=sphereon:ssi-sdk:ld-credential-module-local ([c0df2ce](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c0df2ce8bc67f2e407ef21b65aae6d364c47a6b9))

# [0.2.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.1.0...v0.2.0) (2021-12-16)

### Bug Fixes

- LTO DIDs use #sign for keys ([11daa98](https://github.com/Sphereon-Opensource/SSI-SDK/commit/11daa98c804232b9fad32d60afa707e86881b5bb))
- move to ES6 import for cross-fetch ([b855273](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b85527391fd2072c427dc34a69ad026b60a70be0))
- Multibase encoding didn't include the prefix char ([1be44b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1be44b7f281b82370a59a321f25057bee34d58de))
- update test to search for kid using #sign instead of #key as the LTO indexer impl changed ([fa0fae4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fa0fae43935e7c64e4d5628fb5cdd3dc8af447ce))
- workaround for bug in VeramoEd25519Signature2018 implementation ([13442eb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/13442eb417b809751133dfaf43e1fa0a703f2f80))

### Features

- Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([b4e8453](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b4e84534175c58aa7c744212099a69e852b1f299))
- Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([995f55e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/995f55efd5237e3fbd76e6569e09ee3bbcbb686c))
- Add local default contexts ([da29f02](https://github.com/Sphereon-Opensource/SSI-SDK/commit/da29f0290b21eab7d23027a7827ea967d1c3d1fa))
- Add Local JSON-LD VC and VP issuance and verification plugin ([aa1b45c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa1b45c2e118c5fb4c80b70d0544cf301b2a40c7))
- Add Mnemonic seed generation, verificaiton and secure storage ([d9a410a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d9a410a2cfd576afc885c6882e448c6d9e15f137))
- Add new ed25519 2018 signature and spec implementation using transmute's TS implementation ([ffbe876](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ffbe8760e1dc69964ba92aa0d8127274fcff61ac))
- Add proof purposes to issuance and verification methods. Add support to resolve verification methods from DID doc ([c8e7392](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c8e739227d226ac06619d20a4de0886236e05269))
- Add Self-Issued OpenID Connect and OpenID Connect for Verifiable Presentations support ([1ec1d1c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/1ec1d1cacd08f12d4c21a8d72dfb51430f78deb3))
- Add suite lookup based on verification method type next to veramo key type ([5c18dc2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/5c18dc2a2f61ddff213595408ad10b62a5e83476))
- Allow remote context loading ([742d3cc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/742d3ccfffb36a658e7a48b8feeb65fe3eb409e5))

# 0.1.0 (2021-11-26)

### Bug Fixes

- add missing env var for workflow for PRs ([c3198ca](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c3198ca86afb9017bdb20f5c007245fb0aed51f2))
- fix workflow env ([3acf669](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3acf6699e768b1aa64dd82fb1abd5b11110af3da))
- fix workflow for PRs ([eddad66](https://github.com/Sphereon-Opensource/SSI-SDK/commit/eddad66e9e92e5eae6a3e7ec8cf5848591a76bec))
- open handles and logging after test completes ([8cca899](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8cca899ff73c45564589c89d1635d0ba23b3e544))
- sync main into develop ([143927c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/143927c063bea8153c19cd0ee06b329632ada5b0))

### Features

- Add factom-did module ([e6e3cfb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e6e3cfb0e992df6f6caf776f0b27cfc7fe85f078))
- Add lto-did module ([236ca01](https://github.com/Sphereon-Opensource/SSI-SDK/commit/236ca0101951186b224aee51f49b3ab77148d64b))
- Add ssi-sdk core module ([42a5b65](https://github.com/Sphereon-Opensource/SSI-SDK/commit/42a5b65fa3795284fc16b06d2a36c4bf4ea87668))
- Add workspace/lerna files and structures ([2c2b112](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2c2b11244c2e5e3d2d1b1db76af3d86ec300bc72))
