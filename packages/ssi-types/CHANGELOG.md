# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.13.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.12.0...v0.13.0) (2023-06-24)


### Features

* Allow setting SIOP RP default opts also after construction, as sometimes you need to agent which is not available yet at construction time ([bf871da](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/bf871dab0dc670c4e072d177998c6890f28b8fa7))





# [0.12.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.11.0...v0.12.0) (2023-06-21)

### Features

- Add Presentation Exchange module ([a085c81](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/a085c81a2608dd072e9b2c3d49174b76dab9705a))
- More support for definition Formats when creating VPs from SIOP ([846ef0b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/846ef0b359c4ec5755d9385c5f1c6db1fb14b0c1))

# [0.11.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.10.1...v0.11.0) (2023-05-07)

### Bug Fixes

- make credential mapper a bit more resilient ([7248fae](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/7248fae74f4d3a300bce5bdfb1180267b7bd9c2d))

### Features

- Create new agent-config module to replace the deps on Veramo cli, which pulls in everything ([673856f](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/673856f587885743300aaafea791e3696d9c456f))
- instead of returning a boolean value, return an object with more information about verification of LD creds/VPs ([7df0e64](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/7df0e64ad6553e8153cf96d62156867fde8e4cef))

# [0.10.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.9.0...v0.10.0) (2023-04-30)

### Bug Fixes

- cleanup package.json files ([0cc08b6](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0cc08b6acc168b838bff48b42fdabbdea4cd0899))
- decoded JWT VPs/VCs did not contain everything ([fd7ff68](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/fd7ff680bbfbfbfbf0cd4ba96948b805ac97c6dd))

### Features

- Add better internal handling of JWT proof values used in JsonLD converted credentials ([90004c5](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/90004c5886cd3f645f979b5e81dfc03e3ff3b862))
- Update to v2 PEX and v0.3 SIOP packages ([80398e3](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/80398e36ab53ed46ebca715570242a466c83d5db))

# [0.9.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.8.0...v0.9.0) (2023-03-09)

### Bug Fixes

- credential mapper for jtw ([f04345b](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f04345b97ff9a78a3dff096599f0b675b3239a3e))
- JWT claims would overwrite the issuer object in the credential. Disable Factom tests ([f41cf64](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f41cf64790d484ad8b9721fe347e81e2153898b9))
- Move parseDid method to ssi-types ([0b28de3](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0b28de3de21afd0a224d3d174103e072162231ed))
- Remove non dev dep on veramo-core ([8cb8efe](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/8cb8efec1fc97581640a8254fe412abc8fea4305))
- Tests to allow multiple subjects for credentials ([5e407ac](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/5e407accd822ccb099677876df192e850b17ccd1))
- Tests to allow multiple subjects for credentials ([52b1662](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/52b1662c9f7dc911f7f67d2e56a0b86cb7535c8c))
- Tests to allow multiple subjects for credentials ([110d78e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/110d78e29304a230359e30d6ae54cdf2cfe10882))

### Features

- Add jwt as signature when decoding JWT VCs/VPs ([f089ac1](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/f089ac18dc470f0b8c581b49e70e7eba64d72bc3))
- Allow multiple subjects for credentials ([6300ccc](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/6300ccc4db803e76abeeafb489374120b983af71))
- Create VP in OP Authenticator and allow for callbacks ([0ed86d8](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0ed86d8d2b655a718d7c8cf1a946e0150bf877ce))

# [0.8.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.7.0...v0.8.0) (2022-09-03)

### Features

- Create common SSI types package ([0fdc372](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/0fdc3722e3bc47ac13c3c586535937fa1ebe6f68))

# [0.7.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.6.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.5.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.4.0...v0.5.0) (2022-02-23)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.4.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.3.4...v0.4.0) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

## [0.3.4](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.3.3...v0.3.4) (2022-02-11)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

## [0.3.1](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.3.0...v0.3.1) (2022-01-28)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.3.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.2.0...v0.3.0) (2022-01-16)

**Note:** Version bump only for package @sphereon/ssi-sdk.core

# [0.2.0](https://github.com/Sphereon-OpenSource/ssi-sdk/compare/v0.1.0...v0.2.0) (2021-12-16)

### Bug Fixes

- Multibase encoding didn't include the prefix char ([1be44b7](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/1be44b7f281b82370a59a321f25057bee34d58de))

### Features

- Add JSON-LD Credential and Presentation handling/sign support that is compatible with React-Native ([995f55e](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/995f55efd5237e3fbd76e6569e09ee3bbcbb686c))

# 0.1.0 (2021-11-26)

### Features

- Add ssi-sdk core module ([42a5b65](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/42a5b65fa3795284fc16b06d2a36c4bf4ea87668))
- Add workspace/lerna files and structures ([2c2b112](https://github.com/Sphereon-OpenSource/ssi-sdk/commit/2c2b11244c2e5e3d2d1b1db76af3d86ec300bc72))
