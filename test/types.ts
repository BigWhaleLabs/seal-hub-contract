import { SealHub, SealHub__factory } from 'typechain'
import type { MockContract } from 'ethereum-waffle'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'

declare module 'mocha' {
  export interface Context {
    // Facoriries for contracts
    SealHubFactory: SealHub__factory
    SealHubContract: SealHub
    // Mock contracts
    fakeVerifierContract: MockContract
    // Signers
    accounts: SignerWithAddress[]
    owner: SignerWithAddress
    user: SignerWithAddress
  }
}
