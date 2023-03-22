# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.9.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.8.0...v0.9.0) (2023-03-09)

### Bug Fixes

- QR code testing. Remove enzyme as it is not compatible with React 18 ([62debd9](https://github.com/Sphereon-Opensource/SSI-SDK/commit/62debd972f51a3f1ad90e922115eed4c2f56cefb))

### Features

- Allow to relax JWT timing checks, where the JWT claim is slightly different from the VC claim. Used for issuance and expiration dates ([85bff6d](https://github.com/Sphereon-Opensource/SSI-SDK/commit/85bff6da21dea5d8f636ea1f55b41be00b18b002))
- New QR code provider plugin. Can generate both SIOPv2 and DIDCommv2 OOB QRs. Support for text generation and React QR codes as SVG ([d40ba75](https://github.com/Sphereon-Opensource/SSI-SDK/commit/d40ba75600b3dadd07bff6ecc423000023f3d958))

# [0.8.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.7.0...v0.8.0) (2022-09-03)

**Note:** Version bump only for package @sphereon/ssi-sdk-qr-code-generator

# [0.7.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.6.0...v0.7.0) (2022-08-05)

**Note:** Version bump only for package @sphereon/ssi-sdk-qr-code-generator

# [0.6.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.5.1...v0.6.0) (2022-07-01)

**Note:** Version bump only for package @sphereon/ssi-sdk-qr-code-generator

# [0.5.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.4.0...v0.5.0) (2022-02-23)

### Features

- Update waci pex implementation as it was serializing a SIOP Auth request including all options like private keys, not conforming to WACI-PEX ([90a1cba](https://github.com/Sphereon-Opensource/SSI-SDK/commit/90a1cba359b7a946951ef0d47746d01b3cbc225e))

# [0.4.0](https://github.com/Sphereon-Opensource/SSI-SDK/compare/v0.3.4...v0.4.0) (2022-02-11)

### Features

- Add WACI PEx QR generator for React ([7850e34](https://github.com/Sphereon-Opensource/SSI-SDK/commit/7850e34ad2af58f62523a2346826d12280216d31))
