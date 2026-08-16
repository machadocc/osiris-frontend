import { createWorker } from 'tesseract.js'

export const CURRENCY_REGEX = /r?\$?\s?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/gi
export const DATE_REGEX = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/

export function parseCurrency(raw) {
  const normalized = raw.replace(/\./g, '').replace(',', '.')
  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : null
}

function extractAmount(text) {
  const lines = text.split('\n')
  const totalLine = lines.find((line) => /total/i.test(line))
  const totalMatches = totalLine ? [...totalLine.matchAll(CURRENCY_REGEX)] : []

  if (totalMatches.length > 0) {
    return parseCurrency(totalMatches[totalMatches.length - 1][1])
  }

  const values = [...text.matchAll(CURRENCY_REGEX)]
    .map((match) => parseCurrency(match[1]))
    .filter((value) => value !== null)

  return values.length > 0 ? Math.max(...values) : null
}

function extractDate(text) {
  const match = text.match(DATE_REGEX)
  if (!match) return null

  const day = match[1].padStart(2, '0')
  const month = match[2].padStart(2, '0')
  const year = match[3].length === 2 ? `20${match[3]}` : match[3]

  if (Number.isNaN(new Date(`${year}-${month}-${day}`).getTime())) return null

  return `${year}-${month}-${day}`
}

function extractDescription(text) {
  const line = text
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry.length >= 3 && /[a-zA-ZÀ-ÿ]{3,}/.test(entry))

  return line ? line.slice(0, 255) : null
}

const DIACRITICS_RANGE_START = String.fromCharCode(0x0300)
const DIACRITICS_RANGE_END = String.fromCharCode(0x036f)
const DIACRITICS_REGEX = new RegExp(`[${DIACRITICS_RANGE_START}-${DIACRITICS_RANGE_END}]`, 'g')

export function normalize(value) {
  return value.normalize('NFD').replace(DIACRITICS_REGEX, '').toLowerCase()
}

function matchCategory(text, categories) {
  const normalizedText = normalize(text)

  return categories.find((category) => normalizedText.includes(normalize(category.name))) ?? null
}

export async function extractReceiptData(file, categories, onProgress) {
  const worker = await createWorker('por', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress?.(Math.round(message.progress * 100))
      }
    },
  })

  try {
    const {
      data: { text },
    } = await worker.recognize(file)

    const matchedCategory = matchCategory(text, categories)

    return {
      amount: extractAmount(text),
      date: extractDate(text),
      description: extractDescription(text),
      categoryId: matchedCategory?.id ?? null,
    }
  } finally {
    await worker.terminate()
  }
}
