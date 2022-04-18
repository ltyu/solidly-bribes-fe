import AccountStore from './accountStore'
import StableSwapStore from './stableSwapStore'
import BribeStore from './bribeStore'

const Dispatcher = require('flux').Dispatcher
const Emitter = require('events').EventEmitter

const dispatcher = new Dispatcher()
const emitter = new Emitter()

const accountStore = new AccountStore(dispatcher, emitter)
const stableSwapStore = new StableSwapStore(dispatcher, emitter)
const bribeStore = new BribeStore(dispatcher, emitter)

export default {
  accountStore,
  stableSwapStore,
  bribeStore,
  dispatcher,
  emitter,
}
