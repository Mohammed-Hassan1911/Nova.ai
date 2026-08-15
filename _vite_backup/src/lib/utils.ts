import { clsx, type ClassValue } from 'clsx'
import { fmt, formatDate } from '@/data/mock'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export { fmt, formatDate }

export function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function timeAgo(isoDate: string) {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
