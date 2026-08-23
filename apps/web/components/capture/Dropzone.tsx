'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  onFile: (file: File) => void
  isLoading?: boolean
  t: (k: string) => string
  dict: any
}

export function Dropzone({ onFile, isLoading, t, dict }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image trop volumineuse (max 10MB)')
      return
    }
    onFile(file)
  }, [onFile])

  const tips: string[] = dict?.capture?.tipsList || [
    "Assurez-vous que la CIN est bien éclairée",
    "Évitez les reflets et les ombres",
    "Cadrez toute la carte",
    "Image nette et lisible"
  ]

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        className={cn(
          "relative rounded-[24px] border-2 border-dashed bg-white p-8 md:p-12 transition-all",
          dragOver ? "border-lahasa-500 bg-lahasa-50/50 scale-[1.01]" : "border-slate-200 hover:border-slate-300",
          isLoading && "pointer-events-none opacity-60"
        )}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-lahasa-600" />
            <p className="text-slate-600 font-medium">{t('capture.uploading')}</p>
            <p className="text-xs text-slate-400">Preprocess OpenCV → Tesseract → Parsing MG</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">{t('capture.dragDrop')}</h3>
              <p className="mt-2 text-sm text-slate-500">{t('capture.supported')}</p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                <Button onClick={() => inputRef.current?.click()} className="flex-1" variant="secondary" size="lg">
                  <ImageIcon className="mr-2 h-5 w-5" /> Parcourir
                </Button>
                <Button onClick={() => cameraRef.current?.click()} className="flex-1" variant="outline" size="lg">
                  <Camera className="mr-2 h-5 w-5" /> {t('capture.takePhoto')}
                </Button>
              </div>
            </div>

            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">💡 {t('capture.tips')}</h4>
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {tips.map((tip: string, i: number) => (
            <li key={i} className="text-xs text-amber-800 flex gap-2"><span>•</span>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
