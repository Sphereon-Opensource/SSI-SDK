# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.17.4](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.3...v0.17.4) (2023-10-01)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace





## [0.17.3](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.2...v0.17.3) (2023-09-30)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace





## [0.17.2](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.1...v0.17.2) (2023-09-30)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace





## [0.17.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.17.0...v0.17.1) (2023-09-28)


### Bug Fixes

* update deps to fix an issue with VCI offer ids not mapping on issuer metadata ([aa6f98c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa6f98c951b41b9273a9128fbc0c08f4eb5aa41b))





# [0.17.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.16.0...v0.17.0) (2023-09-28)


### Features

* Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([2dde4b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2dde4b7ec63f579d208a8ea676e063cfe3b3a2ed))
* Do not raise an error by default in case we encounter a VC with a statuslist we do not support. More strict scenario's are supported with an optional parm ([4a634b7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4a634b77aadb59b93dd384018e64045fe95762e7))





# [0.16.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.1...v0.16.0) (2023-09-28)


### Bug Fixes

* Create a issuer.id in a uniform credential in case the issuer is already an object and there is an iss claim in the JWT ([706baff](https://github.com/Sphereon-Opensource/SSI-SDK/commit/706baffee81c1a6993bf1573a083696c45cb3ab9))
* Ed25519 2018 handling for verification ([b858710](https://github.com/Sphereon-Opensource/SSI-SDK/commit/b858710167a34a6a1c968f459cfae207b0d5a226))
* Ed25519 2018 handling for verification ([14125e5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/14125e58070e89b0c1a95769f24af79c0c1e1df5))
* Fix multibase/codec code ([4354927](https://github.com/Sphereon-Opensource/SSI-SDK/commit/43549278bb1a2f10f8eb4fab03abcd78c234bda2))
* fixed partyId property in rest api ([51861fd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/51861fd35110b57975c4d897893a65f670e50430))
* Internally alg needs uppercase ([0388f11](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0388f117d6cf1d753cf0eff10a3ab6a98f10faa0))
* Make sure we do not throw an error when the IDP does not have an end_session_url ([781e250](https://github.com/Sphereon-Opensource/SSI-SDK/commit/781e2500a3296fb74f3c774b8e2862cbca9abdb0))
* Secp256k recovery 2020 fix ([196ad4c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/196ad4c158cc5c51400c17ed52f521b3deeb52e8))
* Secp256k recovery 2020 fix ([8be1da2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/8be1da2a13572ec3dace13d87f9206d357f34266))


### Features

* Add auth support to VCI REST client ([c541b23](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c541b2347f4d602e5a017116e5d0155e8d6290dd))
* Add initial versions of VC API clients back ([f6465cf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f6465cf91e32e29349e91e203a2354cb229052ad))
* Add static header support to siop rest client ([e9fb5ee](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e9fb5ee97e9f466b87a7a0424392571cff9fd56c))
* Add support for an OIDC BFF Passport based solution to express. Allows for SPA to work IDPs that require confidential clients ([d4e082c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d4e082c76693b2449a0bf101db99e974fe4a796f))
* Add web3 signer/wallet support directly using KMS, so you can use keys managed by the KMS in web3, without ever having to expose private keys ([e3d3df7](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e3d3df746efd076a93d8452c79360840026f58b5))
* added contact test data ([daeb87d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/daeb87d5a5f3f955b096be44e098d053f78a885b))
* Allow VCI issuer to also supply the issuer DID when the credential issuer is an object without an id ([7c72d31](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7c72d31e05b90d0064dcff5ab25c985636438ec8))
* statuslist2021 functions ([61729f3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/61729f3c2808a96339ee64a82ff8cce12b1ecef2))
* statuslist2021 support ([2649b95](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2649b95dc5fe5882d6b43ccfdcf085e37918e713))
* statuslist2021 support ([46986dd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/46986dd9eae27aaa6a980eac55a8d5e1d5c85a57))
* web3 headless provider and wallet ([00fc40a](https://github.com/Sphereon-Opensource/SSI-SDK/commit/00fc40a6fd2ade1cab03d750a1c012ca8cb6d05a))
* web3 headless provider and wallet ([c69cf9e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c69cf9e65de30180e2898ed2289c572fe228eb20))
* web3 headless provider and wallet ([62dc7df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/62dc7dfb43b0461707d4ef2afc6f21406e57ae5e))





## [0.15.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.15.0...v0.15.1) (2023-08-10)


### Bug Fixes

* /well-known/did/json wasn't resolving anymore because of an incorrect path match ([e94f4da](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e94f4dad1eef2f1e428eef0967b4c75c6509f77c))





# [0.15.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.1...v0.15.0) (2023-08-10)


### Bug Fixes

* Alg header was not correctly set, and we do support ES256 for JsonWebSignature2020 now ([d8e961c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d8e961c984ca522ebb657b420853e4c0687161f8))
* Authentication fixes ([adafd6b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/adafd6bd09142492f7b3bddbab8d03ae24cf8600))


### Features

* Add graceful http server termination ([bba073b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bba073b22afe1e09663532ac4427cf3a16a9e734))
* Add morgan logging to express builder. Allow expres to start from build result ([caa4909](https://github.com/Sphereon-Opensource/SSI-SDK/commit/caa4909009d33d0bade1df637b354af8a89d9a4b))
* Add optional entra ID auth builder ([960f2df](https://github.com/Sphereon-Opensource/SSI-SDK/commit/960f2dfc645ca09567765e6cb67df5915cd02183))
* Add optional static bearer auth builder, with hashed tokens ([6a7dd17](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6a7dd1799ada74a4fa8d1a8b0ce3f89ffc043d5a))
* Allow document loader to also load DID from the agent and fall back to the universal resolver (all configurable) ([f2f9fbc](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f2f9fbc0c999664c8c1cfdd4b0f0204ea1b8ccf1))
* allow signing credential with local resolved DID. Especially handy for did:web that is not yet published/exposed ([34793e9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/34793e9bacc7dfcc689ad8c11119d5f7d7b1d3ef))
* Separate SIOPv2 REST API into individual functions and use express-support ([2495980](https://github.com/Sphereon-Opensource/SSI-SDK/commit/24959808b9a4b59cec5171e2abb5fdc260448b98))





## [0.14.1](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.14.0...v0.14.1) (2023-07-31)

**Note:** Version bump only for package @sphereon/sphereon-sdk.workspace





# [0.14.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.13.0...v0.14.0) (2023-07-30)


### Bug Fixes

* also publish when on a fix branch ([e8b678e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e8b678e13205c68e44c0ec63d8a915c5e7d63b24))
* also publish when on a fix branch. Also run a diff before the frozen lockfile install so we can see what's going on ([69a3200](https://github.com/Sphereon-Opensource/SSI-SDK/commit/69a3200b6185498dd9554193717db0c81fbdd31a))
* CI was still using yarn instead if pnpm in several places ([ca16f70](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ca16f70274168a50fed284aeea2f29ed40e4ec5b))
* CI was still using yarn instead if pnpm in several places ([c167259](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c16725978df96647cb346c47c8a1ef4489ab13cb))
* Fix relative DID resolution and Json websignature 2020 verification for ED25519 and some other algs ([ca2682c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ca2682c0b747f5052143c943a06f23acc7aa22cc))
* Use agent resolver if not set, with fallback to universal resolver. Fix bug in response message ([43c9313](https://github.com/Sphereon-Opensource/SSI-SDK/commit/43c9313ee623fa0848dca8dcd4e2e509692c28d7))
* VCI did resolution from agent ([7aa2bd3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7aa2bd30e4ee51d3322415b8a06533e91f07b97d))
* VCI did resolution from agent ([2c913db](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2c913dbe635337f0931032023a17c0cfd3d739ce))
* VP did resolution from agent ([aa3f3f1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aa3f3f1173f502c5414a2237231306311ed4d1fc))


### Features

* Add express builder, cors configurer, passport authentication and casbin authorization support for APIs. ([cb04fe8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cb04fe8b84ce6f4c840afef43d628f23cb8e9e36))
* Add global web resolution provider. Add json error handler ([f19d1d1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/f19d1d135a9944a6c9e4c6040c58e7563c4442f2))
* Add partial DIF Universal Registrar and Resolver support ([69c8046](https://github.com/Sphereon-Opensource/SSI-SDK/commit/69c8046b214771b54d731c19f295341cf22d0616))
* Add seperate did:web service to host did.json files managed by the agent ([0a8a0bb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0a8a0bb201742c3208f98267f9a03fcaeb32ec56))
* Add support for ES256(k/r) in JsonWebsignature2020 signing ([cd511d5](https://github.com/Sphereon-Opensource/SSI-SDK/commit/cd511d55a66798936218b5968f8daac9a549a9b7))
* Allow objects for error response. Improve json handling in error responses ([4151c73](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4151c73b4cdeb931c0deb8b8f34ed9c215efe5ba))
* Better support for MS Azure auth and re-using a MSAL client from Azure Request API ([61bdfaf](https://github.com/Sphereon-Opensource/SSI-SDK/commit/61bdfaf202ee8e5fc6f1e9b83138298798a7a440))
* Move VC API endpoints to functions, to more easily create your own API server, only supporting certain endpoints ([fc03507](https://github.com/Sphereon-Opensource/SSI-SDK/commit/fc0350735c8cd42a60e1152add9cb49da5c39e62))





# [0.13.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.12.0...v0.13.0) (2023-06-24)


### Features

* allow default opts to be set when OID4VCI is running ([7142273](https://github.com/Sphereon-Opensource/SSI-SDK/commit/71422737036c01c095459676858b754b7b10ddfd))
* allow did opts from default options to be populated in instance options ([41deb99](https://github.com/Sphereon-Opensource/SSI-SDK/commit/41deb9974dcffcca007c4fba9f037f2f75a0bda4))
* allow instance opts to be set when OID4VCI is running but only when having access to the object directly ([51f873e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/51f873e34dec7ddca92cae6d625c1694a483b2cb))
* Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-Opensource/SSI-SDK/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))





# [0.12.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.11.0...v0.12.0) (2023-06-21)


### Bug Fixes

* added dev dependencies for oid4vci-issuer-rest-client plus prettier ([7b6c2b3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7b6c2b3d08aedfe357345fac47e94be4dcd3d243))
* added schema export for oid4vci-issuer-rest-client and some docs ([7db9c1b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7db9c1be4775f55cf6db4470db1d99e0efdf5caa))
* changed credentials and grants to mandatory plus renamed the uri to url ([2df3612](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2df36125a3062250ab0a7a69eca3c83cdb8c450d))
* fix test cases and REST arguments ([975801e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/975801e1e6c8270fd470acd7e2ce67ae4971a16f))
* fixed a bug in calling cross-fetch with post, modified the tests ([a3defeb](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a3defeb5d62ff7f4007a88cd772b2164c136da7a))
* skipped integration tests in oid4vci-issuer-rest-client ([c43759b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/c43759bebc7350cc400d668369105a8cff0e3ee1))
* unify naming ([aee0bf1](https://github.com/Sphereon-Opensource/SSI-SDK/commit/aee0bf1a7a94142c10561fd7295d1d0950c29221))
* unify naming ([ec7d0b6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/ec7d0b6ced54a792ede23937c7043e53d7121e42))
* unify naming ([94165cd](https://github.com/Sphereon-Opensource/SSI-SDK/commit/94165cdb8d1cf14f866de7fc5fe2c518a97b1986))
* updated generate-plugin-schema for oid4vci-rest-client ([70e7820](https://github.com/Sphereon-Opensource/SSI-SDK/commit/70e7820b6e59b3bfdd9de5b15de0718de1826738))


### Features

* Add issue status support to OID4VCI REST client ([40abd83](https://github.com/Sphereon-Opensource/SSI-SDK/commit/40abd8320dd0097e2e024c2e61ce2f03359926ab))
* Add key value store plugin ([95244fa](https://github.com/Sphereon-Opensource/SSI-SDK/commit/95244fa9f6c79d47660f1afee39c2c9db50f0e27))
* Add OID4VCI issuer modules ([af85f1e](https://github.com/Sphereon-Opensource/SSI-SDK/commit/af85f1e2aace201c5749eef2e1a3fb8223ae7937))
* Add Presentation Exchange module ([a085c81](https://github.com/Sphereon-Opensource/SSI-SDK/commit/a085c81a2608dd072e9b2c3d49174b76dab9705a))
* Add SIOPv2 Relying Party logic and REST API ([01f2023](https://github.com/Sphereon-Opensource/SSI-SDK/commit/01f2023a4112f04412df4df318c6eacf9da536a7))
* Add SIOPv2OID4VP RP auth and REST module ([91b1da3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/91b1da3548fd425aa93424411339e1ec2a2e0fd3))
* added oid4vci-rest-client package ([910f697](https://github.com/Sphereon-Opensource/SSI-SDK/commit/910f697f08dc05e3c16dafb239b7ee85bc68b431))
* Allow to supply data for VCI Issuer REST client and server during offer ([0878c28](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0878c2848aa5144ee863e6f192c9f8b8eb46ff34))
* changed the test structure and few other pr notes addressed ([6520fbe](https://github.com/Sphereon-Opensource/SSI-SDK/commit/6520fbe297ab9a1c5f5fbaff5cabb98f51d3cbea))
* More support for definition Formats when creating VPs from SIOP ([846ef0b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/846ef0b359c4ec5755d9385c5f1c6db1fb14b0c1))
* move schema generation to own plugin because of transitive dependency issues upstream ([51c5156](https://github.com/Sphereon-Opensource/SSI-SDK/commit/51c5156bdf83e12d55bc4e609d741c6ff878daa8))
* move schema generation to own plugin because of transitive dependency issues upstream ([58002a8](https://github.com/Sphereon-Opensource/SSI-SDK/commit/58002a861f7ed504b0e1d4250d556f8414f961a0))
* move to pnpm ([2714a9c](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2714a9c786b8591de41310a83aff19f62cf65e77))


### Reverts

* Revert "chore: remove plugin schemas" ([2870d77](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2870d77a6e1919e94f554e71100fbcdb4fed47af))
* Revert "chore: remove plugin schemas" ([07af699](https://github.com/Sphereon-Opensource/SSI-SDK/commit/07af6996b3209e86d588666c0c0da9ea9e17442c))





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

- add Microsoft Request Service API support ([251ed60](https://github.com/Sphereon-Opensource/SSI-SDK/commit/251ed60ebd6984d5fe494a764d8cd662dd0eba6d))
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
