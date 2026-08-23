'use client'
import { create } from 'zustand'
import fr from '../../../packages/shared/i18n/fr.json'
import mg from '../../../packages/shared/i18n/mg.json'

type Lang = 'fr' | 'mg'
type Dict = typeof fr

const dicts: Record<Lang, Dict> = { fr, mg } as any

interface I18nStore {
  lang: Lang
  setLang: (l: Lang) => void
  t: (path: string) => string
}

function getNested(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) || path
}

import { useState, useEffect } from 'react'

export function useI18nStore() {
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('lahasa-lang') as Lang
    if (saved && (saved === 'fr' || saved === 'mg')) setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lahasa-lang', l)
  }

  const t = (path: string) => getNested(dicts[lang], path)

  return { lang, setLang, t, dict: dicts[lang] }
}
