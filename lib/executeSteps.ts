import { Signer } from 'ethers'
import { pollApi } from './pollApi'

export type Execute = {
  steps?:
    | {
        action: string
        description: string
        status: 'complete' | 'incomplete'
        kind: 'transaction' | 'order-signature'
        data?: any
      }[]
    | undefined
  error?: string | undefined
}

/**
 * When attempting to perform actions, such as, selling a token or
 * buying a token, the user's account needs to meet certain requirements. For
 * example, if the user attempts to buy a token the Reservoir API checks if the
 * user has enough balance, before providing the transaction to be signed by
 * the user. This function executes all transactions, in order, to complete the
 * action.
 * @param url URL object with the endpoint to be called. Example: `/execute/buy`
 * @param signer Ethereum signer object provided by the browser
 * @returns The data field of the last element in the steps array
 */
export default async function executeSteps(url: URL, signer: Signer) {
  const res = await fetch(url.href)

  const json = (await res.json()) as Execute

  if (json.error) throw new Error(json.error)

  if (!json.steps) throw new ReferenceError('There are no steps.')

  for (let index = 0; index < json.steps.length; index++) {
    const { status, kind, data } = json.steps[index]

    // Execute all incomplete steps
    if (status === 'incomplete' && kind === 'transaction') {
      let transactionRequest = data

      // If the step is incomplete and there is no data, the API is
      // waiting for data from the previous step. Poll the same
      // endpoint with the same query and procced once the data is
      // returned
      if (!data) transactionRequest = await pollApi(url, index)

      const tx = await signer.sendTransaction(transactionRequest)

      await tx.wait()
    }
  }
}
