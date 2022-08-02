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
yarn add @sphereon/ssi-sdk-connection-manager
```

## Build

```shell
yarn build
```

## Module developers

We use TypeORM migrations to support database changes over time. As soon as you need to update, add or delete
information from entities, ensure that migration files are being created to reflect the updates.

Currently we support migrations for sqlite databases, typically used during development and on mobile platforms. Next to
that we also support Postgres. Obviously you need to have a Postgresql database at hand when working with Postgres.

### Create a migration file

- Ensure you have an existing sqlite/postgres database at hand with the old situation
- Make a copy of that database so you can always easily go back
- Run the respective commands for postgresl and/or sqlite:
  - `yarn run typeorm-postgres:migration:generate NameOfYourMigration`
  - `yarn run typeorm-sqlite:migration:generate NameOfYourMigration`
- Check in the src/migrations folders to find a file in the respective sqlite/postgres folder which contains _
  NameOfYourMigration_
- Update the index.ts file in the respective directory to include the migration. Users will import that file as their
  migrations entrypoint from their TypeORM config.
- If you wish to check whether applying the migration works you can execute the respective
