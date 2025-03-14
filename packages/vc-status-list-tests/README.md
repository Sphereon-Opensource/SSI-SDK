# README.md

## Overview

This package, `@sphereon/vc-status-list-tests`, contains a comprehensive suite of tests for verifying the functionality of the `@sphereon/ssi-sdk.vc-status-list` library. The tests ensure correctness and robustness when working with status lists, including `StatusList2021` and `OAuthStatusList`, used for managing verifiable credentials. The tests also cover various scenarios involving JWT and Linked Data Signatures (LD-Signatures) proofs.

## Test Features

### StatusList2021 Tests

- **Create and Update Using LD-Signatures**: Validates creation and modification of `StatusList2021` credentials using Linked Data Signatures.
- **Create and Update Using JWT Format**: Ensures correct behavior when using JWT-based proofs.
- **Update Status Using Encoded List**: Verifies updates to `StatusList2021` credentials using pre-encoded status lists.
- **Conversion to Verifiable Credential**: Tests the conversion of a `StatusList2021` to a verifiable credential in both string and object issuer formats, ensuring all required fields are correctly handled.

### OAuthStatusList Tests

- **Create and Update Using JWT Format**: Confirms proper creation and modification of `OAuthStatusList` credentials using JWT-based proofs.
- **Invalid Proof Format Rejection**: Tests that invalid proof formats (e.g., LD-Signatures) are correctly rejected for `OAuthStatusList`.

### Utility Tests

- **Updating Status Indices**: Validates the ability to update status indices within status lists for both `StatusList2021` and `OAuthStatusList`.
- **Error Handling**: Ensures missing or invalid fields throw appropriate errors during credential creation or updates.

## Purpose of a Separate Package

This package is maintained as a separate testing module to:

1. **Avoid Cyclic Dependencies**: Prevent cyclic dependency issues with `@sphereon/ssi-sdk.vc-handler-ld-local` and other related packages.
2. **More Flexible With Other Dependencies**: Allows imports from additional packages without adding them to `vc-handler-ld-local`, where some of these tests originated.

## Dependencies

This package leverages several dependencies, including:

- `@veramo/core` and related plugins for DID management and credential handling.
- `@sphereon` SDK extensions for enhanced functionality like key management and identifier resolution.
- `jest` for running the test suite.

## How to Use

1. **Install Dependencies**:
   Run `pnpm install` to install the necessary dependencies. Ensure all workspace links are correctly resolved.

2. **Run Tests**:
   Execute the test suite using:
   ```bash
   pnpm test
   ```
