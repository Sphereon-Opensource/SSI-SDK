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

- Do not retrieve AS metadata from store in case an external AS is used. Fetch from remote ([7f46a5a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7f46a5a5fbe68828773cce7e05e79b26399f4a08))
- Do not retrieve AS metadata from store in case an external AS is used. Fetch from remote ([99c3f8e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/99c3f8e784f7b47c48aa7b0d4f1f270f37c37315))
- Do not try OIDF resolution on http:// urls ([fe88114](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fe88114c0faaba18602f756121392651bffdc2b1))
- Fixed merging issue ([6fc5099](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6fc50991b1acaa9b8c56f440956fbf1dadabc9e2))
- Fixed type issues and updated oid4vc dependency ([f919a29](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f919a297d56517da7cbe1db845dd164a848ffc2e))
- Issuer opts are not AS opts. Make sure we actually return issuer opts when requested ([18b4ced](https://github.com/Sphereon-Opensource/SSI-SDK/commit/18b4ced48911a04c546262da6f5cf5b2d82ed8f9))
- Make OID4VCI access token signer more resiliant ([6e09be4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6e09be4ab7d3566a921286272d21b0fe37a02c81))
- match jwk from jwt header by kid and load into JwtVerifyResult ([84bbb0f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/84bbb0fc66ce12a9a453054e4f39306c9871547f))
- Removed local dependencies ([a50eb33](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a50eb3370348285cfab74db09584821fe2b1be42))
- Updated dependencies and fixed broken code ([4982faa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4982faa1bdf78d03f53f28f4fe9ec3471ed34cc8))

### Features

- Add oid4vci state store ([56ec3e0](https://github.com/Sphereon-Opensource/SSI-SDK/commit/56ec3e0d65066a2331b5f46aab74308405e4bb2a))
- Add QR code generation to OID$VP Auth Request API ([c9749f7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c9749f7356545d8ff9c36c499f56afc0fc9a5ac9))
- Add swagger Ui to the hosted context, so we have a swagger API per OID4VCI instance ([4de300e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4de300eab19c15b7fff596e2d049cf5a8cef8f3e))
- added first party flow to holder plugin ([2f19e12](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2f19e125be1fb5bd06c97d3d409dd776c9368af6))
- Initial credential configuration REST API to add new and remove existing credentials from OID4VCI ([c120d45](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c120d4560cb8733fcc0193441ecd54e9a60ad8b1))

# [0.32.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.31.0...v0.32.0) (2024-12-05)

### Bug Fixes

- Format mapping for PD ([4e18635](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4e1863586ff7d27c4fa8ccd1094e7618c364425f))

### Features

- Remove crypto.subtle as it is giving too many issues on RN. Moved to new implementation based on [@noble](https://github.com/noble) libs ([d86e7fa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d86e7fabdb83e73ff9c31b9308eb9c5e8110e61b))
- Validation improvements ([b742fbe](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b742fbe5931813b705ad376bf8a5ccf98c011cdf))

## [0.30.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.30.0...v0.30.1) (2024-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

# [0.29.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.28.0...v0.29.0) (2024-08-01)

### Features

- update to new keyRefs instead of kids ([e969b97](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e969b97b387e62e2def5a0bac655f1fe5c7100a7))

# [0.28.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.27.0...v0.28.0) (2024-07-23)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

# [0.27.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.26.0...v0.27.0) (2024-07-07)

### Features

- Allow EBSI attestation client to be the start of a regular VCI flow ([afffd39](https://github.com/Sphereon-Opensource/SSI-SDK/commit/afffd399e2b5ad696047130b967f9b72cfd65649))
- Callback listeeners ([fce3670](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fce367041eed15ffc0d261ec2820470bf1615e3b))
- EBSI access token, attestation and DID support ([bed66b4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bed66b463c025dbd86637ba43c815ca08c5d16d2))
- EBSI DID registraiton/management ([7195786](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7195786bde800f3ce231ef4dd4fb1629a73143b2))
- EBSI headless attestation credentials ([6b6ad14](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6b6ad14d4be1c4cbca8e6d49cc73db4713e04f26))
- Get the authorization URL from a TI using a cloud/service wallet when requesting a particular attestation credential ([222c4d4](https://github.com/Sphereon-Opensource/SSI-SDK/commit/222c4d451e84b6eb0c21a4c7a615ce1480f9dba9))

# [0.26.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.25.0...v0.26.0) (2024-06-19)

### Bug Fixes

- clientId fixes ([cad41fc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cad41fc296a06b7e25dcd957da21eae4d02f7b46))
- updated vci package and fixed getSupportedCredential function ([780a377](https://github.com/Sphereon-Opensource/SSI-SDK/commit/780a37782881da1558f7b97d4d8c0ffd71317d21))
- updated version of vci and fixed the libs for it ([ceb6074](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ceb60748920fd78d318cb3544f69bef54b365c94))
- updated version of vci and fixed the libs for it ([de1d6aa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/de1d6aadcea1aac18bcd72a5651e3bb1e9f386d6))

### Features

- allow default auth request options for VCI links/machines, like clientId and redirectUri ([434196e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/434196e4ce2f895b43ec9992d682a603aaa612a3))

# [0.25.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.24.0...v0.25.0) (2024-06-13)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

# [0.24.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.4...v0.24.0) (2024-06-05)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

## [0.23.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.2...v0.23.4) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

## [0.23.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.1...v0.23.2) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

## [0.23.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.23.0...v0.23.1) (2024-04-25)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

# [0.23.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.22.0...v0.23.0) (2024-04-24)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

# [0.22.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.1...v0.22.0) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

## [0.21.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.21.0...v0.21.1) (2024-04-04)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

# [0.21.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.19.0...v0.21.0) (2024-03-20)

### Reverts

- Remove BBS support. ([205e0db](https://github.com/Sphereon-Opensource/SSI-SDK/commit/205e0db2bb985bf33a618576955d8b28a39ff932))

### BREAKING CHANGES

- Remove BBS support. Upstream support for Windows and RN is missing. Needs to be revisited at a later point in time

# [0.19.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.1...v0.19.0) (2024-03-02)

### Features

- Add initial OID4VP ID2 support ([85325ae](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85325ae7cdf6b28d32442a38779f25ee627dd86f))

### Reverts

- Revert "chore: update deps" ([f83aee5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f83aee5e7c3a22a6727ed55dd9b92f33ba5c0fc8))

## [0.18.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.18.0...v0.18.1) (2024-01-19)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

# [0.18.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.5...v0.18.0) (2024-01-13)

### Features

- Add static bearer token callback function option ([2d5cd5a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2d5cd5ad429aa5bf7a1864ce6a09bf2196e37d63))

### Reverts

- Revert "chore: update deps" ([a1cd971](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a1cd971c4edcff58e0ee225dd159a4e6958f58d1))

## [0.17.5](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.4...v0.17.5) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

## [0.17.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.3...v0.17.4) (2023-10-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

## [0.17.3](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.2...v0.17.3) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

## [0.17.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.1...v0.17.2) (2023-09-30)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

## [0.17.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.0...v0.17.1) (2023-09-28)

### Bug Fixes

- update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))

# [0.17.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.16.0...v0.17.0) (2023-09-28)

### Features

- Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a634b77aadb59b93dd384018e64045fe95762e7))

# [0.16.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.1...v0.16.0) (2023-09-28)

### Features

- Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))
- Allow VCI issuer to also supply the issuer DID when the credential issuer is an object without an id ([7c72d31](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7c72d31e05b90d0064dcff5ab25c985636438ec8))
- statuslist2021 functions ([61729f3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/61729f3c2808a96339ee64a82ff8cce12b1ecef2))

## [0.15.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.15.1) (2023-08-10)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-08-10)

### Features

- allow signing credential with local resolved DID. Especially handy for did:web that is not yet published/exposed ([34793e9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/34793e9bacc7dfcc689ad8c11119d5f7d7b1d3ef))

## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/ssi-sdk.oid4vci-issuer

# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-07-30)

### Bug Fixes

- Fix relative DID resolution and Json websignature 2020 verification for ED25519 and some other algs ([ca2682c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ca2682c0b747f5052143c943a06f23acc7aa22cc))
- VCI did resolution from agent ([7aa2bd3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7aa2bd30e4ee51d3322415b8a06533e91f07b97d))
- VCI did resolution from agent ([2c913db](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2c913dbe635337f0931032023a17c0cfd3d739ce))
- VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))

### Features

- Add global web resolution provider. Add json error handler ([f19d1d1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f19d1d135a9944a6c9e4c6040c58e7563c4442f2))

# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.13.0) (2023-06-24)

### Features

- allow default opts to be set when OID4VCI is running ([7142273](https://github.com/Sphereon-Opensource/SSI-SDK/commit/71422737036c01c095459676858b754b7b10ddfd))
- Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))

# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-06-21)

### Features

- Add issue status support to OID4VCI REST client ([40abd83](https://github.com/Sphereon-Opensource/SSI-SDK/commit/40abd8320dd0097e2e024c2e61ce2f03359926ab))
- Add OID4VCI issuer modules ([af85f1e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/af85f1e2aace201c5749eef2e1a3fb8223ae7937))
- Allow to supply data for VCI Issuer REST client and server during offer ([0878c28](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0878c2848aa5144ee863e6f192c9f8b8eb46ff34))

### Reverts

- Revert "chore: remove plugin schemas" ([2870d77](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2870d77a6e1919e94f554e71100fbcdb4fed47af))

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Bug Fixes

- credential mapper for jtw ([f04345b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f04345b97ff9a78a3dff096599f0b675b3239a3e))
- Fix DID handling in OP session ([926e358](https://github.com/Sphereon-Opensource/SSI-SDK/commit/926e358ef3eadf19fc3c8f7c9940fe6322c5ff85))
- Incorrect verification method id returned when signing credentials in some cases ([c508507](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c508507ddd2e35fcb377a79bad3c82d695b3d93d))
- Move parseDid method to ssi-types ([0b28de3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0b28de3de21afd0a224d3d174103e072162231ed))

### Features

- Add jwt as signature when decoding JWT VCs/VPs ([f089ac1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f089ac18dc470f0b8c581b49e70e7eba64d72bc3))
- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))
- Create VP in OP Authenticator and allow for callbacks ([0ed86d8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0ed86d8d2b655a718d7c8cf1a946e0150bf877ce))
- Make sure VP type corresponds with PEX definition ([129b663](https://github.com/Sphereon-Opensource/SSI-SDK/commit/129b66383752e05ab3067e459bff591a07aac690))
- Make sure VP type corresponds with PEX definition ([3dafa3f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/3dafa3ff4c794d13eff3e2e0b6a85675667db089))
- Update SIOP OP to be in line wiht latest SIOP and also supporting late binding of identifiers ([2beea04](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2beea04a6604d82b12ecbc11e68a9f41775c22ed))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

### Features

- Add custom DID resolver support ([45cea11](https://github.com/Sphereon-Opensource/SSI-SDK/commit/45cea1182693b698611b062a9d664ad92e8dcd6a))
- Add default DID resolver support ([eebce18](https://github.com/Sphereon-Opensource/SSI-SDK/commit/eebce18bf9cc9d28a8bcdd6886100b7a8921bb2f))
- Add did resolver and method support per OpSession ([9378b45](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9378b451d4907c8d5385f464b27f858547409bb4))
- Add did resolver and method support per OpSession ([a9f7afc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a9f7afc386189ca4851ce967f5abf7db812d1003))
- Add supported DID methods ([df74ccd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/df74ccddcab06a032ca47a033a46bd0268826f72))
- Add supported DID methods ([7322265](https://github.com/Sphereon-Opensource/SSI-SDK/commit/732226544503c2bcc32bf4400da82e9154361abb))

## [0.5.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.0...v0.5.1) (2022-02-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.5.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.4.0...v0.5.0) (2022-02-23)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.4.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.4...v0.4.0) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

## [0.3.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.3...v0.3.4) (2022-02-11)

### Bug Fixes

- fix imports ([738f4ca](https://github.com/Sphereon-Opensource/SSI-SDK/commit/738f4cafdf75c9d4831a3c31de1c0d5aff1d7285))

## [0.3.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.3.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.2.0...v0.3.0) (2022-01-16)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator

# [0.2.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.1.0...v0.2.0) (2021-12-16)

**Note:** Version bump only for package @sphereon/ssi-sdk-did-auth-siop-authenticator
