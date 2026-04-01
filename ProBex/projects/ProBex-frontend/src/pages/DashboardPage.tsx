import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import Home, { QUESTIONS, CATEGORIES } from '../Home'
import ConnectWallet from '../components/ConnectWallet'
import { MarketList, MarketAnalytics, PredictionMarket } from '../components/MarketAnalytics'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../utils/supabase'
import { APP_ID } from '../utils/probexClient'

const LORA_BASE = 'https://lora.algokit.io/testnet'

export default function DashboardPage() {
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()
    const { activeAddress, wallets } = useWallet()
    const [activeTab, setActiveTab] = useState<'contract' | 'markets'>('contract')
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [walletModalOpen, setWalletModalOpen] = useState(false)
    const [filterCat, setFilterCat] = useState<string>('All')
    const [selectedAnalyticsMarket, setSelectedAnalyticsMarket] = useState<PredictionMarket | null>(null)

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login')
        }
    }, [user, authLoading, navigate])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/')
    }

    const handleDisconnect = async () => {
        const active = wallets?.find((w) => w.isActive)
        if (active) await active.disconnect()
    }

    // Don't render while checking auth or if not authenticated
    if (authLoading || !user) return null

    // Convert live QUESTIONS to PredictionMarket for analytics tab
    const analyticsMarkets: PredictionMarket[] = QUESTIONS.filter(q => q.live).map(q => {
        let h = 0
        for (const c of q.id) h = ((h << 5) - h + c.charCodeAt(0)) | 0
        h = Math.abs(h)
        return {
            id: q.id,
            title: q.title,
            yesPct: 30 + (h % 40),
            volume: 500 + (h % 5000),
            status: 'Open' as const,
        }
    })

    const filteredMarkets = filterCat === 'All'
        ? analyticsMarkets
        : analyticsMarkets.filter(m => {
            const q = QUESTIONS.find(qq => qq.id === m.id)
            return q?.category === filterCat
        })

    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            <div className="grid-bg" />
            <div className="wrap">

                {/* ── Top nav: ProBex, Toggler, TestNet, Lora, Wallet ── */}
                <nav className="nav">
                    <div className="brand">
                        <div className="brand-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2L17 6.5V13.5L10 18L3 13.5V6.5L10 2Z" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
                                <path d="M10 6.5L13.5 9V12.5L10 15L6.5 12.5V9L10 6.5Z" fill="#000" fillOpacity="0.35" />
                            </svg>
                        </div>
                        <div className="brand-name">Pro<span>Bex</span></div>
                    </div>
                    <div className="nav-right">
                        {/* Theme toggle */}
                        <button
                            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            style={{
                                width: 64, height: 32, borderRadius: 20, border: '1px solid var(--border2)',
                                background: theme === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px',
                                position: 'relative', transition: 'background .2s',
                            }}
                        >
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: theme === 'dark' ? '#3a4666' : 'var(--g)',
                                transform: theme === 'dark' ? 'translateX(0)' : 'translateX(30px)',
                                transition: 'transform .2s, background .2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13,
                            }}>
                                {theme === 'dark' ? '🌙' : '☀️'}
                            </div>
                        </button>
                        <div className="pill-net"><span className="live-dot" /> TestNet</div>
                        <a
                            className="lora-link"
                            href={`${LORA_BASE}/application/${APP_ID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View app on Lora Explorer"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            Lora
                        </a>
                        {activeAddress ? (
                            <>
                                <span className="addr-pill">{activeAddress.slice(0, 6)}…{activeAddress.slice(-4)}</span>
                                <button className="disconnect-btn" onClick={handleDisconnect} title="Disconnect wallet">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                </button>
                            </>
                        ) : (
                            <button className="wallet-btn off" onClick={() => setWalletModalOpen(true)}>
                                Connect Wallet
                            </button>
                        )}
                    </div>
                </nav>

                {/* ── User info row: Name + Sign Out ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0 0 16px', flexWrap: 'wrap', gap: 10,
                    borderBottom: '1px solid var(--border2)', marginBottom: 16,
                }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {user && (
                            <span style={{
                                fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--txt2)',
                                padding: '5px 12px', background: 'var(--c1)',
                                border: '1px solid var(--border2)', borderRadius: 8,
                            }}>
                                Welcome, <span style={{ color: 'var(--g)', fontWeight: 700 }}>{user.email?.split('@')[0] || 'User'}</span>
                            </span>
                        )}
                    </div>
                    <motion.button
                        onClick={handleSignOut}
                        style={{
                            fontFamily: 'var(--fm)', fontSize: 11, padding: '6px 14px', borderRadius: 8,
                            border: '1px solid rgba(255,79,139,.25)', background: 'rgba(255,79,139,.07)',
                            color: 'var(--pink)', cursor: 'pointer',
                        }}
                        whileHover={{ borderColor: 'var(--pink)', scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        Sign Out
                    </motion.button>
                </div>

                {/* ── Tab switcher ── */}
                <div className="tab-switcher" style={{ display: 'flex', background: 'var(--c1)', border: '1px solid var(--border2)', borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
                    {[
                        { id: 'contract', label: '🔗 Live Contract' },
                        { id: 'markets', label: '📊 All Markets + Analytics' },
                    ].map((tab) => (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                flex: 1, padding: '10px 0', borderRadius: 9, border: 'none',
                                fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                background: activeTab === tab.id ? 'var(--g)' : 'transparent',
                                color: activeTab === tab.id ? '#000' : 'var(--txt2)',
                                letterSpacing: '.3px',
                            }}
                            whileTap={{ scale: 0.99 }}
                            transition={{ duration: 0.15 }}
                        >
                            {tab.label}
                        </motion.button>
                    ))}
                </div>

                {/* ── Tab content ── */}
                {activeTab === 'contract' ? (
                    <Home showNav={false} />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Category filter pills */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                            {CATEGORIES.map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setFilterCat(c); setSelectedAnalyticsMarket(null) }}
                                    style={{
                                        fontFamily: 'var(--fm)', fontSize: 10, padding: '5px 12px', borderRadius: 20,
                                        border: `1px solid ${filterCat === c ? 'var(--g)' : 'var(--border2)'}`,
                                        background: filterCat === c ? 'rgba(0,229,176,.12)' : 'var(--c1)',
                                        color: filterCat === c ? 'var(--g)' : 'var(--txt3)',
                                        cursor: 'pointer', letterSpacing: '.3px',
                                    }}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', letterSpacing: 1, marginBottom: 12 }}>
                            {filterCat === 'All' ? 'ALL' : filterCat.toUpperCase()} MARKETS — {filteredMarkets.length} ACTIVE
                        </div>

                        <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: selectedAnalyticsMarket ? '340px 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
                            <MarketList
                                markets={filteredMarkets}
                                onSelect={(m) => setSelectedAnalyticsMarket(selectedAnalyticsMarket?.id === m.id ? null : m)}
                                selectedId={selectedAnalyticsMarket?.id}
                            />

                            {selectedAnalyticsMarket && (
                                <div>
                                    <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', letterSpacing: 1, marginBottom: 12 }}>
                                        MARKET ANALYTICS
                                    </div>
                                    <MarketAnalytics market={selectedAnalyticsMarket} />
                                </div>
                            )}
                        </div>

                        {!selectedAnalyticsMarket && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--txt3)' }}
                            >
                                ↑ Select a market above to view detailed analytics
                            </motion.div>
                        )}
                    </motion.div>
                )}

                <div className="footer">
                    Built on <span>Algorand</span> · ProBex POC · Hackathon Demo · All transactions on TestNet
                </div>
            </div>

            <ConnectWallet openModal={walletModalOpen} closeModal={() => setWalletModalOpen(false)} />
        </div>
    )
}
