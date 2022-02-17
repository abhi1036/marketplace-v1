import Layout from 'components/Layout'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from 'next'
import Homepage from 'components/Homepage'
import CommunityLanding from 'components/CommunityLanding'
import TokensMain from 'components/TokensMain'
import { ComponentProps } from 'react'
import { useAccount } from 'wagmi'
import useDataDog from 'hooks/useAnalytics'
import handleWildcard from 'lib/handleWildcard'

const apiBase = process.env.NEXT_PUBLIC_API_BASE
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
const collectionEnv = process.env.NEXT_PUBLIC_COLLECTION
const communityEnv = process.env.NEXT_PUBLIC_COMMUNITY
const openSeaApiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY

type Props = InferGetServerSidePropsType<typeof getServerSideProps>

const Home: NextPage<Props> = ({ wildcard, isCommunity }) => {
  const fallback: ComponentProps<typeof TokensMain>['fallback'] = {
    collection: { collection: undefined },
    tokens: { tokens: undefined },
  }
  const [{ data: accountData }] = useAccount()
  useDataDog(accountData)
  const isHome = wildcard === 'www'

  if (!apiBase || !chainId) {
    console.debug({ apiBase, chainId })
    return <div>There was an error</div>
  }

  return (
    <Layout>
      {isHome ? (
        <Homepage apiBase={apiBase} />
      ) : isCommunity ? (
        <CommunityLanding apiBase={apiBase} wildcard={wildcard} />
      ) : (
        <TokensMain
          collectionId={wildcard}
          apiBase={apiBase}
          chainId={+chainId as ChainId}
          fallback={fallback}
          openSeaApiKey={openSeaApiKey}
        />
      )}
    </Layout>
  )
}

export default Home

export const getServerSideProps: GetServerSideProps<{
  wildcard: string
  isCommunity: boolean
}> = async ({ req }) => {
  const { wildcard, isCommunity } = handleWildcard(
    req,
    communityEnv,
    collectionEnv
  )

  return { props: { wildcard, isCommunity } }
}
