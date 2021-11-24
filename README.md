<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>SSI-SDK (Typescript) 
  <br>
</h1>

`Not yet documented`

### Lerna
The SSI-SDK makes use of Lerna for managing multiple packages. Lerna is a tool that optimizes the workflow around managing multi-package repositories with git and npm / yarn.

### packages
The SSI-SDK contains the following packages:
* `ssi-sdk-core`
* `factom-did-provider`
* `lto-did-provider`
 
#### ssi-sdk-core
`Not yet documented`

#### factom-did-provider
`Not yet documented`

#### Lto-did-provider
Lto-did-provider is a Veramo plugin to create and delete DIDs and to add and manage verification methods on LTO Network.

[Lto-did-provider readme](./packages/lto-did-provider/README.md)

### Installation
```shell
yarn add SSI-SDK-workspace
```

### Build
```shell
yarn build
```

### Test
The test command runs:
* `jest`
* `coverage`

You can also run only a single section of these tests, using for example `yarn test:watch`.
```shell
yarn test
```

### Utility scripts
There are other utility scripts that help with development.

* `yarn prettier` - runs `prettier` to fix code style.

### Publish
There are scripts that can publish the following versions:
* `latest`
* `next`
* `unstable`

```shell
yarn publish:[version]
```
