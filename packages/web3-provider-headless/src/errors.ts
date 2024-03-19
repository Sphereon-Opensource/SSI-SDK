export class ErrorWithCode extends Error {
  constructor(
    message?: string,
    public code?: number,
  ) {
    super(message)
    return this
  }
}

export const Deny = (): ErrorWithCode => new ErrorWithCode('The user rejected the request.', 4001)

export const Unauthorized = (): ErrorWithCode => new ErrorWithCode('The requested method and/or account has not been authorized by the user.', 4100)

export const UnsupportedMethod = (): ErrorWithCode => new ErrorWithCode('The Provider does not support the requested method.', 4200)

export const Disconnected = (): ErrorWithCode => new ErrorWithCode('The Provider is disconnected from all chains.', 4900)

export const ChainDisconnected = (): ErrorWithCode => new ErrorWithCode('The Provider is not connected to the requested chain.', 4901)

export const UnrecognizedChainID = (): ErrorWithCode =>
  new ErrorWithCode('Unrecognized chain ID. Try adding the chain using `wallet_addEthereumChain` first.', 4902)
