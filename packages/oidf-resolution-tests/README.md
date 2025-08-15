# @sphereon/ssi-sdk-ext.jwt-service-test

This package contains test code for the OIDF Resolution functionality, separated to avoid circular dependencies with the jwt-service package.

## Purpose

The test code had to be moved to a separate package because including `JwtService` agent plugin directly in the identifier-resolution package would create circular dependencies.

## Features

- Tests OIDF entity ID resolution against multiple trust anchors
- Supports both local and REST agent configurations
- Includes shared test suite for consistent verification

## Usage

The test suite can be run using:

```bash
pnpm test
```

## Test Architecture

The package provides:

- Local agent tests using in-memory SQLite database
- REST agent tests with Express server
- Shared test scenarios for both configurations
