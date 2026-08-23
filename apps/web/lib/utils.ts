import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCIN(num: string): string {
  const digits = num.replace(/\D/g, '').slice(0, 12)
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
}

export function generateLHId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const rand = (n: number) => Array.from({length: n}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
  return `LH-${rand(4)}-${rand(4)}`
}
