import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { createWorker } from 'tesseract.js'
import { CURRENCY_REGEX, DATE_REGEX, normalize, parseCurrency } from './receiptOcr'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

const MIN_TEXT_LENGTH_PER_PAGE = 20

/**
 * `getTextContent()` do pdf.js devolve os itens de texto posicionados por
 * coordenada, sem quebras de linha — reconstrói as linhas comparando a
 * posição Y de cada item (itens na mesma linha visual têm Y parecido).
 */
async function extractPageText(page) {
  const content = await page.getTextContent()
  const lines = []
  let currentLine = []
  let lastY = null

  for (const item of content.items) {
    const y = item.transform[5]

    if (lastY !== null && Math.abs(y - lastY) > 2) {
      lines.push(currentLine.join(' '))
      currentLine = []
    }

    currentLine.push(item.str)
    lastY = y
  }

  if (currentLine.length > 0) lines.push(currentLine.join(' '))

  return lines.join('\n')
}

async function ocrPage(page, worker) {
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

  const {
    data: { text },
  } = await worker.recognize(canvas)

  return text
}

/**
 * Extrai o texto de um PDF de extrato, página por página: usa o texto nativo
 * do PDF quando existe (rápido, confiável) e cai para OCR (Tesseract.js) só
 * nas páginas sem texto extraível (escaneadas/foto).
 */
export async function extractStatementText(file, onProgress) {
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
  let ocrWorker = null
  const pages = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const nativeText = await extractPageText(page)

      if (nativeText.trim().length >= MIN_TEXT_LENGTH_PER_PAGE) {
        pages.push(nativeText)
      } else {
        ocrWorker = ocrWorker ?? (await createWorker('por'))
        pages.push(await ocrPage(page, ocrWorker))
      }

      onProgress?.({ page: pageNumber, totalPages: pdf.numPages })
    }
  } finally {
    if (ocrWorker) await ocrWorker.terminate()
  }

  return pages.join('\n')
}

function signFromPrecedingText(line, match) {
  const precedingText = line.slice(Math.max(0, match.index - 3), match.index)
  const isNegative = precedingText.includes('-') || line.slice(0, match.index).includes('(')

  return isNegative ? -1 : 1
}

/**
 * Nem todo banco marca o sinal (receita/despesa) no texto do valor — alguns
 * só diferenciam por cor no PDF original, que não existe no texto extraído
 * ("IOF S/C-C   0,16   -0,15", sem nenhum "-" no valor). Quando o valor tem
 * um sinal explícito no texto (ex: "R$ -300,00"), esse sinal local é sempre
 * a fonte da verdade — é confiável e não depende de nada além da própria
 * linha. Só quando o valor não tem sinal nenhum é que o sinal é inferido
 * pela variação entre o saldo desta linha e o da anterior (a maioria dos
 * extratos traz o saldo da conta como última coluna). Preferir o sinal local
 * ao invés de sempre usar o saldo é proposital: o saldo encadeia estado
 * linha a linha, então um único registro mal formado no meio de um extrato
 * longo contaminaria todas as linhas seguintes — o sinal explícito no valor
 * não tem esse risco.
 */
function findAmountAndUpdateBalance(line, previousBalanceRef) {
  const matches = [...line.matchAll(CURRENCY_REGEX)]
  if (matches.length === 0) return null

  // linha tipo "SALDO ANTERIOR   -   0,01": o traço no lugar do valor indica
  // que não é um lançamento de verdade, só o saldo de abertura — atualiza o
  // saldo conhecido (útil pro delta da próxima linha) e descarta como transação.
  if (matches.length === 1 && /\s-\s/.test(line.slice(0, matches[0].index))) {
    const balance = parseCurrency(matches[0][1])
    if (balance !== null) previousBalanceRef.value = balance
    return null
  }

  const valueMatch = matches[0]
  const magnitude = parseCurrency(valueMatch[1])
  if (magnitude === null) return null

  const balanceMatch = matches.length > 1 ? matches[matches.length - 1] : null
  const balance = balanceMatch ? parseCurrency(balanceMatch[1]) : null
  const signedBalance = balance !== null ? balance * signFromPrecedingText(line, balanceMatch) : null

  const precedingValueText = line.slice(Math.max(0, valueMatch.index - 3), valueMatch.index)
  const hasExplicitSign = precedingValueText.includes('-') || line.slice(0, valueMatch.index).includes('(')

  let amount
  if (hasExplicitSign) {
    amount = -Math.abs(magnitude)
  } else if (signedBalance !== null && previousBalanceRef.value !== null) {
    const delta = signedBalance - previousBalanceRef.value
    amount = Math.sign(delta) * Math.abs(magnitude)
  } else {
    amount = Math.abs(magnitude)
  }

  if (signedBalance !== null) previousBalanceRef.value = signedBalance

  return amount
}

