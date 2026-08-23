'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useI18nStore } from '@/lib/i18n'
import { Dropzone } from '@/components/capture/Dropzone'
import { extractCIN } from '@/lib/api'
import { db, addPending } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, WifiOff, CheckCircle } from 'lucide-react'

export default function CapturePage() {
  const { t, dict } = useI18nStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<any>(null)

  useEffect(() => {
    const upd = () => setOnline(navigator.onLine)
    window.addEventListener('online', upd)
    window.addEventListener('offline', upd)
    upd()
    return () => {
      window.removeEventListener('online', upd)
      window.removeEventListener('offline', upd)
    }
  }, [])

  const toBase64 = (file: File) => new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })

  const handleFile = async (file: File) => {
    setError(null)
    setLoading(true)
    const b64 = await toBase64(file)
    setPreview(b64)

    try {
      // Si offline, queue
      if (!navigator.onLine) {
        await addPending(file, b64)
        setLoading(false)
        setLastResult({ offline: true })
        return
      }

      const result = await extractCIN(file, false)
      setLastResult(result)
      
      // Stocker local aussi pour historique
      await db.localRecords.add({
        id: result.id,
        lh_id: result.lh_id,
        data: result.data,
        qr_data: result.qr_data,
        qr_base64: result.qr_image_base64,
        createdAt: Date.now(),
        synced: true
      })

      // Rediriger vers validation avec data en sessionStorage
      sessionStorage.setItem(`lahasa:${result.id}`, JSON.stringify(result))
      router.push(`/validate/${result.id}`)

    } catch (e: any) {
      console.error(e)
      // Si API down, queue offline
      if (e.message?.includes('fetch') || e.message?.includes('Failed')) {
        await addPending(file, b64)
        setLastResult({ offline: true })
      } else {
        setError(e.message || 'Erreur extraction')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfdf9]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-slate-600">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <div className={`text-xs px-2.5 py-1 rounded-full border ${online ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            {online ? '● Connecté' : '● Hors-ligne — file d’attente activée'}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('capture.title')}</h1>
          <p className="mt-2 text-slate-600">{t('capture.subtitle')}</p>
        </div>

        {error && (
          <Card className="max-w-2xl mx-auto mb-6 p-4 border-red-200 bg-red-50 text-red-700 text-sm">
            ⚠️ {error}
          </Card>
        )}

        {lastResult?.offline && (
          <Card className="max-w-2xl mx-auto mb-6 p-6 border-amber-200 bg-amber-50">
            <div className="flex gap-3">
              <WifiOff className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900">{t('capture.offlineQueued')}</div>
                <div className="text-sm text-amber-700 mt-1">L&apos;image est sauvegardée localement. Elle sera synchronisée automatiquement dès le retour de la connexion.</div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setPreview(null); setLastResult(null) }}>Nouvelle capture</Button>
                  <Link href="/dashboard"><Button size="sm" variant="secondary">Voir file d&apos;attente</Button></Link>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Dropzone onFile={handleFile} isLoading={loading} t={t} dict={dict} />

        {preview && !lastResult?.offline && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Aperçu</div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white p-2">
              <img src={preview} alt="preview" className="w-full rounded-xl max-h-[420px] object-contain bg-slate-50" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
