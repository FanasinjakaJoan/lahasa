'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18nStore } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/db'
import { listRecords, healthCheck } from '@/lib/api'
import { ArrowLeft, RefreshCw, WifiOff, Trash2, Upload } from 'lucide-react'

export default function Dashboard() {
  const { t } = useI18nStore()
  const [pending, setPending] = useState<any[]>([])
  const [local, setLocal] = useState<any[]>([])
  const [remote, setRemote] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [online, setOnline] = useState(true)

  const load = async () => {
    setPending(await db.pendingUploads.toArray())
    setLocal(await db.localRecords.orderBy('createdAt').reverse().toArray())
    try { setRemote(await listRecords()) } catch {}
    try { setHealth(await healthCheck()) } catch {}
  }

  useEffect(() => {
    load()
    const upd = () => setOnline(navigator.onLine)
    window.addEventListener('online', upd)
    window.addEventListener('offline', upd)
    return () => { window.removeEventListener('online', upd); window.removeEventListener('offline', upd) }
  }, [])

  const clearPending = async () => {
    await db.pendingUploads.clear()
    load()
  }

  return (
    <div className="min-h-screen bg-[#fcfdf9]">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium"><ArrowLeft className="h-4 w-4" /> Accueil</Link>
          <div className="flex items-center gap-2">
            <Badge className={online ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>{online ? 'Online' : 'Offline'}</Badge>
            <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>

        <div className="mt-8 grid md:grid-cols-4 gap-4">
          {[
            { label: t('dashboard.totalScanned'), value: (remote?.total || 0) + local.length },
            { label: t('dashboard.pending'), value: pending.length },
            { label: t('dashboard.validated'), value: local.length },
            { label: t('dashboard.offlineQueue'), value: pending.filter((p:any)=>p.status!=='synced').length },
          ].map(c => (
            <Card key={c.label} className="rounded-2xl"><CardContent className="p-5"><div className="text-2xl font-bold">{c.value}</div><div className="text-xs text-slate-500 uppercase tracking-wide">{c.label}</div></CardContent></Card>
          ))}
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.offlineQueue')}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={clearPending}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? <div className="text-sm text-slate-500 py-8 text-center">Aucune file d'attente</div> : (
                <div className="space-y-3">
                  {pending.map((p:any) => (
                    <div key={p.id} className="flex gap-3 items-center rounded-xl border border-slate-200 p-3">
                      <img src={p.base64Preview} className="h-12 w-12 rounded-lg object-cover bg-slate-50" />
                      <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.fileName}</div><div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()} • {p.status}</div></div>
                      <Badge className={p.status==='queued' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100'}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Historique local (Dexie)</CardTitle></CardHeader>
            <CardContent>
              {local.length===0 ? <div className="text-sm text-slate-500 py-8 text-center">Aucun enregistrement local</div> : (
                <div className="space-y-2 max-h-[360px] overflow-auto">
                  {local.map((r:any) => (
                    <div key={r.id} className="flex gap-3 items-center rounded-xl border border-slate-200 p-3">
                      <img src={r.qr_base64} className="h-10 w-10 rounded-lg" />
                      <div className="flex-1"><div className="text-sm font-medium">{r.lh_id} — {r.data.nom}</div><div className="text-xs text-slate-500">{r.data.numero_cin} • {new Date(r.createdAt).toLocaleString()}</div></div>
                      <Badge className={r.synced ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}>{r.synced ? 'sync' : 'local'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Serveur API</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {health ? (
                <div className="space-y-1">
                  <div>OCR Engine: <b>{health.ocr_engine}</b> (tesseract: {String(health.tesseract_available)})</div>
                  <div>Records in memory: {health.records_in_memory}</div>
                  <div>Version: {health.version}</div>
                </div>
              ) : <div className="text-slate-500">API hors-ligne ou non joignable</div>}
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Backend records</CardTitle></CardHeader>
            <CardContent>
              {remote ? (
                <div className="space-y-2 max-h-[200px] overflow-auto text-xs">
                  {remote.records.map((r:any)=>(
                    <div key={r.id} className="flex justify-between border-b border-slate-100 py-1"><span>{r.lh_id} — {r.nom} {r.prenoms}</span><span className="font-mono">{r.numero_cin}</span></div>
                  ))}
                </div>
              ) : <div className="text-sm text-slate-500">Aucune donnée serveur</div>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
