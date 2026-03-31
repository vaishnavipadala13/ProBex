import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PredictionMarket {
    id: string
    title: string
    yesPct: number       // 0-100
    volume: number       // ALGO
    status: 'Open' | 'Closed' | 'Resolved'
    winner?: 'YES' | 'NO'
}

interface PricePoint { time: string; yes: number; no: number }
interface VolumePoint { time: string; vol: number }
interface OrderEntry { price: number; qty: number }

// ─── Mock data generators ────────────────────────────────────────────────────

function genPriceHistory(market: PredictionMarket): PricePoint[] {
    const series: PricePoint[] = []
    let y = market.yesPct
    for (let i = 11; i >= 0; i--) {
        const diff = (Math.random() - 0.5) * 6
        y = Math.max(5, Math.min(95, y + diff))
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        series.push({ time: d.toLocaleString('default', { month: 'short' }), yes: parseFloat(y.toFixed(1)), no: parseFloat((100 - y).toFixed(1)) })
    }
    series[series.length - 1] = { ...series[series.length - 1], yes: market.yesPct, no: 100 - market.yesPct }
    return series
}

function genVolumeHistory(): VolumePoint[] {
    return Array.from({ length: 8 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (7 - i))
        return { time: d.toLocaleDateString('default', { weekday: 'short' }), vol: Math.round(20 + Math.random() * 120) }
    })
}

function genOrderbook(): { bids: OrderEntry[]; asks: OrderEntry[] } {
    const bids = Array.from({ length: 6 }, (_, i) => ({ price: parseFloat((0.62 - i * 0.02).toFixed(2)), qty: Math.round(30 + Math.random() * 200) }))
    const asks = Array.from({ length: 6 }, (_, i) => ({ price: parseFloat((0.64 + i * 0.02).toFixed(2)), qty: Math.round(30 + Math.random() * 200) }))
    return { bids, asks }
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--c1)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--fm)', fontSize: 11 }}>
            <div style={{ color: 'var(--txt3)', marginBottom: 4 }}>{label}</div>
            {payload.map((p: any) => (
                <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}{typeof p.value === 'number' && p.name !== 'vol' ? '%' : ''}</div>
            ))}
        </div>
    )
}

// ─── Section header helper ───────────────────────────────────────────────────

function SectionHead({ title }: { title: string }) {
    return <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', letterSpacing: 1, marginBottom: 12 }}>{title}</div>
}

// ─── Card wrapper ────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{ background: 'var(--c1)', border: '1px solid var(--border2)', borderRadius: 14, padding: 18, ...style }}>
            {children}
        </div>
    )
}

// ─── Market List ─────────────────────────────────────────────────────────────

