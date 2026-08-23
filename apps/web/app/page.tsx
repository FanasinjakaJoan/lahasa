'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18nStore } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { healthCheck } from '@/lib/api'
import { ScanLine, Shield, Zap, Globe, Database, QrCode, WifiOff, CheckCircle2 } from 'lucide-react'
import { db } from '@/lib/db'

export default function Home() {
  const { lang, setLang, t, dict } = useI18nStore()
  const [online, setOnline] = useState(true)
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    update()
    healthCheck().then(setApiStatus)
    db.pendingUploads.count().then(setPendingCount)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">L</div>
            <div>
              <div className="font-semibold tracking-tight leading-none">Lahasa</div>
              <div className="text-[11px] text-slate-500">{t('common.tagline')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${online ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <div className={`h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
              {online ? t('common.online') : t('common.offline')} {pendingCount > 0 && `(${pendingCount})`}
            </div>
            {apiStatus && <Badge className="bg-slate-900 text-white hidden sm:flex">API {apiStatus.ocr_engine}</Badge>}
            <div className="flex rounded-full border border-slate-200 p-1 ml-2">
              {(['fr','mg'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 text-xs font-medium rounded-full transition ${lang===l ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-lahasa-50 border border-lahasa-100 px-3 py-1 text-xs font-medium text-lahasa-700">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lahasa-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-lahasa-600"></span></span>
                Nouveau — OCR malgache optimisé
              </div>
              <h1 className="mt-6 text-5xl md:text-6xl font-bold tracking-tight leading-[0.95]">
                Collecte<br />
                <span className="text-slate-400">d'identité</span><br />
                en 3 clics.
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-[48ch]">
                Numérisez une CIN malgache → extraction auto (OCR + Regex) → validation + QR unique. 
                Fonctionne hors-ligne, pensé pour le terrain.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/capture"><Button size="lg" variant="secondary" className="rounded-full px-8"><ScanLine className="mr-2 h-5 w-5" /> {t('nav.capture')}</Button></Link>
                <Link href="/dashboard"><Button size="lg" variant="outline" className="rounded-full px-8">Dashboard</Button></Link>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-200 pt-8">
                {[
                  { k: '2-3', v: 'clics / action' },
                  { k: '<2s', v: 'extraction OCR' },
                  { k: '100%', v: 'offline-first' },
                ].map(s => (
                  <div key={s.k}><div className="text-2xl font-bold">{s.k}</div><div className="text-xs text-slate-500 uppercase tracking-wide">{s.v}</div></div>
                ))}
              </div>
            </div>

            {/* Mockup UI */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-lahasa-100 to-slate-100 rounded-[32px] blur-2xl" />
              <Card className="relative rounded-[24px] overflow-hidden shadow-2xl border-slate-200">
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div className="flex gap-1.5"><div className="h-3 w-3 rounded-full bg-red-500" /><div className="h-3 w-3 rounded-full bg-yellow-500" /><div className="h-3 w-3 rounded-full bg-green-500" /></div>
                  <div className="text-xs opacity-60">lahasa.app/capture</div>
                  <QrCode className="h-4 w-4 opacity-60" />
                </div>
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50">
                      <div className="mx-auto h-14 w-14 rounded-xl bg-slate-900 text-white grid place-items-center mb-3"><ScanLine /></div>
                      <div className="font-medium">Glissez votre CIN ici</div>
                      <div className="text-xs text-slate-500 mt-1">JPG, PNG jusqu'à 10MB</div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {[
                        { label: 'N°CIN', value: '101 234 567 890', conf: 96 },
                        { label: 'Nom', value: 'RAKOTONDRABE', conf: 94 },
                        { label: 'Prénoms', value: 'Fanasinjaka Joan', conf: 92 },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3">
                          <div><div className="text-[11px] uppercase tracking-wide text-slate-500">{row.label}</div><div className="font-medium text-sm">{row.value}</div></div>
                          <Badge className="bg-green-50 text-green-700 border border-green-200">{row.conf}%</Badge>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex gap-2">
                      <div className="flex-1 h-11 rounded-xl bg-lahasa-600 text-white grid place-items-center text-sm font-medium">Valider ✓</div>
                      <div className="h-11 w-11 rounded-xl border border-slate-200 grid place-items-center"><QrCode className="h-5 w-5" /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: 'OCR malgache', desc: 'Preprocessing OpenCV (CLAHE, deskew) + Tesseract fra+eng + regex spécifiques CIN 12 chiffres. Simulation intelligente en fallback.' },
                { icon: WifiOff, title: 'Offline-first', desc: 'PWA + Dexie IndexedDB + file d’attente. Sync auto dès retour réseau via /sync/batch avec détection conflits.' },
                { icon: Shield, title: 'Anti-doublon', desc: 'Exact match N°CIN + fuzzy matching (RapidFuzz) nom/prénoms/date >85%. QR signé HMAC pour vérif offline.' },
              ].map(f => (
                <Card key={f.title} className="rounded-2xl p-6">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-items-center mb-4"><f.icon className="h-5 w-5" /></div>
                  <div className="font-semibold">{f.title}</div>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </Card>
              ))}
            </div>

            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <Card className="rounded-2xl p-6 bg-slate-900 text-white border-slate-900">
                <div className="flex items-center gap-3"><Globe className="h-5 w-5" /><h3 className="font-semibold">Stack technique</h3></div>
                <pre className="mt-4 text-xs leading-relaxed overflow-auto opacity-80">{`apps/web    → Next.js 14 + Tailwind + Dexie
apps/mobile → Expo + SecureStore + SQLite
apps/api    → FastAPI + OpenCV + Tesseract
infra       → Docker + Postgres + MinIO S3
packages    → shared types + i18n fr/mg`}</pre>
              </Card>
              <Card className="rounded-2xl p-6">
                <div className="flex items-center gap-3"><Database className="h-5 w-5" /><h3 className="font-semibold">Flux terrain</h3></div>
                <ol className="mt-4 space-y-2 text-sm">
                  {[
                    'Agent ouvre /capture → photo CIN (2 clics)',
                    'OCR auto + confidence par champ',
                    'Édition rapide si besoin + alerte doublon',
                    'Validation → LH-ID + QR instantané',
                    'Si offline → queue locale + sync auto',
                  ].map((s,i) => (
                    <li key={i} className="flex gap-3"><span className="h-6 w-6 rounded-full bg-slate-100 grid place-items-center text-xs font-bold">{i+1}</span><span className="text-slate-600">{s}</span></li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        Lahasa — Lahasa manamora ny fiainana • MIT • Built for Madagascar
      </footer>
    </div>
  )
}
