import { FC } from 'react'
import ConnectWallet from './ConnectWallet'
import Link from 'next/link'
import InfoModal from './InfoModal'

type Props = {
  title: string | undefined
  image: string | undefined
}

const Navbar: FC<Props> = ({ title, image }) => {
  return (
    <nav className="flex items-center justify-between">
      <Link href="/">
        {title ? (
          <a className="flex items-center justify-between gap-3">
            {image && <img src={image} alt={title} className="w-[30px]" />}
            {title && <span className="font-semibold">{title}</span>}
          </a>
        ) : (
          <a className="flex items-center gap-1.5">
            <img
              src="/reservoir.svg"
              alt="Reservoir Logo"
              className="h-5 w-5"
            />
            <span className="font-['Obvia'] text-lg">reservoir.market</span>
          </a>
        )}
      </Link>
      <div className="flex items-center gap-6">
        <InfoModal />
        <ConnectWallet />
      </div>
    </nav>
  )
}

export default Navbar