export function MarketList({ markets, onSelect, selectedId }: { markets: PredictionMarket[]; onSelect: (m: PredictionMarket) => void; selectedId?: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {markets.map((m) => {
                const selected = m.id === selectedId
                return (
                    <motion.div
                        key={m.id}
                        onClick={() => onSelect(m)}
                        style={{
                            background: selected ? 'rgba(0,229,176,.06)' : 'var(--c1)',
                            border: `1px solid ${selected ? 'var(--border)' : 'var(--border2)'}`,
                            borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                        }}
                        whileHover={{ scale: 1.01, borderColor: 'var(--border)' }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, flex: 1 }}>{m.title}</div>
                            <span style={{
                                fontFamily: 'var(--fm)', fontSize: 10, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap',
                                background: m.status === 'Open' ? 'rgba(0,229,176,.1)' : m.status === 'Resolved' ? 'rgba(255,165,0,.1)' : 'rgba(255,255,255,.05)',
                                border: `1px solid ${m.status === 'Open' ? 'rgba(0,229,176,.25)' : m.status === 'Resolved' ? 'rgba(255,165,0,.25)' : 'var(--border2)'}`,
                                color: m.status === 'Open' ? 'var(--g)' : m.status === 'Resolved' ? '#ffaa00' : 'var(--txt3)',
                            }}>{m.status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 20, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${m.yesPct}%`, background: 'var(--g)', borderRadius: 20, transition: 'width .5s ease' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontFamily: 'var(--fm)', fontSize: 10 }}>
                                    <span style={{ color: 'var(--g)' }}>YES {m.yesPct}%</span>
                                    <span style={{ color: 'var(--pink)' }}>NO {100 - m.yesPct}%</span>
                                </div>
                            </div>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', textAlign: 'right' }}>
                                <div style={{ color: 'var(--txt2)', fontWeight: 700 }}>{m.volume.toLocaleString()} ALGO</div>
                                <div>Vol</div>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

// ─── Market Detail Analytics ──────────────────────────────────────────────────

export function MarketAnalytics({ market }: { market: PredictionMarket }) {
    const priceData = genPriceHistory(market)
    const volData = genVolumeHistory()
    const { bids, asks } = genOrderbook()
    const sentimentBuy = 55 + Math.round(Math.random() * 20)

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
                {/* Title */}
                <Card style={{ borderColor: 'var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--g)', letterSpacing: 1, marginBottom: 6 }}>SELECTED MARKET</div>
                            <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>{market.title}</div>
                        </div>
                        <span style={{
                            fontFamily: 'var(--fm)', fontSize: 10, padding: '4px 11px', borderRadius: 20,
                            background: market.status === 'Open' ? 'rgba(0,229,176,.1)' : 'rgba(255,165,0,.1)',
                            border: `1px solid ${market.status === 'Open' ? 'rgba(0,229,176,.25)' : 'rgba(255,165,0,.25)'}`,
                            color: market.status === 'Open' ? 'var(--g)' : '#ffaa00',
                        }}>{market.status}</span>
                    </div>
                </Card>

                {/* Probability Split */}
                <Card>
                    <SectionHead title="PROBABILITY SPLIT" />
                    <div className="analytics-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                        <div style={{ background: 'var(--c2)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(0,229,176,.2)' }}>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--g)', marginBottom: 4 }}>YES</div>
                            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--g)' }}>{market.yesPct}%</div>
                        </div>
                        <div style={{ background: 'var(--c2)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,79,139,.2)' }}>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--pink)', marginBottom: 4 }}>NO</div>
                            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--pink)' }}>{100 - market.yesPct}%</div>
                        </div>
                    </div>
                    <div style={{ height: 10, background: 'rgba(255,255,255,.05)', borderRadius: 20, overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${market.yesPct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{ height: '100%', background: 'linear-gradient(90deg, var(--g), #00b890)', borderRadius: 20 }}
                        />
                    </div>
                </Card>

                {/* Price Chart */}
                <Card>
                    <SectionHead title="PROBABILITY OVER TIME" />
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={priceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                            <XAxis dataKey="time" tick={{ fontFamily: 'var(--fm)', fontSize: 10, fill: 'var(--txt3)' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontFamily: 'var(--fm)', fontSize: 10, fill: 'var(--txt3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={36} />
                            <Tooltip content={<ChartTip />} />
                            <Line type="monotone" dataKey="yes" stroke="var(--g)" strokeWidth={2} dot={false} name="yes" />
                            <Line type="monotone" dataKey="no" stroke="var(--pink)" strokeWidth={2} dot={false} name="no" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                {/* Volume Chart */}
                <Card>
                    <SectionHead title="TRADING VOLUME (LAST 7 DAYS)" />
                    <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={volData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                            <XAxis dataKey="time" tick={{ fontFamily: 'var(--fm)', fontSize: 10, fill: 'var(--txt3)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontFamily: 'var(--fm)', fontSize: 10, fill: 'var(--txt3)' }} axisLine={false} tickLine={false} width={32} />
                            <Tooltip content={<ChartTip />} />
                            <Bar dataKey="vol" fill="var(--g)" opacity={0.75} radius={[4, 4, 0, 0]} name="vol" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Sentiment + Liquidity */}
                <div className="analytics-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Card>
                        <SectionHead title="SENTIMENT" />
                        <div style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--txt3)', marginBottom: 8 }}>Buy / Sell ratio</div>
                        <div style={{ height: 8, background: 'rgba(255,255,255,.05)', borderRadius: 20, overflow: 'hidden', marginBottom: 8 }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${sentimentBuy}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                                style={{ height: '100%', background: 'var(--g)', borderRadius: 20 }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--fm)', fontSize: 11 }}>
                            <span style={{ color: 'var(--g)' }}>BUY {sentimentBuy}%</span>
                            <span style={{ color: 'var(--pink)' }}>SELL {100 - sentimentBuy}%</span>
                        </div>
                    </Card>

                    <Card>
                        <SectionHead title="LIQUIDITY" />
                        <div style={{ fontFamily: 'var(--fm)', fontSize: 22, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
                            {market.volume.toLocaleString()}
                        </div>
                        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)' }}>ALGO in pool</div>
                        <div style={{ marginTop: 10, fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--g)' }}>
                            Depth: {(market.volume * 0.6).toFixed(0)} YES / {(market.volume * 0.4).toFixed(0)} NO
                        </div>
                    </Card>
                </div>

                {/* Orderbook */}
                <Card>
                    <SectionHead title="ORDER BOOK" />
                    <div className="analytics-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 9, color: 'var(--g)', letterSpacing: 1, marginBottom: 8 }}>BIDS (YES)</div>
                            {bids.map((b, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--fm)', fontSize: 11, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                                    <span style={{ color: 'var(--g)' }}>{b.price.toFixed(2)}</span>
                                    <span style={{ color: 'var(--txt2)' }}>{b.qty}</span>
                                </div>
                            ))}
                        </div>
                        <div>
                            <div style={{ fontFamily: 'var(--fm)', fontSize: 9, color: 'var(--pink)', letterSpacing: 1, marginBottom: 8 }}>ASKS (NO)</div>
                            {asks.map((a, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--fm)', fontSize: 11, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                                    <span style={{ color: 'var(--pink)' }}>{a.price.toFixed(2)}</span>
                                    <span style={{ color: 'var(--txt2)' }}>{a.qty}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}
