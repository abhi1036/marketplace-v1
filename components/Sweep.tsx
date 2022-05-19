import { buyToken, buyTokenBeta, Execute, paths } from '@reservoir0x/client-sdk'
import React, {
  ComponentProps,
  FC,
  useContext,
  useEffect,
  useState,
} from 'react'
import { SWRResponse } from 'swr'
import * as Dialog from '@radix-ui/react-dialog'
import Toast from './Toast'
import { useAccount, useNetwork, useSigner } from 'wagmi'
import { SWRInfiniteResponse } from 'swr/infinite/dist/infinite'
import { GlobalContext } from 'context/GlobalState'
import useTokens from 'hooks/useTokens'
import { HiX } from 'react-icons/hi'
import useCollection from 'hooks/useCollection'
import { optimizeImage } from 'lib/optmizeImage'
import FormatEth from './FormatEth'
import AttributesFlex from './AttributesFlex'
import ModalCard from './modal/ModalCard'

const RESERVOIR_API_BASE = process.env.NEXT_PUBLIC_RESERVOIR_API_BASE
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID

type Details = paths['/tokens/details/v4']['get']['responses']['200']['schema']

type Tokens = ReturnType<typeof useTokens>['tokens']

type Props = {
  tokens: Tokens
  collection: ReturnType<typeof useCollection>
  mutate?: SWRResponse['mutate'] | SWRInfiniteResponse['mutate']
  setToast: (data: ComponentProps<typeof Toast>['data']) => any
}

