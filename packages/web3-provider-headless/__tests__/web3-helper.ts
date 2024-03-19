import { Signer } from 'ethers'
import { createWeb3Provider, IWeb3Provider } from '../src'

/**
 * injectWeb3Provider - Function to create and inject web3 provider instance into the global window object
 *
 * @returns {Array} An array containing the wallets and the web3Provider instance
 */
export function injectWeb3Provider(opts?: { signers?: Signer[] }): [Signer[], IWeb3Provider] {
  /* const wallet: Signer = Wallet.fromEncryptedJsonSync(
    '{"address":"0c45d104d250b72301a7158fb27a8a4d4567b9ce","crypto":{"cipher":"aes-128-ctr","ciphertext":"6d388a272b062d155b18100ca7c78ad2fcd49c21171677ec37a5c913e768bc9e","cipherparams":{"iv":"f73a50cf77dcafdd498a225b8f0da125"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"088ade08639879b3532b49266ba16078cfe44515707ba3b17c9a911d750b6e40"},"mac":"905c5baef19f3c545dd7708be4ee94a95231a1e1c24966e97ccb4f01e9721b9a"},"id":"85a4618e-1f41-4cfe-bc62-0120aa7d517c","version":3}',
    'rvvb'
  )*/
  const wallets: Signer[] = []
  if (opts?.signers) {
    wallets.push(...opts.signers)
  }
  if (wallets.length === 0) {
    throw Error(`Not wallet/signer available to inject`)
  }

  // Create an instance of the Web3Provider
  let web3Provider: IWeb3Provider = createWeb3Provider(
    wallets,
    [100], // Chain ID - 31337 or  is a common testnet id
    // [1337], 'http://127.0.0.1:8545' // Ethereum client's JSON-RPC URL
    'https://rpc.genx.minimal-gaia-x.eu',
  )

  // Expose the web3Provider instance to the global window object
  if (typeof window !== 'undefined') {
    // @ts-ignore-error
    window.ethereum = web3Provider
  }

  // Return the created wallets and web3Provider instance
  return [wallets, web3Provider]
}
