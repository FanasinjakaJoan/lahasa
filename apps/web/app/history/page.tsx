'use client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
export default function History(){ return <div className="min-h-screen p-6"><Link href="/" className="flex items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4"/> Retour</Link><div className="mt-10 text-center text-slate-500">Historique complet — à implémenter (utilise /dashboard pour MVP)</div></div> }