/**
 * Busca uma linha tipo "Saldo inicial: R$ 68,94" em qualquer lugar do texto
 * para já começar sabendo o saldo anterior — sem isso, só o primeiro
 * registro do extrato fica sem uma coluna de saldo prévia pra comparar.
 */
function extractInitialBalance(text) {
  const match = normalize(text).match(
    /saldo inicial[^\d-]*(-?)\s*r?\$?\s?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/,
  )
  if (!match) return null

  const value = parseCurrency(match[2])
  if (value === null) return null

  return match[1] === '-' ? -value : value
}

function findDateInLine(line) {
  const match = line.match(DATE_REGEX)
  if (!match) return null

  const day = match[1].padStart(2, '0')
  const month = match[2].padStart(2, '0')
  const year = match[3].length === 2 ? `20${match[3]}` : match[3]

  if (Number.isNaN(new Date(`${year}-${month}-${day}`).getTime())) return null

  return `${year}-${month}-${day}`
}

function extractDescriptionFromLine(line, dateMatch) {
  let description = line
  if (dateMatch) description = description.replace(dateMatch[0], ' ')
  description = description.replace(CURRENCY_REGEX, ' ')
  // remove sequências longas de dígitos (ID da operação, número de documento etc.)
  description = description.replace(/\b\d{6,}\b/g, ' ')
  // "R$ -50,00": o "-" entre o símbolo e o número impede o regex de moeda de
  // casar o "R$" junto do valor, então sobra um "R$" solto — remove à parte.
  description = description.replace(/r\$/gi, ' ')
  description = description.replace(/[-+()]/g, ' ')
  description = description.replace(/\s+/g, ' ').trim()

  return description.slice(0, 255) || null
}

const LINE_STARTS_WITH_DATE = /^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/
// descrição real de lançamento é sempre curta; acima disso é quase sempre
// cabeçalho/rodapé de página que acabou grudado no registro por engano
const MAX_PLAUSIBLE_DESCRIPTION_LENGTH = 120

/**
 * Extratos em PDF costumam quebrar a descrição em mais de uma linha visual
 * quando ela não cabe na coluna (célula de tabela com texto longo). Agrupa
 * cada bloco de linhas reconstruídas em um único "registro", começando
 * sempre numa linha que abre com uma data — as linhas seguintes que não
 * abrem com data são consideradas continuação do registro anterior.
 */
function groupLinesIntoRecords(text) {
  const rawLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const records = []

  for (const line of rawLines) {
    if (LINE_STARTS_WITH_DATE.test(line) || records.length === 0) {
      records.push(line)
    } else {
      records[records.length - 1] += ' ' + line
    }
  }

  return records
}

/**
 * Heurística "melhor esforço" sobre o texto extraído: cada registro com uma
 * data (dd/mm/aaaa) e um valor em R$ vira uma transação candidata. Extratos
 * variam muito de banco pra banco — isso nunca é 100% preciso, por isso a
 * revisão manual antes de importar é obrigatória.
 */
export function parseStatementLines(text) {
  const previousBalanceRef = { value: extractInitialBalance(text) }

  return groupLinesIntoRecords(text)
    .map((line) => {
      const dateMatch = line.match(DATE_REGEX)
      const date = findDateInLine(line)
      const amount = findAmountAndUpdateBalance(line, previousBalanceRef)
      const description = extractDescriptionFromLine(line, dateMatch)

      if (!date || amount === null) return null
      if ((description?.length ?? 0) > MAX_PLAUSIBLE_DESCRIPTION_LENGTH) return null

      return { date, amount, description }
    })
    .filter(Boolean)
}

/**
 * Compara a descrição da linha do extrato com as palavras-chave cadastradas
 * em cada categoria (Category.keywords, separadas por vírgula). Não faz
 * nenhuma adivinhação semântica — só busca literal, sem acento/maiúsculas.
 */
export function matchCategoryByKeywords(description, categories) {
  const normalizedDescription = normalize(description ?? '')

  return (
    categories.find((category) => {
      if (!category.keywords) return false

      return category.keywords
        .split(',')
        .map((keyword) => normalize(keyword.trim()))
        .filter(Boolean)
        .some((keyword) => normalizedDescription.includes(keyword))
    }) ?? null
  )
}
