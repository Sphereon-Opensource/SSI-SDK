<!--suppress HtmlDeprecatedAttribute -->
<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>Sphereon Key Management System (local)
  <br>
</h1>

A Sphereon KMS implementation that provides Ed25519 and secp256k1 and Bls (currently disabled because of continuous problems with a not-well maintained library) crypto.

This module is an extension of [`KeyManagementSystem`](../../node_modules/@veramo/kms-local/src/key-management-system.ts) and
[`key-manager`](../../node_modules/@veramo/key-manager/src/key-manager.ts) plugin to provide RSA, secp256k1 and bls functionality to a
Sphereon agent.

The keys managed by this module are stored in an implementation
of [`AbstractPrivateKeyStore`](../key-manager/src/abstract-private-key-store.ts).
See [`MemoryPrivateKeyStore`](../key-manager/src/memory-key-store.ts#L43)
or [`PrivateKeyStore`](../data-store/src/identifier/private-key-store.ts) for implementations.
