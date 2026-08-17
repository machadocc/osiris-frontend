const DATE_WORD_OFFSETS = { anteontem: -2, ontem: -1, hoje: 0 }

function toIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function extractDate(text) {
  const lower = text.toLowerCase()

  for (const [word, offsetDays] of Object.entries(DATE_WORD_OFFSETS)) {
    const index = lower.indexOf(word)
    if (index !== -1) {
      const date = new Date()
      date.setDate(date.getDate() + offsetDays)
      return { date: toIsoDate(date), rest: text.slice(0, index) + text.slice(index + word.length) }
    }
  }

  const match = text.match(/\b(\d{1,2})\/(\d{1,2})\b/)
  if (match) {
    const day = Number(match[1])
    const month = Number(match[2])
    const now = new Date()
    let candidate = new Date(now.getFullYear(), month - 1, day)
    if (candidate > now) candidate = new Date(now.getFullYear() - 1, month - 1, day)
    return { date: toIsoDate(candidate), rest: text.slice(0, match.index) + text.slice(match.index + match[0].length) }
  }

  return { date: toIsoDate(new Date()), rest: text }
}

function extractAmount(text) {
  const match = text.match(/r\$\s*(\d[\d.,]*)|\b(\d[\d.,]*)\b/i)
  if (!match) return { amount: null, rest: text }

  let raw = match[1] ?? match[2]
  raw = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
  const amount = Number(raw)

  return {
    amount: Number.isFinite(amount) ? amount : null,
    rest: text.slice(0, match.index) + text.slice(match.index + match[0].length),
  }
}

// Heurística de melhor esforço (RF-TRX-12): extrai data primeiro (senão "17/08" seria
// confundido com um valor pelo extractAmount), depois valor, sobra vira a descrição.
export function parseQuickAdd(text) {
  const { date, rest: afterDate } = extractDate(text)
  const { amount, rest: afterAmount } = extractAmount(afterDate)
  const description = afterAmount.replace(/\s+/g, ' ').trim()

  return { amount, date, description }
}
