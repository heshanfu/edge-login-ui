// @flow

import type { EdgeAccount, EdgeContext, EdgeContextOptions } from 'edge-core-js'
import { makeContext } from 'edge-core-js'
import postRobot from 'post-robot'

import type {
  ClientDispatch,
  ConnectionMessage,
  ConnectionReply,
  FrameMessage,
  PostRobotEvent
} from '../protocol.js'
import { updateView } from './View.js'

/**
 * Hacking around incorrect environment detection in the core.
 */
function makeEdgeContext (opts: EdgeContextOptions) {
  return Promise.resolve(makeContext(opts))
}

/**
 * The state the client stores.
 */
export type FrameState = {
  accounts: { [accountId: string]: EdgeAccount },
  context: EdgeContext,
  nextAccountId: number,
  page: '' | 'login' | 'account',
  pageAccountId: string,
  vendorImageUrl: string,
  vendorName: string,

  // Frame callbacks:
  clientDispatch: ClientDispatch
}

/**
 * Grabs the wallet infos out of an account object, sanitizing them as needed.
 */
export function getWalletInfos (state: FrameState, accountId: string) {
  const account = state.accounts[accountId]
  const locked: boolean = false

  const out = {}
  for (const walletInfo of account.allKeys) {
    const { type, id, archived, deleted, sortIndex } = walletInfo
    out[walletInfo.id] = { type, id, archived, deleted, sortIndex }
    if (!locked) {
      out[walletInfo.id].keys = walletInfo.keys
      out[walletInfo.id].appIds = walletInfo.appIds
    }
  }
  return out
}

function frameDispatch (state: FrameState, message: FrameMessage) {
  switch (message.type) {
    case 'logout': {
      const { accountId } = message.payload
      state.accounts[accountId].logout()
      delete state.accounts[accountId]
      return
    }

    case 'open-login-window': {
      state.page = 'login'
      updateView(state)
      return
    }

    case 'open-manage-window': {
      state.page = 'account'
      const { accountId } = message.payload
      state.pageAccountId = accountId
      updateView(state)
      return
    }
  }

  throw new Error('Unknown frame message')
}

/**
 * Creates the initial frame state object.
 */
async function makeFrameState (opts: ConnectionMessage): Promise<FrameState> {
  const {
    apiKey,
    appId,
    vendorName = '',
    vendorImageUrl = '',
    clientDispatch
  } = opts
  const context = await makeEdgeContext({ apiKey, appId })

  return {
    accounts: {},
    context,
    nextAccountId: 0,
    page: '',
    pageAccountId: '',
    vendorImageUrl,
    vendorName,

    clientDispatch
  }
}

export function awaitConnection () {
  return postRobot.on(
    'connect',
    async (
      event: PostRobotEvent<ConnectionMessage>
    ): Promise<ConnectionReply> => {
      const state = await makeFrameState(event.data)
      updateView(state)

      return {
        createWallet (accountId: string, type: string, keys: {}) {
          return state.accounts[accountId]
            .createWallet(type, keys)
            .then(walletId => {
              const walletInfos = getWalletInfos(state, accountId)
              return { walletId, walletInfos }
            })
        },

        frameDispatch (message: FrameMessage) {
          return frameDispatch(state, message)
        }
      }
    }
  )
}
