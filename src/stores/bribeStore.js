import BigNumber from 'bignumber.js'
import { v4 as uuidv4 } from 'uuid'
import stores from '.'
import { ACTIONS, ZERO_ADDRESS, CONTRACTS } from './constants'

export default class BribeStore {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher
    this.emitter = emitter
    this.store = {
      bribes: [],
    }
    dispatcher.register(({ type, content }) => {
      switch (type) {
        case ACTIONS.GET_BRIBES:
          this.getBribes(content.pairs)
          break
        case ACTIONS.GET_BRIBE_REWARDS:
          this.getBribesByNFTId(content.nftId)
          break
        case ACTIONS.CLAIM_TOKEN_BRIBE:
          this.claimTokenBribe(content)
          break
      }
    })
  }
  
  getStore = (index) => {
    return this.store[index]
  }

  getTXUUID = () => {
    return uuidv4()
  }

  // Fetches the earned by nft id
  // Gets the bribe rewards for a tokenID
  getBribesByNFTId = async (tokenID) => {
    const web3 = await stores.accountStore.getWeb3Provider()

    // Calculates the earned for each pair bribes.
    // Attaches the earned and tokenID to each bribe
    await Promise.all(
      this.store.bribes.map(async (bribe) => {
        const bribeContract = new web3.eth.Contract(CONTRACTS.V2_BRIBE_ABI, bribe.address)
        const earned = await bribeContract.methods.earned(bribe.token.address, tokenID).call()
        bribe.earned = BigNumber(earned)
          .div(10 ** bribe.token.decimals)
          .toFixed(bribe.token.decimals)
        bribe.tokenID = tokenID
        return bribe
      })
    )
    stores.emitter.emit(ACTIONS.BRIBES_STORE_UPDATED)
  }
  // Fetches and attaches the v2Bribes for each pair.
  getBribes = async (pairs) => {
    const web3 = await stores.accountStore.getWeb3Provider()

    const bribes = []
    await Promise.all(
      pairs.map(async (pair) => {
        if (pair.gauge?.address && pair.gauge.address !== ZERO_ADDRESS) {
          const v2VoterContract = new web3.eth.Contract(CONTRACTS.V2_VOTER_ABI, CONTRACTS.V2_VOTER_ADDRESS)
          const v2BribeAddress = await v2VoterContract.methods.bribes(pair.gauge.address).call()
          if (v2BribeAddress !== ZERO_ADDRESS) {
            const v2BribeContract = new web3.eth.Contract(CONTRACTS.V2_BRIBE_ABI, v2BribeAddress)

            // Fetches the bribe reward length and formats the bribe objects for each bribe
            const v2TokensLength = await v2BribeContract.methods.rewardsListLength().call()
            const v2Arry = Array.from({ length: parseInt(v2TokensLength) }, (v, i) => i)

            await Promise.all(
              v2Arry.map(async (idx) => {
                const tokenAddress = await v2BribeContract.methods.rewards(idx).call()
                const token = await stores.stableSwapStore.getBaseAsset(tokenAddress)
                const rewardRate = await v2BribeContract.methods.rewardRate(tokenAddress).call()

                const bribe = {
                  token,
                  symbol: pair.symbol,
                  address: v2BribeAddress,
                  rewardRate: BigNumber(rewardRate)
                    .div(10 ** token.decimals)
                    .toFixed(token.decimals),
                  rewardAmount: BigNumber(rewardRate)
                    .times(604800)
                    .div(10 ** token.decimals)
                    .toFixed(token.decimals),
                }

                bribes.push(bribe)
              })
            )
          }
        }
      })
    )
    this.store.bribes = bribes
    this.emitter.emit(ACTIONS.BRIBES_STORE_UPDATED)
  }

  // Claims a single token bribe. Used by the Claim Bribe button on the Bribe page
  claimTokenBribe = async ({ tokenID, bribe, pair }) => {
    try {
      console.log(pair)
      const account = stores.accountStore.getStore('account')
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID()

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Claim ${bribe.token.symbol} for ${tokenID}`,
        verb: 'Rewards Claimed',
        transactions: [
          {
            uuid: claimTXID,
            description: `Claiming your bribe`,
            status: 'WAITING',
          },
        ],
      })

      const gasPrice = await stores.accountStore.getGasPrice()

      // SUBMIT CLAIM TRANSACTION
      const v2VoterContract = new web3.eth.Contract(CONTRACTS.V2_VOTER_ABI, CONTRACTS.V2_VOTER_ADDRESS)

      const sendGauges = [bribe.address]
      const sendTokens = [[bribe.token.address]]
      this._callContractWait(
        web3,
        v2VoterContract,
        'claimBribes',
        [tokenID, sendGauges, sendTokens],
        account,
        gasPrice,
        null,
        null,
        claimTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err)
          }

          this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED)
        }
      )
    } catch (ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  claimBribes = async (payload) => {
    try {
      const account = stores.accountStore.getStore('account')
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { pair, tokenID } = payload.content
      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID()

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Claim rewards for ${pair.token0.symbol}/${pair.token1.symbol}`,
        verb: 'Rewards Claimed',
        transactions: [
          {
            uuid: claimTXID,
            description: `Claiming your bribes`,
            status: 'WAITING',
          },
        ],
      })

      const gasPrice = await stores.accountStore.getGasPrice()

      // SUBMIT CLAIM TRANSACTION
      const v2VoterContract = new web3.eth.Contract(CONTRACTS.V2_VOTER_ABI, CONTRACTS.V2_VOTER_ADDRESS)

      const sendGauges = [pair.gauge.v2BribeAddress]
      const sendTokens = [pair.gauge.v2Bribes.map((bribe) => bribe.token.address)]
      this._callContractWait(
        web3,
        v2VoterContract,
        'claimBribes',
        [tokenID, sendGauges, sendTokens],
        account,
        gasPrice,
        null,
        null,
        claimTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err)
          }

          this.getRewardBalances({ content: { tokenID } })
          this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED)
        }
      )
    } catch (ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  _callContractWait = (
    web3,
    contract,
    method,
    params,
    account,
    gasPrice,
    dispatchEvent,
    dispatchContent,
    uuid,
    callback,
    paddGasCost,
    sendValue = null
  ) => {
    this.emitter.emit(ACTIONS.TX_PENDING, { uuid })

    const gasCost = contract.methods[method](...params)
      .estimateGas({ from: account.address, value: sendValue })
      .then((gasAmount) => {
        const context = this

        let sendGasAmount = BigNumber(gasAmount).times(1.5).toFixed(0)
        let sendGasPrice = BigNumber(gasPrice).times(1.5).toFixed(0)
      
        contract.methods[method](...params)
          .send({
            from: account.address,
            gasPrice: web3.utils.toWei(sendGasPrice, 'gwei'),
            gas: sendGasAmount,
            value: sendValue,
          })
          .on('transactionHash', function (txHash) {
            context.emitter.emit(ACTIONS.TX_SUBMITTED, { uuid, txHash })
          })
          .on('receipt', function (receipt) {
            context.emitter.emit(ACTIONS.TX_CONFIRMED, {
              uuid,
              txHash: receipt.transactionHash,
            })
            callback(null, receipt.transactionHash)
            if (dispatchEvent) {
              context.dispatcher.dispatch({
                type: dispatchEvent,
                content: dispatchContent,
              })
            }
          })
          .on('error', function (error) {
            if (!error.toString().includes('-32601')) {
              if (error.message) {
                context.emitter.emit(ACTIONS.TX_REJECTED, {
                  uuid,
                  error: error.message,
                })
                return callback(error.message)
              }
              context.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error })
              callback(error)
            }
          })
          .catch((error) => {
            if (!error.toString().includes('-32601')) {
              if (error.message) {
                context.emitter.emit(ACTIONS.TX_REJECTED, {
                  uuid,
                  error: error.message,
                })
                return callback(error.message)
              }
              context.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error })
              callback(error)
            }
          })
      })
      .catch((ex) => {
        console.log(ex)
        if (ex.message) {
          this.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: ex.message })
          return callback(ex.message)
        }
        this.emitter.emit(ACTIONS.TX_REJECTED, {
          uuid,
          error: 'Error estimating gas',
        })
        callback(ex)
      })
  }
}
