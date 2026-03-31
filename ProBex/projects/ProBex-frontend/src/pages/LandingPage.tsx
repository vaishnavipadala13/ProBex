import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ConnectWallet from '../components/ConnectWallet'
import { useWallet } from '@txnlab/use-wallet-react'

// Animated particle dot
function Particle({ x, y, delay }: { x: number; y: number; delay: number }) {
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'var(--g)',
                pointerEvents: 'none',
            }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.4, 0.5] }}
            transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: 'easeInOut' }}
        />
    )
}

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: i * 0.22,
}))

export default function LandingPage() {
    const navigate = useNavigate()
    const { activeAddress } = useWallet()
    const [walletModalOpen, setWalletModalOpen] = useState(false)

    const handleConnect = () => setWalletModalOpen(true)
    const handleContinue = () => navigate('/login')

    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Animated grid background */}
            <div className="grid-bg" />

            {/* Ambient glow */}
            <motion.div
                style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                    background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,229,176,0.07) 0%, transparent 70%)',
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Floating particles */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                {PARTICLES.map((p) => <Particle key={p.id} x={p.x} y={p.y} delay={p.delay} />)}
            </div>

            {/* Main content */}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px', maxWidth: 700, width: '100%' }}>

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}
                >
                    <motion.div
                        style={{
                            width: 72, height: 72, background: 'var(--g)', borderRadius: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 32px rgba(0,229,176,0.4)',
                        }}
                        animate={{ boxShadow: ['0 0 24px rgba(0,229,176,0.3)', '0 0 48px rgba(0,229,176,0.55)', '0 0 24px rgba(0,229,176,0.3)'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <svg width="38" height="38" viewBox="0 0 20 20" fill="none">
                            <path d="M10 2L17 6.5V13.5L10 18L3 13.5V6.5L10 2Z" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
                            <path d="M10 6.5L13.5 9V12.5L10 15L6.5 12.5V9L10 6.5Z" fill="#000" fillOpacity="0.4" />
                        </svg>
                    </motion.div>
                </motion.div>

                {/* Brand name */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    style={{ fontFamily: 'var(--ff)', fontSize: 'clamp(42px,8vw,72px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, marginBottom: 16 }}
                >
                    Pro<span style={{ color: 'var(--g)' }}>Bex</span>
                </motion.div>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.6 }}
                    style={{ fontFamily: 'var(--fm)', fontSize: 'clamp(13px,2.5vw,18px)', color: 'var(--txt2)', letterSpacing: '.5px', marginBottom: 10 }}
                >
                    Trade the Future. <span style={{ color: 'var(--g)' }}>Price Reality.</span>
                </motion.p>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    style={{ fontSize: 14, color: 'var(--txt3)', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.7 }}
                >
                    Trustless parimutuel prediction markets on Algorand. Bet on real-world outcomes. Get paid in ALGO.
                </motion.p>

                {/* CTA Buttons — wallet-first flow */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'center' }}
                >
                    {!activeAddress ? (
                        <>
                            <motion.button
                                className="landing-cta-btn"
                                onClick={handleConnect}
                                style={{
                                    fontFamily: 'var(--ff)', fontWeight: 700, fontSize: 15,
                                    padding: '14px 38px', borderRadius: 10, border: 'none',
                                    background: 'var(--g)', color: '#000', cursor: 'pointer',
                                }}
                                whileHover={{ scale: 1.06, boxShadow: '0 0 24px rgba(0,229,176,0.45)' }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Connect Pera Wallet
                            </motion.button>
                            <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>
                                Connect your wallet to get started
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="wallet-status-text" style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--g)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g)', display: 'inline-block', flexShrink: 0 }} />
                                Wallet Connected: {activeAddress.slice(0, 6)}…{activeAddress.slice(-4)}
                            </div>
                            <motion.button
                                className="landing-cta-btn"
                                onClick={handleContinue}
                                style={{
                                    fontFamily: 'var(--ff)', fontWeight: 700, fontSize: 15,
                                    padding: '14px 38px', borderRadius: 10, border: 'none',
                                    background: 'var(--g)', color: '#000', cursor: 'pointer',
                                }}
                                whileHover={{ scale: 1.06, boxShadow: '0 0 24px rgba(0,229,176,0.45)' }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Sign In / Sign Up
                            </motion.button>
                        </>
                    )}
                </motion.div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}
                >
                    {[
                        { label: 'SETTLEMENT', value: '100% On-Chain' },
                        { label: 'NETWORK', value: 'Algorand' },
                        { label: 'MODEL', value: 'Parimutuel' },
                    ].map((s) => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 13, color: 'var(--g)', fontWeight: 700 }}>{s.value}</div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Scroll hint */}
            <motion.div
                style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', letterSpacing: 1 }}
                animate={{ opacity: [0.4, 1, 0.4], y: [0, 6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
            >
                ↓ EXPLORE
            </motion.div>

            <ConnectWallet openModal={walletModalOpen} closeModal={() => setWalletModalOpen(false)} />
        </div>
    )
}
