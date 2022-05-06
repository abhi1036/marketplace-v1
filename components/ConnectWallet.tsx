import { FC } from 'react'
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
} from 'wagmi'
import EthAccount from './EthAccount'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import { HiOutlineLogout } from 'react-icons/hi'
import FormatEth from './FormatEth'
import ConnectWalletModal from './ConnectWalletModal'

const ConnectWallet: FC = () => {
  const { data: account, isLoading } = useAccount()
  const { data: ensAvatar } = useEnsAvatar({ addressOrName: account?.address })
  const { data: ensName } = useEnsName({ address: account?.address })
  const { connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const wallet = connectors[0]

  if (isLoading) return null

  if (!account) return <ConnectWalletModal />

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="btn-primary-outline  ml-auto rounded-full border-transparent bg-gray-100 normal-case dark:border-neutral-600 dark:bg-neutral-900 dark:ring-primary-900 dark:focus:ring-4">
        <EthAccount
          address={account.address}
          ens={{
            avatar: ensAvatar,
            name: ensName,
          }}
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        align="end"
        sideOffset={6}
        className="w-48 space-y-1 rounded bg-white px-1.5 py-2 shadow-md radix-side-bottom:animate-slide-down  dark:bg-neutral-900 md:w-56"
      >
        <div className="group flex w-full items-center justify-between rounded px-4 py-3 outline-none transition">
          <span>Balance </span>
          <span>
            {account.address && <Balance address={account.address} />}
          </span>
        </div>
        <Link href={`/address/${account.address}`}>
          <DropdownMenu.Item asChild>
            <a className="group flex w-full cursor-pointer items-center justify-between rounded px-4 py-3 outline-none transition hover:bg-neutral-100 focus:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800">
              Portfolio
            </a>
          </DropdownMenu.Item>
        </Link>
        <DropdownMenu.Item asChild>
          <button
            key={wallet.id}
            onClick={() => disconnect()}
            className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded px-4 py-3 outline-none transition hover:bg-neutral-100 focus:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
          >
            <span>Disconnect</span>
            <HiOutlineLogout className="h-6 w-7" />
          </button>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}

export default ConnectWallet

type Props = {
  address: string
}

export const Balance: FC<Props> = ({ address }) => {
  const { data: balance } = useBalance({ addressOrName: address })
  return <FormatEth amount={balance?.value} maximumFractionDigits={4} />
}
