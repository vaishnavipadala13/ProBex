import { useWallet } from '@txnlab/use-wallet-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import algosdk from 'algosdk'
import ConnectWallet from './components/ConnectWallet'
import {
  APP_ID,
  fetchMarketState,
  fetchUserBet,
  getAlgodClient,
  MarketState,
  UserBet,
  algosToMicroAlgos,
  getAppAddress,
} from './utils/probexClient'

interface LogEntry {
  addr: string
  outcome: 'yes' | 'no'
  amount: number
  time: string
  txId?: string
}

// Lora block explorer base URL (testnet)
const LORA_BASE = 'https://lora.algokit.io/testnet'

// Platform admin address — receives 1% fee on every bet
const ADMIN_ADDRESS = '5PZHJCQSYVEDAYTEFBQGXXUQJA6K3VDY6DBBAOLWFGQHA3R5FTYBLJ3NZE'

// ─── Real-world prediction questions catalog ─────────────────────────────────
export interface Question {
  id: string
  title: string
  category: 'Crypto' | 'Politics' | 'War & Conflict' | 'Business' | 'Sports' | 'Tech'
  resolves: string
  yesLabel: string
  noLabel: string
  live: boolean   // true = connected to deployed contract
}

export const QUESTIONS: Question[] = [
  // ── Crypto
  { id: 'algo-1', live: true, category: 'Crypto', title: 'Will ALGO price hit $1.00 by Dec 31, 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Hits $1', noLabel: "NO — Won't" },
  { id: 'cry-2', live: true, category: 'Crypto', title: 'Will Bitcoin exceed $300K in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Over $300K', noLabel: 'NO — Below' },
  { id: 'cry-3', live: true, category: 'Crypto', title: 'Will Algorand TVL exceed $500M by Q4 2026?', resolves: 'Oct 1 2026', yesLabel: 'YES — $500M+', noLabel: 'NO — Below' },
  { id: 'cry-4', live: true, category: 'Crypto', title: 'Will Ethereum price surpass $10K in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Over $10K', noLabel: 'NO — Below' },
  { id: 'cry-5', live: true, category: 'Crypto', title: 'Will a spot Solana ETF be approved in the US in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Approved', noLabel: 'NO — Rejected' },
  { id: 'cry-6', live: false, category: 'Crypto', title: 'Will Algorand be listed on Coinbase Earn in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Listed', noLabel: 'NO — Not listed' },
  // ── Politics
  { id: 'pol-1', live: true, category: 'Politics', title: 'Will the US Federal Reserve cut rates below 3% by end of 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Cut', noLabel: 'NO — Hold/Raise' },
  { id: 'pol-2', live: true, category: 'Politics', title: 'Will there be a NATO Article 5 invocation before 2027?', resolves: 'Jan 1 2027', yesLabel: 'YES — Invoked', noLabel: 'NO — Not invoked' },
  { id: 'pol-3', live: true, category: 'Politics', title: 'Will any G7 nation nationalise a major AI company in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Nationalise', noLabel: 'NO — Stay private' },
  { id: 'pol-4', live: true, category: 'Politics', title: 'Will the UN Security Council pass a binding climate resolution in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Passed', noLabel: 'NO — Blocked' },
  { id: 'pol-5', live: true, category: 'Politics', title: 'Will any country officially ban cash transactions above $500 in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Bans', noLabel: 'NO — No ban' },
  { id: 'pol-6', live: false, category: 'Politics', title: 'Will the EU impose new AI regulation fines exceeding €1B in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Fined', noLabel: 'NO — No fine' },
  // ── War & Conflict
  { id: 'war-1', live: true, category: 'War & Conflict', title: 'Will a formal ceasefire be signed in the Russia-Ukraine war by mid-2026?', resolves: 'Jul 1 2026', yesLabel: 'YES — Ceasefire', noLabel: 'NO — Continues' },
  { id: 'war-2', live: true, category: 'War & Conflict', title: 'Will there be a direct US-China military incident in the Taiwan Strait in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Incident', noLabel: 'NO — Peaceful' },
  { id: 'war-3', live: true, category: 'War & Conflict', title: 'Will any nuclear weapon be detonated in a conflict zone before 2028?', resolves: 'Jan 1 2028', yesLabel: 'YES — Detonated', noLabel: 'NO — Not used' },
  { id: 'war-4', live: true, category: 'War & Conflict', title: 'Will the conflict in Gaza formally end with a two-state agreement by 2027?', resolves: 'Jan 1 2027', yesLabel: 'YES — Agreement', noLabel: 'NO — Unresolved' },
  { id: 'war-5', live: true, category: 'War & Conflict', title: 'Will there be a military coup in any G20 nation in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Coup', noLabel: 'NO — Stable' },
  { id: 'war-6', live: false, category: 'War & Conflict', title: 'Will North Korea conduct an ICBM test in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Launch', noLabel: 'NO — No launch' },
  // ── Business
  { id: 'biz-1', live: true, category: 'Business', title: 'Will Apple reach a $4T market cap before Jan 2027?', resolves: 'Jan 1 2027', yesLabel: 'YES — $4T', noLabel: 'NO — Below' },
  { id: 'biz-2', live: true, category: 'Business', title: 'Will OpenAI complete an IPO in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — IPO', noLabel: 'NO — Stays private' },
  { id: 'biz-3', live: true, category: 'Business', title: 'Will any airline go bankrupt due to fuel costs in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Bankrupt', noLabel: 'NO — Survive' },
  { id: 'biz-4', live: true, category: 'Business', title: 'Will NVIDIA remain the #1 most valuable public company by end of 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — #1', noLabel: 'NO — Overtaken' },
  { id: 'biz-5', live: true, category: 'Business', title: 'Will any streaming platform surpass 400M paid subscribers in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — 400M+', noLabel: 'NO — Below' },
  { id: 'biz-6', live: false, category: 'Business', title: 'Will Tesla release a fully autonomous robotaxi service in the US in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Launch', noLabel: 'NO — Delayed' },
  // ── Tech
  { id: 'tech-1', live: true, category: 'Tech', title: 'Will a commercial quantum computer break RSA-2048 by 2027?', resolves: 'Jan 1 2027', yesLabel: 'YES — Broken', noLabel: 'NO — Not yet' },
  { id: 'tech-2', live: true, category: 'Tech', title: 'Will SpaceX successfully land humans on Mars before 2030?', resolves: 'Jan 1 2030', yesLabel: 'YES — Lands', noLabel: 'NO — Delayed' },
  { id: 'tech-3', live: true, category: 'Tech', title: 'Will GPT-5 or equivalent score 90%+ on the USMLE medical licensing exam?', resolves: 'Dec 31 2026', yesLabel: 'YES — 90%+', noLabel: 'NO — Below' },
  { id: 'tech-4', live: true, category: 'Tech', title: 'Will any AI model pass the Turing Test as judged by a major institution?', resolves: 'Dec 31 2026', yesLabel: 'YES — Passes', noLabel: 'NO — Fails' },
  { id: 'tech-5', live: true, category: 'Tech', title: 'Will Apple release an AR/VR headset under $1,000 in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Released', noLabel: 'NO — Not yet' },
  { id: 'tech-6', live: false, category: 'Tech', title: 'Will self-driving cars be legal for unmonitored use in 10+ US states by 2027?', resolves: 'Jan 1 2027', yesLabel: 'YES — Legal', noLabel: 'NO — Restricted' },
  // ── Sports
  { id: 'spt-1', live: true, category: 'Sports', title: 'Will an African team reach the FIFA World Cup 2026 final?', resolves: 'Jul 19 2026', yesLabel: 'YES — Final', noLabel: 'NO — Eliminated' },
  { id: 'spt-2', live: true, category: 'Sports', title: 'Will the host nation (USA/Canada/Mexico) win FIFA World Cup 2026?', resolves: 'Jul 19 2026', yesLabel: 'YES — Wins', noLabel: 'NO — Eliminated' },
  { id: 'spt-3', live: true, category: 'Sports', title: 'Will Novak Djokovic win any Grand Slam in 2026?', resolves: 'Dec 31 2026', yesLabel: 'YES — Wins', noLabel: 'NO — No slam' },
  { id: 'spt-4', live: true, category: 'Sports', title: 'Will a new 100m world record be set at the 2026 World Athletics Champs?', resolves: 'Sep 30 2026', yesLabel: 'YES — Record', noLabel: 'NO — No record' },
  { id: 'spt-5', live: true, category: 'Sports', title: 'Will an NBA team from outside the US win the league championship by 2028?', resolves: 'Jan 1 2028', yesLabel: 'YES — Foreign win', noLabel: 'NO — US wins' },
  { id: 'spt-6', live: false, category: 'Sports', title: 'Will the 2026 Winter Olympics break the previous all-time medal record?', resolves: 'Feb 28 2026', yesLabel: 'YES — Record', noLabel: 'NO — No record' },
]