const Sweep: FC<Props> = ({ tokens, collection, mutate, setToast }) => {
  const [waitingTx, setWaitingTx] = useState<boolean>(false)
  const { data: accountData } = useAccount()
  const { activeChain } = useNetwork()
  const { data: signer } = useSigner()
  const [steps, setSteps] = useState<Execute['steps']>()
  const [sweepAmount, setSweepAmount] = useState<number>(1)
  const [maxInput, setMaxInput] = useState<number>(0)
  const [sweepTokens, setSweepTokens] = useState<
    NonNullable<Tokens['data']>[0]['tokens']
  >([])
  const [sweepTotal, setSweepTotal] = useState<number>(0)
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<SWRResponse<Details, any> | Details>()
  const { dispatch } = useContext(GlobalContext)

  const isInTheWrongNetwork = Boolean(
    signer && CHAIN_ID && activeChain?.id !== +CHAIN_ID
  )

  const { data } = tokens

  // Reference: https://swr.vercel.app/examples/infinite-loading
  const mappedTokens = data
    ? data
        .flatMap(({ tokens }) => tokens)
        .filter((token) => token?.floorAskPrice)
    : []

  useEffect(() => {
    const sweepTokens = mappedTokens
      .filter((value) => value !== undefined)
      .slice(0, sweepAmount)
    // @ts-ignore
    setSweepTokens(sweepTokens)

    let total = 0

    sweepTokens.forEach((token) => {
      if (token?.floorAskPrice) {
        total += token?.floorAskPrice
      }
    })

    setSweepTotal(total)
  }, [sweepAmount, data])

  useEffect(() => setMaxInput(mappedTokens.length), [mappedTokens])

  // Set the token either from SWR or fetch
  let token: NonNullable<Details['tokens']>[0] = { token: undefined }

  // From fetch
  if (details && 'tokens' in details && details.tokens?.[0]) {
    token = details.tokens?.[0]
  }

  // From SWR
  if (details && 'data' in details && details?.data?.tokens?.[0]) {
    token = details.data?.tokens?.[0]
  }

  const handleError: Parameters<typeof buyToken>[0]['handleError'] = (
    err: any
  ) => {
    if (err?.type === 'price mismatch') {
      setToast({
        kind: 'error',
        message: 'Price was greater than expected.',
        title: 'Could not buy token',
      })
      return
    }

    if (err?.message === 'Not enough ETH balance') {
      setToast({
        kind: 'error',
        message: 'You have insufficient funds to buy this token.',
        title: 'Not enough ETH balance',
      })
      return
    }
    // Handle user rejection
    if (err?.code === 4001) {
      setOpen(false)
      setSteps(undefined)
      setToast({
        kind: 'error',
        message: 'You have canceled the transaction.',
        title: 'User canceled transaction',
      })
      return
    }
    setToast({
      kind: 'error',
      message: 'The transaction was not completed.',
      title: 'Could not buy token',
    })
  }

  const handleSuccess: Parameters<typeof buyToken>[0]['handleSuccess'] = () => {
    details && 'mutate' in details && details.mutate()
    mutate && mutate()
  }

  const execute = async (taker: string) => {
    setWaitingTx(true)

    const query: Parameters<typeof buyTokenBeta>['0']['query'] = {
      taker,
    }

    sweepTokens?.forEach(
      (token, index) =>
        // @ts-ignore
        (query[`tokens[${index}]`] = `${token.contract}:${token.tokenId}`)
    )

    await buyTokenBeta({
      expectedPrice: sweepTotal,
      query,
      signer,
      apiBase: RESERVOIR_API_BASE,
      setState: setSteps,
      handleSuccess,
      handleError,
    })

    setWaitingTx(false)
  }

  const taker = accountData?.address

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        disabled={
          token?.market?.floorAsk?.price === null ||
          waitingTx ||
          isInTheWrongNetwork
        }
        className="btn-primary-fill w-full dark:ring-primary-900 dark:focus:ring-4 md:w-[222px]"
      >
        Sweep
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay>
          {steps ? (
            <ModalCard title="Buy Now" loading={waitingTx} steps={steps} />
          ) : (
            <Dialog.Content className="fixed inset-0 z-10 bg-[#000000b6]">
              <div className="fixed top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform rounded-2xl border border-neutral-300 bg-white p-11 shadow-xl dark:border-neutral-600 dark:bg-black md:w-[639px]">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title className="reservoir-h4 font-headings dark:text-white">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          collection?.data?.collection?.metadata
                            ?.imageUrl as string
                        }
                        alt=""
                        className="block h-12 w-12 rounded-full"
                      />
                      <div className="reservoir-h5 dark:text-white">
                        {collection?.data?.collection?.name}
                      </div>
                    </div>
                  </Dialog.Title>
                  <Dialog.Close className="btn-primary-outline p-1.5 dark:border-neutral-600 dark:text-white dark:ring-primary-900 dark:focus:ring-4">
                    <HiX className="h-5 w-5" />
                  </Dialog.Close>
                </div>
                <AttributesFlex className="mb-4 flex flex-wrap gap-3" />
                <div className="mb-4 flex items-center gap-4">
                  <input
                    value={sweepAmount}
                    type="range"
                    name="amount"
                    id="amount"
                    min={1}
                    max={maxInput}
                    step={1}
                    onChange={(e) => setSweepAmount(+e.target.value)}
                    className="hidden w-full flex-grow md:block"
                  />
                  <input
                    value={sweepAmount}
                    min={1}
                    max={maxInput}
                    step={1}
                    onChange={(e) => setSweepAmount(+e.target.value)}
                    type="number"
                    name="amount"
                    id="amount"
                    className="input-primary-outline w-full px-2 dark:border-neutral-600 dark:bg-neutral-900 dark:ring-primary-900  dark:focus:ring-4 md:w-20"
                  />
                </div>
                <div className="mb-8 grid h-[215px] grid-cols-5 justify-center gap-2 overflow-y-auto pr-2 md:grid-cols-7">
                  {sweepTokens?.map((token) => (
                    <div className="relative" key={token.tokenId}>
                      <img
                        className="absolute top-1 right-1 h-4 w-4"
                        src={`https://api.reservoir.tools/redirect/logo/v1?source=${token?.source}`}
                        alt=""
                      />
                      <img
                        src={optimizeImage(token?.image, 72)}
                        alt=""
                        className="mb-2 h-[72px] w-full rounded-lg object-contain"
                      />
                      <div className="reservoir-subtitle text-center dark:text-white">
                        <FormatEth
                          amount={token?.floorAskPrice}
                          maximumFractionDigits={4}
                          logoWidth={7}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mb-4 flex justify-between">
                  <div className="reservoir-h6 text-center dark:text-white">
                    Total Price
                  </div>
                  <div className="reservoir-h5 text-center dark:text-white">
                    <FormatEth
                      amount={sweepTotal}
                      maximumFractionDigits={4}
                      logoWidth={7}
                    />
                  </div>
                </div>
                <button
                  disabled={
                    token?.market?.floorAsk?.price === null ||
                    waitingTx ||
                    isInTheWrongNetwork
                  }
                  onClick={async () => {
                    if (!taker) {
                      dispatch({ type: 'CONNECT_WALLET', payload: true })
                      return
                    }

                    await execute(taker)
                  }}
                  className="btn-primary-fill w-full dark:ring-primary-900 dark:focus:ring-4 md:mx-auto md:w-[248px]"
                >
                  Buy Now
                </button>
              </div>
            </Dialog.Content>
          )}
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default Sweep
