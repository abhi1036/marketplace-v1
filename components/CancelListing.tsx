import { Signer } from 'ethers'
import { paths } from 'interfaces/apiTypes'
import executeSteps, { Execute } from 'lib/executeSteps'
import setParams from 'lib/params'
import { pollSwr } from 'lib/pollApi'
import React, { FC, useState } from 'react'
import { SWRResponse } from 'swr'
import StepsModal from './StepsModal'

type Props = {
  isInTheWrongNetwork: boolean | undefined
  details: SWRResponse<
    paths['/tokens/details']['get']['responses']['200']['schema'],
    any
  >
  apiBase: string
  signer: Signer | undefined
}

const CancelListing: FC<Props> = ({
  isInTheWrongNetwork,
  details,
  apiBase,
  signer,
}) => {
  const [waitingTx, setWaitingTx] = useState<boolean>(false)
  const [steps, setSteps] = useState<Execute['steps']>()

  const token = details.data?.tokens?.[0]
  return (
    <>
      {steps && <StepsModal steps={steps} />}
      <button
        disabled={waitingTx || isInTheWrongNetwork}
        onClick={async () => {
          const hash = token?.market?.floorSell?.hash
          const maker = token?.market?.floorSell?.maker

          if (!signer || !hash || !maker) {
            console.debug({ hash, signer, maker })
            return
          }

          const url = new URL('/execute/cancel', apiBase)

          const query: paths['/execute/cancel']['get']['parameters']['query'] =
            {
              hash,
              maker,
            }

          setParams(url, query)
          setWaitingTx(true)

          try {
            await executeSteps(url, signer, (execute) =>
              setSteps(execute.steps)
            )
            await pollSwr(details.data, details.mutate)
          } catch (err) {
            console.error(err)
          }

          setWaitingTx(false)
          setSteps(undefined)
        }}
        className="btn-red-ghost col-span-2 mx-auto mt-6"
      >
        {waitingTx ? 'Waiting...' : 'Cancel listing'}
      </button>
    </>
  )
}

export default CancelListing