export const CATEGORIES = ['All', 'Crypto', 'Politics', 'War & Conflict', 'Business', 'Tech', 'Sports'] as const
type Cat = typeof CATEGORIES[number]

const EMPTY_MARKET: MarketState = {
  totalYesPool: 0n,
  totalNoPool: 0n,
  marketResolved: false,
  winningOutcome: 0,
  creatorAddress: '',
}

// Generate stable mock pool data for each question (deterministic from ID)
function getMockPool(qId: string): { yesPool: bigint; noPool: bigint } {
  let h = 0
  for (const c of qId) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  h = Math.abs(h)
  return {
    yesPool: BigInt((h % 9 + 1) * 1_000_000),
    noPool: BigInt(((h >> 8) % 8 + 1) * 1_000_000),
  }
}

function fmtAlgo(microAlgos: bigint): string {
  const n = Number(microAlgos) / 1_000_000
  return n < 1000 ? n.toFixed(2) + ' ALGO' : Math.round(n).toLocaleString() + ' ALGO'
}

// Animated number hook — smoothly counts between values
function useAnimatedNumber(target: number, duration = 500): number {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  const raf = useRef(0)

  useEffect(() => {
    const from = prev.current
    prev.current = target
    if (from === target) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setDisplay(from + (target - from) * ease)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return display
}

function AnimatedAlgo({ microAlgos }: { microAlgos: bigint }) {
  const n = useAnimatedNumber(Number(microAlgos) / 1_000_000)
  return <>{n < 1000 ? n.toFixed(2) + ' ALGO' : Math.round(n).toLocaleString() + ' ALGO'}</>
}

function fmtPct(yes: bigint, no: bigint): { yesPct: number; noPct: number } {
  const total = Number(yes) + Number(no)
  if (total === 0) return { yesPct: 50, noPct: 50 }
  const y = parseFloat(((Number(yes) / total) * 100).toFixed(1))
  return { yesPct: y, noPct: parseFloat((100 - y).toFixed(1)) }
}

function payout(pool: bigint, total: bigint): string {
  if (pool === 0n) return '—'
  return (Number(total) / Number(pool)).toFixed(2) + 'x'
}

export default function Home({ showNav = true }: { showNav?: boolean } = {}) {
  const { activeAddress, transactionSigner, wallets } = useWallet()

  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [market, setMarket] = useState<MarketState>(EMPTY_MARKET)
  const [userBet, setUserBet] = useState<UserBet | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [betLoading, setBetLoading] = useState(false)
  const [resolveLoading, setResolveLoading] = useState(false)
  const [claimLoading, setClaimLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [lastTxId, setLastTxId] = useState<string | null>(null)
  const [selectedQ, setSelectedQ] = useState<Question>(QUESTIONS[0])
  const [filterCat, setFilterCat] = useState<Cat>('All')
  const [simBets, setSimBets] = useState<Record<string, { outcome: 'yes' | 'no'; amount: number; txId?: string }>>({})
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const toastId = useRef(0)
  const marketCardRef = useRef<HTMLDivElement>(null)

  // Apply theme to document root (only when rendering own nav)
  useEffect(() => {
    if (showNav) document.documentElement.setAttribute('data-theme', theme)
  }, [theme, showNav])

  const appId = APP_ID

  // ─── Toast ──────────────────────────────────────
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  // ─── Fetch state ────────────────────────────────
  const refreshState = useCallback(async () => {
    if (!appId) return
    try {
      const st = await fetchMarketState(appId)
      setMarket(st)
    } catch (e: any) {
      console.error('Failed to fetch market state', e)
    }
  }, [appId])

  const refreshUserBet = useCallback(async () => {
    if (!appId || !activeAddress) { setUserBet(null); return }
    try {
      const ub = await fetchUserBet(appId, activeAddress)
      setUserBet(ub)
    } catch { setUserBet(null) }
  }, [appId, activeAddress])

  useEffect(() => {
    refreshState()
    const timer = setInterval(refreshState, 10_000)
    return () => clearInterval(timer)
  }, [refreshState])

  useEffect(() => { refreshUserBet() }, [refreshUserBet])

  // ─── Derived ────────────────────────────────────
  const isRealMarket = selectedQ.id === 'algo-1' && selectedQ.live
  const mockPool = !isRealMarket && selectedQ.live ? getMockPool(selectedQ.id) : null
  const displayYesPool = isRealMarket ? market.totalYesPool : (mockPool?.yesPool ?? 0n)
  const displayNoPool = isRealMarket ? market.totalNoPool : (mockPool?.noPool ?? 0n)
  const totalPool = displayYesPool + displayNoPool
  const { yesPct, noPct } = fmtPct(displayYesPool, displayNoPool)
  const isAdmin = activeAddress !== null && activeAddress === market.creatorAddress && isRealMarket
  const amt = parseFloat(betAmount) || 0
  const simBet = simBets[selectedQ.id] ?? null
  const displayUserBet: UserBet | null = isRealMarket
    ? userBet
    : (simBet ? { amount: BigInt(Math.round(simBet.amount * 1e6)), outcome: simBet.outcome === 'yes' ? 1 : 2, claimed: false } : null)
  const displayResolved = isRealMarket ? market.marketResolved : false

  // Payout estimates
  const estYes = amt > 0 && Number(displayYesPool) + Number(displayNoPool) > 0
    ? ((amt * 1e6 + Number(totalPool)) * (amt * 1e6) / (Number(displayYesPool) + amt * 1e6) / 1e6).toFixed(2)
    : null
  const estNo = amt > 0 && Number(displayYesPool) + Number(displayNoPool) > 0
    ? ((amt * 1e6 + Number(totalPool)) * (amt * 1e6) / (Number(displayNoPool) + amt * 1e6) / 1e6).toFixed(2)
    : null

  // ─── Place Bet ──────────────────────────────────
  const placeBet = async (outcome: 'yes' | 'no') => {
    if (!activeAddress || !appId) return
    if (amt < 0.1) { showToast('Enter a valid ALGO amount', 'error'); return }
    setBetLoading(true)
    try {
      const algod = getAlgodClient()
      const sp = await algod.getTransactionParams().do()
      const microAlgos = algosToMicroAlgos(amt)

      // ── Non-contract markets: real payment to admin with question note ──
      if (!isRealMarket) {
        const feeMicroAlgos = Math.max(1000, Math.floor(Number(microAlgos) * 0.01))
        const noteStr = `ProBex|${selectedQ.id}|${outcome}|${amt}|${selectedQ.title.slice(0, 60)}`
        // txn[0]: 1% platform fee → admin
        const feeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: activeAddress, receiver: ADMIN_ADDRESS,
          amount: feeMicroAlgos, suggestedParams: sp,
          note: new Uint8Array(Buffer.from(noteStr)),
        })
        // txn[1]: bet amount → admin (held until contract deployment)
        const betTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: activeAddress, receiver: ADMIN_ADDRESS,
          amount: Number(microAlgos), suggestedParams: sp,
          note: new Uint8Array(Buffer.from(`ProBex bet: ${amt} ALGO on ${outcome.toUpperCase()} — ${selectedQ.id}`)),
        })
        const txns = algosdk.assignGroupID([feeTxn, betTxn])
        const signedTxns = await transactionSigner(txns, [0, 1])
        await algod.sendRawTransaction(signedTxns).do()
        await algosdk.waitForConfirmation(algod, txns[1].txID(), 4)
        const confirmedTxId = txns[1].txID()
        setSimBets(prev => ({ ...prev, [selectedQ.id]: { outcome, amount: amt, txId: confirmedTxId } }))
        showToast(`${amt} ALGO on ${outcome.toUpperCase()} — Tx confirmed on-chain ✓`, 'success')
        setLastTxId(confirmedTxId)
        setBetAmount('')
        setLogs(prev => [
          { addr: activeAddress.slice(0, 4) + '...' + activeAddress.slice(-4), outcome, amount: amt, time: 'just now', txId: confirmedTxId },
          ...prev.slice(0, 5),
        ])
        setBetLoading(false)
        return
      }

      // ── Real contract market (algo-1): 3-txn group ──
      const appAddr = getAppAddress(appId)
      // 1% platform fee to admin, minimum 1000 microALGO (0.001 ALGO)
      const feeMicroAlgos = Math.max(1000, Math.floor(Number(microAlgos) * 0.01))

      // txn[0]: platform fee → admin address (visible on Lora as fee recipient)
      const feeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress, receiver: ADMIN_ADDRESS,
        amount: feeMicroAlgos, suggestedParams: sp,
        note: new Uint8Array(Buffer.from('ProBex platform fee')),
      })
      // txn[1]: bet payment → app escrow
      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress, receiver: appAddr,
        amount: Number(microAlgos), suggestedParams: sp,
      })
      // txn[2]: app call — always OptIn (contract allows one bet per address)
      const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: activeAddress, appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.OptInOC,
        appArgs: [
          new Uint8Array(Buffer.from(algosdk.ABIMethod.fromSignature('bet(string,pay)void').getSelector())),
          algosdk.ABIType.from('string').encode(outcome),
        ],
        suggestedParams: sp,
      })

      const txns = algosdk.assignGroupID([feeTxn, payTxn, appCallTxn])
      const signedTxns = await transactionSigner(txns, [0, 1, 2])
      await algod.sendRawTransaction(signedTxns).do()
      await algosdk.waitForConfirmation(algod, txns[2].txID(), 4)

      const confirmedTxId = txns[2].txID()
      showToast(`Prediction placed! ${amt} ALGO on ${outcome.toUpperCase()} · Tx confirmed`, 'success')
      setLastTxId(confirmedTxId)
      setLogs((prev) => [
        { addr: activeAddress.slice(0, 4) + '...' + activeAddress.slice(-4), outcome, amount: amt, time: 'just now', txId: confirmedTxId },
        ...prev.slice(0, 5),
      ])
      setBetAmount('')
      await refreshState()
      await refreshUserBet()
    } catch (e: any) {
      console.error('Bet failed', e)
      showToast(e?.message ?? 'Bet transaction failed', 'error')
    } finally { setBetLoading(false) }
  }

  // ─── Resolve ────────────────────────────────────
  const resolveMarket = async (outcome: 'yes' | 'no') => {
    if (!activeAddress || !appId) return
    setResolveLoading(true)
    try {
      const algod = getAlgodClient()
      const sp = await algod.getTransactionParams().do()
      const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: activeAddress, appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [
          new Uint8Array(Buffer.from(algosdk.ABIMethod.fromSignature('resolve_market(string)void').getSelector())),
          algosdk.ABIType.from('string').encode(outcome),
        ],
        suggestedParams: sp,
      })
      const signed = await transactionSigner([appCallTxn], [0])
      await algod.sendRawTransaction(signed).do()
      await algosdk.waitForConfirmation(algod, appCallTxn.txID(), 4)
      setLastTxId(appCallTxn.txID())
      showToast(`Market resolved: ${outcome.toUpperCase()} · Automated payouts enabled`, 'info')
      await refreshState()
    } catch (e: any) {
      console.error('Resolve failed', e)
      showToast(e?.message ?? 'Resolve transaction failed', 'error')
    } finally { setResolveLoading(false) }
  }

  // ─── Claim ──────────────────────────────────────
  const claimWinnings = async () => {
    if (!activeAddress || !appId) return
    setClaimLoading(true)
    try {
      const algod = getAlgodClient()
      const sp = await algod.getTransactionParams().do()
      sp.fee = 2000n; sp.flatFee = true
      const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: activeAddress, appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [
          new Uint8Array(Buffer.from(algosdk.ABIMethod.fromSignature('claim_winnings()void').getSelector())),
        ],
        suggestedParams: sp,
      })
      const signed = await transactionSigner([appCallTxn], [0])
      await algod.sendRawTransaction(signed).do()
      await algosdk.waitForConfirmation(algod, appCallTxn.txID(), 4)
      setLastTxId(appCallTxn.txID())
      showToast('Winnings sent! Transaction confirmed', 'success')
      await refreshState()
      await refreshUserBet()
    } catch (e: any) {
      console.error('Claim failed', e)
      showToast(e?.message ?? 'Claim transaction failed', 'error')
    } finally { setClaimLoading(false) }
  }

  // ─── Cancel bid (sends note-txn to admin; contract has no cancel method) ──
  const requestCancelBet = async () => {
    if (!activeAddress || !userBet || !isRealMarket) return
    setCancelLoading(true)
    try {
      const algod = getAlgodClient()
      const sp = await algod.getTransactionParams().do()
      sp.fee = 1000n; sp.flatFee = true
      const note = `ProBex cancel request: appId=${appId} outcome=${userBet.outcome === 1 ? 'yes' : 'no'} amount=${Number(userBet.amount)}`
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: ADMIN_ADDRESS,
        amount: 0,
        note: new Uint8Array(Buffer.from(note)),
        suggestedParams: sp,
      })
      const signed = await transactionSigner([txn], [0])
      await algod.sendRawTransaction(signed).do()
      await algosdk.waitForConfirmation(algod, txn.txID(), 4)
      setLastTxId(txn.txID())
      showToast('Cancel request sent to admin. Refund processed manually if approved.', 'info')
    } catch (e: any) {
      showToast(e?.message ?? 'Cancel request failed', 'error')
    } finally { setCancelLoading(false) }
  }

  // ─── Wallet helpers ─────────────────────────────
  const handleDisconnect = async () => {
    const active = wallets?.find((w) => w.isActive)
    if (active) await active.disconnect()
  }

  // canBet: wallet connected + market open + not currently loading + user hasn't already bet
  const canBet = !!activeAddress && !displayResolved && !betLoading && displayUserBet === null

  // ─── Render ─────────────────────────────────────
  return (
    <>
      {showNav && <div className="grid-bg" />}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? '✓  ' : t.type === 'error' ? '✕  ' : 'i  '}{t.msg}
          </div>
        ))}
      </div>

      <div className="wrap">
        {/* NAV */}
        {showNav && (<nav className="nav">
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
              href={`${LORA_BASE}/application/${appId}`}
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
        </nav>)}

        {/* HERO */}
        {showNav && (<div className="hero">
          <div className="hero-tag">PREDICTION MARKETS ON ALGORAND</div>
          <h1>Predict the future.<br /><em>Get paid</em> for it.</h1>
          <p className="hero-sub">
            Trustless, on-chain prediction markets powered by Algorand. No middlemen. Automated settlement. Your stake, your call.
          </p>
        </div>)}

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">TOTAL POOL</div>
            <div className="stat-value green"><AnimatedAlgo microAlgos={totalPool} /></div>
            <div className="stat-sub">ACROSS ALL BETS</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">YES / NO SPLIT</div>
            <div className="stat-value">{yesPct}% / {noPct}%</div>
            <div className="stat-sub">CURRENT ODDS</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">SETTLEMENT</div>
            <div className="stat-value" style={{ fontSize: 15, paddingTop: 4 }}>Automated</div>
            <div className="stat-sub">100% ON-CHAIN</div>
          </div>
        </div>

        {/* RESOLVED BANNER */}
        {displayResolved && (
          <div className="resolved-banner">
            <div className="rb-tag">MARKET RESOLVED</div>
            <div className="rb-msg">
              {market.winningOutcome === 1 ? 'YES wins!' : 'NO wins!'} The market has been settled.
            </div>
            {displayUserBet && !displayUserBet.claimed && (
              <button className="claim-btn" onClick={claimWinnings} disabled={claimLoading}>
                {claimLoading ? 'Claiming…' : 'Claim my winnings'}
              </button>
            )}
            {displayUserBet?.claimed && (
              <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--g)' }}>✓ Winnings claimed</span>
            )}
          </div>
        )}

        {/* ── QUESTION BROWSER ─────────────────────────────────── */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', letterSpacing: 1, marginBottom: 12 }}>
            PREDICTION QUESTIONS — {QUESTIONS.length} MARKETS
          </div>

          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                style={{
                  fontFamily: 'var(--fm)', fontSize: 10, padding: '5px 12px', borderRadius: 20,
                  border: `1px solid ${filterCat === c ? 'var(--g)' : 'var(--border2)'}`,
                  background: filterCat === c ? 'rgba(0,229,176,.12)' : 'var(--c1)',
                  color: filterCat === c ? 'var(--g)' : 'var(--txt3)', cursor: 'pointer', letterSpacing: '.3px',
                }}
              >{c}</button>
            ))}
          </div>

          {/* Question cards list — market card renders inline after selected */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {QUESTIONS.filter(q => filterCat === 'All' || q.category === filterCat).map((q) => {
              const isSelected = selectedQ.id === q.id
              return (
                <div key={q.id}>
                  <button
                    onClick={() => {
                      setSelectedQ(q)
                      setTimeout(() => marketCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
                    }}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      background: isSelected ? 'rgba(0,229,176,.06)' : 'var(--c1)',
                      border: `1px solid ${isSelected ? 'var(--border)' : 'var(--border2)'}`,
                      borderRadius: 12, padding: '12px 14px',
                      color: 'var(--txt)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{
                            fontFamily: 'var(--fm)', fontSize: 9, padding: '2px 8px', borderRadius: 20,
                            background: q.live ? 'rgba(0,229,176,.12)' : 'rgba(255,255,255,.04)',
                            border: `1px solid ${q.live ? 'rgba(0,229,176,.3)' : 'var(--border2)'}`,
                            color: q.live ? 'var(--g)' : 'var(--txt3)', letterSpacing: .5,
                          }}>{q.live ? '⬤ LIVE' : 'UPCOMING'}</span>
                          <span style={{
                            fontFamily: 'var(--fm)', fontSize: 9, padding: '2px 8px', borderRadius: 20,
                            background: 'rgba(255,255,255,.03)', border: '1px solid var(--border2)', color: 'var(--txt3)',
                          }}>{q.category}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{q.title}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--txt3)', whiteSpace: 'nowrap' }}>
                          Resolves {q.resolves}
                        </div>
                        {q.live && (
                          <a
                            href={q.id === 'algo-1' ? `${LORA_BASE}/application/${appId}` : (simBets[q.id]?.txId ? `${LORA_BASE}/transaction/${simBets[q.id].txId}` : `${LORA_BASE}/account/${ADMIN_ADDRESS}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontFamily: 'var(--fm)', fontSize: 9, padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(0,229,176,.06)', border: '1px solid rgba(0,229,176,.2)',
                              color: 'var(--g)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            Lora
                          </a>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* ── INLINE MARKET CARD ── */}
                  {isSelected && (
                    <div ref={marketCardRef} style={{ marginTop: 8, marginBottom: 8 }}>
                      <div className="market-card">
                        <div className="mc-header">
                          <div className="badges" style={{ flexWrap: 'wrap' }}>
                            {selectedQ.live ? (
                              displayResolved ? (
                                <span className="badge badge-resolved">RESOLVED</span>
                              ) : (
                                <span className="badge badge-live"><span className="live-dot" style={{ width: 5, height: 5 }} />LIVE</span>
                              )
                            ) : (
                              <span className="badge" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--txt3)', border: '1px solid var(--border2)' }}>UPCOMING</span>
                            )}
                            <span className="badge badge-cat">{selectedQ.category.toUpperCase()}</span>
                            {selectedQ.live && (
                              <a
                                href={isRealMarket ? `${LORA_BASE}/application/${appId}` : (simBets[selectedQ.id]?.txId ? `${LORA_BASE}/transaction/${simBets[selectedQ.id].txId}` : `${LORA_BASE}/account/${ADMIN_ADDRESS}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontFamily: 'var(--fm)', fontSize: 9, padding: '3px 10px', borderRadius: 20,
                                  background: 'rgba(0,229,176,.08)', border: '1px solid rgba(0,229,176,.25)',
                                  color: 'var(--g)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                                  marginLeft: 'auto',
                                }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                View on Lora
                              </a>
                            )}
                          </div>
                          <div className="mc-question">{selectedQ.title}</div>
                          <div className="mc-meta">
                            Resolves: {selectedQ.resolves} &nbsp;·&nbsp;
                            {selectedQ.live ? (isRealMarket ? <>Oracle: Admin Address &nbsp;·&nbsp; App ID: {appId}</> : <>Simulated Market &nbsp;·&nbsp; On-chain deployment pending</>) : 'Market not yet deployed'}
                          </div>
                        </div>
                        <div className="mc-body">
                          {selectedQ.live ? (
                            <>
                              <div className="pool-bar-wrap">
                                <div className="pool-labels">
                                  <span className="lbl-yes">YES &nbsp;{yesPct}%</span>
                                  <span className="lbl-no">NO &nbsp;{noPct}%</span>
                                </div>
                                <div className="bar-track">
                                  <div className="bar-yes" style={{ width: `${yesPct}%` }} />
                                </div>
                              </div>
                              <div className="pool-amounts">
                                <div className="pool-box yes">
                                  <div className="pb-lbl yes">YES POOL</div>
                                  <div className="pb-amt"><AnimatedAlgo microAlgos={displayYesPool} /></div>
                                  <div className="pb-pct">{yesPct}%</div>
                                  <div className="pb-odds yes">Payout: {payout(displayYesPool, totalPool)}</div>
                                </div>
                                <div className="pool-box no">
                                  <div className="pb-lbl no">NO POOL</div>
                                  <div className="pb-amt"><AnimatedAlgo microAlgos={displayNoPool} /></div>
                                  <div className="pb-pct">{noPct}%</div>
                                  <div className="pb-odds no">Payout: {payout(displayNoPool, totalPool)}</div>
                                </div>
                              </div>
                              {displayUserBet && (
                                <div className="your-bet" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                  <div>
                                    <div className="yb-tag">YOUR POSITION</div>
                                    <div className="yb-info">
                                      <strong>{fmtAlgo(displayUserBet.amount)}</strong> on <strong>{displayUserBet.outcome === 1 ? 'YES' : 'NO'}</strong>
                                      {displayUserBet.claimed && ' · Claimed ✓'}
                                      {!isRealMarket && <span style={{ color: 'var(--txt3)', fontSize: 10, marginLeft: 6 }}>(simulated)</span>}
                                    </div>
                                  </div>
                                  {!displayResolved && !displayUserBet.claimed && isRealMarket && (
                                    <div style={{ textAlign: 'right' }}>
                                      <button onClick={requestCancelBet} disabled={cancelLoading} style={{ fontFamily: 'var(--fm)', fontSize: 10, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,79,139,.3)', background: 'rgba(255,79,139,.07)', color: 'var(--pink)', cursor: cancelLoading ? 'not-allowed' : 'pointer' }}>
                                        {cancelLoading ? 'Sending…' : '✕ Request Cancel'}
                                      </button>
                                      <div style={{ fontFamily: 'var(--fm)', fontSize: 9, color: 'var(--txt3)', marginTop: 3 }}>Sends cancel request to admin</div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {!displayResolved && (
                                <>
                                  <div className="bet-label">PLACE YOUR PREDICTION</div>
                                  <input className="bet-input" type="number" placeholder="Enter ALGO amount" min="0.1" step="0.1" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} />
                                  <div className="quick-bets">
                                    {[1, 5, 10, 50].map((v) => (
                                      <button key={v} className="qb" onClick={() => setBetAmount(String(v))}>{v}</button>
                                    ))}
                                  </div>
                                  {amt > 0 && estYes && estNo && (
                                    <div className="payout-est">
                                      <div className="pe-lbl">Est. payout if correct</div>
                                      <div className="pe-vals">
                                        <div className="pe-yes">YES: {estYes} ALGO</div>
                                        <div className="pe-no">NO: {estNo} ALGO</div>
                                      </div>
                                    </div>
                                  )}
                                  <div className="bet-btns" style={{ marginTop: 14 }}>
                                    <button className="btn-yes" disabled={!canBet} onClick={() => placeBet('yes')}>{betLoading ? 'Signing tx…' : selectedQ.yesLabel}</button>
                                    <button className="btn-no" disabled={!canBet} onClick={() => placeBet('no')}>{betLoading ? 'Signing tx…' : selectedQ.noLabel}</button>
                                  </div>
                                  {!activeAddress && <div className="wallet-hint">Connect wallet to place predictions</div>}
                                  {activeAddress && displayUserBet !== null && !displayResolved && (
                                    <div className="wallet-hint" style={{ color: 'var(--g)', borderColor: 'rgba(0,229,176,.2)' }}>✓ You already have an active bet on this market</div>
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                              <div style={{ fontFamily: 'var(--fm)', fontSize: 32, marginBottom: 12 }}>🔒</div>
                              <div style={{ fontFamily: 'var(--fm)', fontSize: 13, color: 'var(--txt2)', marginBottom: 6 }}>Market not yet deployed</div>
                              <div style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--txt3)', maxWidth: 320, margin: '0 auto' }}>
                                This market opens when a new contract is deployed. Select the <span style={{ color: 'var(--g)' }}>LIVE</span> market to place bets.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* LAST TX LINK */}
        {lastTxId && (
          <div className="tx-banner">
            <span className="tx-banner-lbl">Latest Transaction</span>
            <a
              className="tx-banner-link"
              href={`${LORA_BASE}/transaction/${lastTxId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {lastTxId.slice(0, 12)}…{lastTxId.slice(-6)}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
            <span className="tx-banner-sub">View full details on Lora Explorer</span>
          </div>
        )}

        {/* ACTIVITY LOG */}
        {logs.length > 0 && (
          <div className="bets-log">
            <div className="log-title">RECENT ACTIVITY</div>
            <div className="log-list">
              {logs.map((l, i) => (
                <div key={i} className="log-item">
                  <span className="log-addr">{l.addr}</span>
                  <span className={`log-out ${l.outcome}`}>{l.outcome.toUpperCase()}</span>
                  <span className="log-amt">{l.amount} ALGO</span>
                  <span className="log-time">{l.time}</span>
                  {l.txId && (
                    <a
                      className="log-lora"
                      href={`${LORA_BASE}/transaction/${l.txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on Lora"
                    >↗</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMIN PANEL */}
        {isAdmin && selectedQ.live && !displayResolved && (
          <div className="admin-card">
            <div className="admin-tag">ORACLE / ADMIN PANEL</div>
            <div className="admin-title">Resolve: "{selectedQ.title}"</div>
            <div className="admin-btns">
              <button className="ab yes" onClick={() => resolveMarket('yes')} disabled={resolveLoading}>
                {resolveLoading ? 'Resolving…' : 'Resolve YES'}
              </button>
              <button className="ab no" onClick={() => resolveMarket('no')} disabled={resolveLoading}>
                {resolveLoading ? 'Resolving…' : 'Resolve NO'}
              </button>
            </div>
            <div className="admin-note">Restricted to deployer address. Permanent — triggers automated payout to winners.</div>
          </div>
        )}

        {showNav && <div className="footer">
          Built on <span>Algorand</span> · ProBex POC · Hackathon Demo · All transactions on TestNet
        </div>}
      </div>

      {/* WALLET MODAL */}
      <ConnectWallet openModal={walletModalOpen} closeModal={() => setWalletModalOpen(false)} />
    </>
  )
}
