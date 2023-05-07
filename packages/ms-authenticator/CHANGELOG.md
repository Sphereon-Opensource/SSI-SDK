# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.11.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.10.1...v0.11.0) (2023-05-07)

### Features

- Create new agent-config module to replace the deps on Veramo cli, which pulls in everything ([673856f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/673856f587885743300aaafea791e3696d9c456f))

# [0.10.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.9.0...v0.10.0) (2023-04-30)

### Bug Fixes

- cleanup package.json files ([0cc08b6](https://github.com/Sphereon-Opensource/SSI-SDK/commit/0cc08b6acc168b838bff48b42fdabbdea4cd0899))

### Features

- Update to v2 PEX and v0.3 SIOP packages ([80398e3](https://github.com/Sphereon-Opensource/SSI-SDK/commit/80398e36ab53ed46ebca715570242a466c83d5db))

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Features

- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/ms-authenticator

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ms-authenticator

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

### Bug Fixes

- fixed and refactored some pr notes ([2ff95b9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/2ff95b9010d24b9439fbb6918f0ac4d8663827a7))
- tests are now using env variables ([9cb6ec2](https://github.com/Sphereon-Opensource/SSI-SDK/commit/9cb6ec2589d9e443fb144ca5fe5420cc7c84dd9c))

### Features

- added piiLoggingEnabled and logLevel to optional params for clientCredential authentication ([584fb7b](https://github.com/Sphereon-Opensource/SSI-SDK/commit/584fb7b8225198e890a484514e96279fbd642b59))
- added region to optional params for clientcredential authentication ([e21bd70](https://github.com/Sphereon-Opensource/SSI-SDK/commit/e21bd7017a669bff0e5b6fd0c317393cac594f21))
- changed the structure of the module to be more like the ssi-core module of ours. Plus, changed some documents ([4480b3f](https://github.com/Sphereon-Opensource/SSI-SDK/commit/4480b3f33c887d92731260d5d09c8808cb5e9c13))
