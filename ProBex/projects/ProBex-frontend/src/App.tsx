import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

const supportedWallets: SupportedWallet[] = [{ id: WalletId.PERA }]

const algodConfig = getAlgodConfigFromViteEnvironment()

const walletManager = new WalletManager({
  wallets: supportedWallets,
  defaultNetwork: algodConfig.network,
  networks: {
    [algodConfig.network]: {
      algod: {
        baseServer: algodConfig.server,
        port: algodConfig.port,
        token: String(algodConfig.token),
      },
    },
  },
})

export default function App() {

  return (
    <BrowserRouter>
      <WalletProvider manager={walletManager}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WalletProvider>
    </BrowserRouter>
  )
}
