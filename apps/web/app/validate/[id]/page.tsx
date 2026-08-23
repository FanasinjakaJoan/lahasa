'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18nStore } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { validateCIN } from '@/lib/api'
import { formatCIN } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, CheckCircle2, QrCode, Printer, Share2, Download } from 'lucide-react'

type FormData = {
  numero_cin: string
  nom: string
  prenoms: string
  date_naissance: string
  lieu_naissance: string
  sexe: string
  adresse: string
  date_emission: string
  lieu_emission: string
}

export default function ValidatePage() {
  const params = useParams()
  const id = params.id as string
  const { t } = useI18nStore()
  const router = useRouter()
  const [result, setResult] = useState<any>(null)
  const [form, setForm] = useState<FormData | null>(null)
  const [saving, setSaving] = useState(false)
  const [validated, setValidated] = useState<any>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(`lahasa:${id}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      setResult(parsed)
      setForm({
        numero_cin: parsed.data.numero_cin,
        nom: parsed.data.nom,
        prenoms: parsed.data.prenoms,
        date_naissance: parsed.data.date_naissance?.slice(0,10) || '',
        lieu_naissance: parsed.data.lieu_naissance,
        sexe: parsed.data.sexe,
        adresse: parsed.data.adresse,
        date_emission: parsed.data.date_emission?.slice(0,10) || '',
        lieu_emission: parsed.data.lieu_emission,
      })
    } else {
      // fallback: try local db
      // For MVP, redirect to capture if no data
      // router.push('/capture')
    }
  }, [id])

  const handleValidate = async () => {
    if (!form) return
    setSaving(true)
    try {
      // Transform dates to ISO
      const payload = {
        ...form,
        numero_cin: form.numero_cin,
        date_naissance: new Date(form.date_naissance).toISOString().split('T')[0],
        date_emission: new Date(form.date_emission).toISOString().split('T')[0],
      }
      const res = await validateCIN(id, payload)
      setValidated(res)
    } catch (e) {
      alert('Erreur validation')
    } finally {
      setSaving(false)
    }
  }

  if (!result || !form) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="p-8 text-center max-w-md">
          <div className="text-slate-500">Chargement... ou session expirée.</div>
          <Link href="/capture" className="mt-4 inline-block"><Button>Retour capture</Button></Link>
        </Card>
      </div>
    )
  }

  if (validated) {
    return (
      <div className="min-h-screen bg-[#fcfdf9]">
        <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4" /> Accueil</Link>
            <Badge className="bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Validé</Badge>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8">
          <Card className="rounded-[24px] p-8">
            <div className="flex items-center gap-3 text-green-700">
              <div className="h-10 w-10 rounded-full bg-green-100 grid place-items-center"><CheckCircle2 className="h-6 w-6" /></div>
              <div>
                <div className="font-bold text-lg">{t('validate.validated')}</div>
                <div className="text-xs text-slate-500">{t('validate.lhId')}: {validated.lh_id}</div>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              {Object.entries(validated.data).map(([k,v]) => (
                <div key={k} className="flex justify-between border-b border-slate-100 py-2"><span className="text-slate-500 capitalize">{k.replace('_',' ')}</span><span className="font-medium">{String(v)}</span></div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Link href="/capture" className="flex-1"><Button variant="secondary" className="w-full">Nouvelle CIN</Button></Link>
              <Link href="/dashboard" className="flex-1"><Button variant="outline" className="w-full">Dashboard</Button></Link>
            </div>
          </Card>

          <Card className="rounded-[24px] p-8 text-center">
            <h3 className="font-semibold">{t('qr.title')}</h3>
            <p className="text-xs text-slate-500 mt-1">{validated.qr_data}</p>
            <div className="mt-6 flex justify-center">
              <div className="rounded-2xl border border-slate-200 p-3 bg-white">
                <img src={validated.qr_image_base64} alt="QR" className="h-64 w-64" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> {t('qr.print')}</Button>
              <Button variant="outline" size="sm" onClick={() => { const a=document.createElement('a'); a.href=validated.qr_image_base64; a.download=`${validated.lh_id}.png`; a.click() }}><Download className="h-4 w-4 mr-1" /> {t('qr.download')}</Button>
              <Button variant="outline" size="sm" onClick={() => navigator.share?.({ title: validated.lh_id, text: validated.qr_data })}><Share2 className="h-4 w-4 mr-1" /> {t('qr.share')}</Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  const confColor = (v: number) => v > 0.9 ? 'bg-green-50 text-green-700 border-green-200' : v > 0.8 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'

  return (
    <div className="min-h-screen bg-[#fcfdf9]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/capture" className="flex items-center gap-2 text-sm font-medium"><ArrowLeft className="h-4 w-4" /> {t('capture.title')}</Link>
          <div className="flex items-center gap-2">
            <Badge className="font-mono text-xs border border-slate-200 bg-white">{result.lh_id}</Badge>
            <Badge className={confColor(result.confidence.global)}>{Math.round(result.confidence.global*100)}% {t('validate.confidence')}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card className="rounded-[24px]">
            <CardHeader>
              <CardTitle>{t('validate.title')}</CardTitle>
              <p className="text-sm text-slate-500">{t('validate.subtitle')}</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {result.duplicate_of && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <div className="font-semibold">{t('validate.duplicateWarning')} — {Math.round((result.duplicate_score||0)*100)}%</div>
                    <div className="text-xs">{t('validate.duplicateDetail')} (ID {result.duplicate_of})</div>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {[
                  { k: 'numero_cin', label: t('validate.fields.numero_cin'), type: 'text', conf: result.confidence.numero_cin },
                  { k: 'nom', label: t('validate.fields.nom'), type: 'text', conf: result.confidence.nom },
                  { k: 'prenoms', label: t('validate.fields.prenoms'), type: 'text', conf: result.confidence.prenoms },
                  { k: 'date_naissance', label: t('validate.fields.date_naissance'), type: 'date', conf: result.confidence.date_naissance },
                  { k: 'lieu_naissance', label: t('validate.fields.lieu_naissance'), type: 'text', conf: result.confidence.lieu_naissance },
                  { k: 'sexe', label: t('validate.fields.sexe'), type: 'select', conf: 1 },
                  { k: 'adresse', label: t('validate.fields.adresse'), type: 'text', conf: result.confidence.adresse },
                  { k: 'date_emission', label: t('validate.fields.date_emission'), type: 'date', conf: 0.85 },
                  { k: 'lieu_emission', label: t('validate.fields.lieu_emission'), type: 'text', conf: 0.85 },
                ].map(field => (
                  <div key={field.k} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold tracking-wide uppercase text-slate-500">{field.label}</label>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${confColor(field.conf)}`}>{Math.round(field.conf*100)}%</span>
                    </div>
                    {field.type === 'select' ? (
                      <select value={(form as any)[field.k]} onChange={e => setForm({...form, [field.k]: e.target.value} as any)} className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lahasa-500">
                        <option value="M">M - Lahy</option>
                        <option value="F">F - Vavy</option>
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={(form as any)[field.k]}
                        onChange={e => setForm({...form, [field.k]: field.k==='numero_cin' ? formatCIN(e.target.value) : e.target.value} as any)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lahasa-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => router.push('/capture')}>{t('common.cancel')}</Button>
                <Button variant="secondary" className="flex-1" onClick={handleValidate} disabled={saving}>{saving ? '...' : t('common.validate')} ✓</Button>
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-slate-500">Voir texte brut OCR</summary>
                <pre className="mt-2 p-3 bg-slate-50 rounded-xl overflow-auto whitespace-pre-wrap">{result.raw_text}</pre>
              </details>
            </CardContent>
          </Card>
        </div>

        {/* Preview + QR */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[24px] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-medium">QR Code pré-généré</span>
              <QrCode className="h-4 w-4 text-slate-400" />
            </div>
            <CardContent className="p-6 flex flex-col items-center">
              <img src={result.qr_image_base64} alt="QR" className="h-56 w-56 rounded-xl border border-slate-200" />
              <div className="mt-3 text-center">
                <div className="font-mono text-sm font-bold">{result.lh_id}</div>
                <div className="text-[11px] text-slate-500 break-all max-w-[28ch] mt-1">{result.qr_data}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] p-4 bg-slate-900 text-white">
            <div className="text-sm font-semibold">Détails technique OCR</div>
            <div className="mt-3 space-y-2 text-xs opacity-80">
              <div className="flex justify-between"><span>Moteur</span><span>{result.raw_text.includes('SIMULATION') ? 'Mock (démo)' : 'Tesseract 5'}</span></div>
              <div className="flex justify-between"><span>Preprocess</span><span>CLAHE + AdaptiveThreshold</span></div>
              <div className="flex justify-between"><span>Confiance globale</span><span>{Math.round(result.confidence.global*100)}%</span></div>
              <div className="flex justify-between"><span>ID interne</span><span className="font-mono">{result.id.slice(0,8)}</span></div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
