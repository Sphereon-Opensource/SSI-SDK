import { Signer } from 'ethers'
import { EventEmitter } from './event-emitter'
import { IWeb3Provider, Web3ProviderConfig } from './types'
import { EthersHeadlessProvider } from './ethers-headless-provider'

type Fn = (...args: any[]) => any

function relayEvents(
  eventEmitter: EventEmitter,
  execute: <T extends keyof IWeb3Provider>(method: T, ...args: IWeb3Provider[T] extends Fn ? Parameters<IWeb3Provider[T]> : []) => Promise<void>,
): void {
  const emit_ = eventEmitter.emit
  eventEmitter.emit = (eventName, ...args) => {
    void execute('emit', eventName, ...args)
    return emit_.apply(eventEmitter, [eventName, ...args])
  }
}

export function createWeb3Provider(
  signers: Signer[],
  chainId: number | number[],
  rpcUrl: string,
  evaluate: <T extends keyof IWeb3Provider>(
    method: T,
    ...args: IWeb3Provider[T] extends Fn ? Parameters<IWeb3Provider[T]> : []
  ) => Promise<void> = async () => {},
  config?: Web3ProviderConfig,
): IWeb3Provider {
  const chainIds: number[] = Array.isArray(chainId) ? chainId : [chainId]
  const chains = chainIds.map((chainId) => {
    return { chainId, rpcUrl }
  })
  const web3Provider = new EthersHeadlessProvider(signers, chains, config)
  relayEvents(web3Provider, evaluate)
  return web3Provider
}
