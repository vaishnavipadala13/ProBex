import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../utils/supabase'
import NavButtons from '../components/NavButtons'
import { useWallet } from '@txnlab/use-wallet-react'
import { useAuth } from '../hooks/useAuth'

type Mode = 'login' | 'signup'

export default function AuthPage() {
    const navigate = useNavigate()
    const { activeAddress } = useWallet()
    const { user, loading: authLoading } = useAuth()

    const [mode, setMode] = useState<Mode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [info, setInfo] = useState<string | null>(null)

    // Redirect to landing if wallet not connected
    useEffect(() => {
        if (!authLoading && !activeAddress) {
            navigate('/')
        }
    }, [activeAddress, authLoading, navigate])

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            navigate('/dashboard')
        }
    }, [user, authLoading, navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setInfo(null)
        setLoading(true)

        try {
            if (mode === 'signup') {
                const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })

                // Supabase returns a user with an empty identities array if the email already exists
                if (signUpErr) throw signUpErr
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    setError('An account with this email already exists. Please log in instead.')
                    setMode('login')
                    setLoading(false)
                    return
                }

                const userId = data.user?.id
                if (userId) {
                    await supabase.from('users').upsert({
                        id: userId,
                        email,
                        wallet_address: activeAddress ?? null,
                        created_at: new Date().toISOString(),
                    })
                }

                setInfo('Account created! You can now log in.')
                setMode('login')
                setPassword('')
            } else {
                const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
                if (signInErr) throw signInErr
                navigate('/dashboard')
            }
        } catch (err: any) {
            setError(err?.message ?? 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: 'var(--c2)',
        border: '1px solid var(--border2)',
        borderRadius: 8,
        padding: '12px 14px',
        fontFamily: 'var(--fm)',
        fontSize: 13,
        color: 'var(--txt)',
        outline: 'none',
    }

    // Don't render while checking auth state or if wallet not connected
    if (authLoading || !activeAddress) return null

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="grid-bg" />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, width: '100%', margin: '0 auto', padding: '32px 16px 80px' }}>
                <NavButtons backTo="/" backLabel="Landing" />

                <motion.div
                    className="auth-card"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                        marginTop: 40,
                        background: 'var(--c1)',
                        border: '1px solid var(--border)',
                        borderRadius: 18,
                        padding: '32px 28px',
                    }}
                >
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div className="brand-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2L17 6.5V13.5L10 18L3 13.5V6.5L10 2Z" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
                                <path d="M10 6.5L13.5 9V12.5L10 15L6.5 12.5V9L10 6.5Z" fill="#000" fillOpacity="0.35" />
                            </svg>
                        </div>
                        <span className="brand-name">Pro<span style={{ color: 'var(--g)' }}>Bex</span></span>
                    </div>

                    {/* Connected wallet indicator */}
                    <div style={{
                        fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--g)',
                        background: 'rgba(0,229,176,.08)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '8px 12px', marginBottom: 24,
                        display: 'flex', alignItems: 'center', gap: 6,
                        overflow: 'hidden', wordBreak: 'break-all',
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g)', display: 'inline-block', flexShrink: 0 }} />
                        Wallet: {activeAddress.slice(0, 6)}…{activeAddress.slice(-4)}
                    </div>

                    {/* Mode toggle */}
                    <div style={{ display: 'flex', background: 'var(--c2)', borderRadius: 10, padding: 4, marginBottom: 28, border: '1px solid var(--border2)' }}>
                        {(['login', 'signup'] as Mode[]).map((m) => (
                            <motion.button
                                key={m}
                                onClick={() => { setMode(m); setError(null); setInfo(null) }}
                                style={{
                                    flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                                    fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                    background: mode === m ? 'var(--g)' : 'transparent',
                                    color: mode === m ? '#000' : 'var(--txt2)',
                                    letterSpacing: '.3px',
                                }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                            >
                                {m === 'login' ? 'LOG IN' : 'SIGN UP'}
                            </motion.button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', letterSpacing: '.5px', marginBottom: 6 }}>EMAIL</div>
                            <input
                                style={inputStyle}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', letterSpacing: '.5px', marginBottom: 6 }}>PASSWORD</div>
                            <input
                                style={inputStyle}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                        </div>

                        {/* Wallet address shown during signup */}
                        {mode === 'signup' && (
                            <div>
                                <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', letterSpacing: '.5px', marginBottom: 6 }}>WALLET (AUTO-LINKED)</div>
                                <input
                                    style={{ ...inputStyle, color: 'var(--g)', borderColor: 'var(--border)' }}
                                    type="text"
                                    value={activeAddress}
                                    readOnly
                                />
                            </div>
                        )}

                        {/* Feedback */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    key="err"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--pink)', background: 'rgba(255,79,139,.08)', border: '1px solid rgba(255,79,139,.2)', borderRadius: 8, padding: '9px 12px' }}
                                >
                                    {error}
                                </motion.div>
                            )}
                            {info && (
                                <motion.div
                                    key="info"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--g)', background: 'rgba(0,229,176,.08)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}
                                >
                                    {info}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            style={{
                                fontFamily: 'var(--ff)', fontWeight: 700, fontSize: 14,
                                padding: '13px 0', borderRadius: 9, border: 'none',
                                background: loading ? 'rgba(0,229,176,.4)' : 'var(--g)',
                                color: '#000', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
                            }}
                            whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 20px rgba(0,229,176,.35)' } : undefined}
                            whileTap={!loading ? { scale: 0.98 } : undefined}
                        >
                            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
