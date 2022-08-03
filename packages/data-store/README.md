<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Data Store (Typescript) 
  <br>
</h1>

---

**Warning: This package still is in very early development. Breaking changes without notice will happen at this point!**

---

SSI-SDK data storage based on TypeORM. This package provides several plugins that relate to data storage.

## Available stores

- Connection Store

### Connection Store

A store that exposes simple store/get methods for connection parties and connections.

## Installation

```shell
yarn add @sphereon/ssi-sdk-data-store
```

## Build

```shell
yarn build
```

## Module developers

We use TypeORM migrations to support database changes over time. See the @sphereon/ssi-sdk-data-store-common package for more information.
