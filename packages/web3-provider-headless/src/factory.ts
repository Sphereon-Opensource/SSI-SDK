import { Signer } from 'ethers'
import { EventEmitter } from './event-emitter'
import { IWeb3Provider, Web3ProviderConfig } from './types'
import { Web3HeadlessProvider } from './web3-headless-provider'

type Fn = (...args: any[]) => any

export function createWeb3Provider(
  signers: Signer[],
  chainId: number,
  rpcUrl: string,
  evaluate: <T extends keyof IWeb3Provider>(
    method: T,
    ...args: IWeb3Provider[T] extends Fn ? Parameters<IWeb3Provider[T]> : []
  ) => Promise<void> = async () => {},
  config?: Web3ProviderConfig
): IWeb3Provider {
  const web3Provider = new Web3HeadlessProvider(signers, [{ chainId, rpcUrl }], config)
  relayEvents(web3Provider, evaluate)
  return web3Provider
}

function relayEvents(
  eventEmitter: EventEmitter,
  execute: <T extends keyof IWeb3Provider>(method: T, ...args: IWeb3Provider[T] extends Fn ? Parameters<IWeb3Provider[T]> : []) => Promise<void>
): void {
  const emit_ = eventEmitter.emit
  eventEmitter.emit = (eventName, ...args) => {
    void execute('emit', eventName, ...args)
    return emit_.apply(eventEmitter, [eventName, ...args])
  }
}
