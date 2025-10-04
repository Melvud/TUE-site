// src/lib/dateUtils.ts

const EUROPE_TIMEZONE = 'Europe/Amsterdam'

/**
 * Форматирует дату в европейский формат с учетом timezone
 */
export function formatEuropeanDate(
  dateString: string | undefined | null,
  locale: string = 'nl-NL',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      return dateString
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: EUROPE_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }

    return new Intl.DateTimeFormat(locale, defaultOptions).format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

/**
 * Форматирует дату и время в европейский формат
 */
export function formatEuropeanDateTime(
  dateString: string | undefined | null,
  locale: string = 'nl-NL'
): string {
  return formatEuropeanDate(dateString, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Форматирует дату в короткий европейский формат (DD.MM.YYYY)
 */
export function formatShortEuropeanDate(
  dateString: string | undefined | null,
  locale: string = 'nl-NL'
): string {
  return formatEuropeanDate(dateString, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Парсит дату локально
 */
export function parseLocalDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null

  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Получает текущую дату/время в европейской timezone
 */
function getNowInEurope(): Date {
  const now = new Date()
  
  // Получаем текущее время в европейской timezone
  const europeTimeString = now.toLocaleString('en-US', { 
    timeZone: EUROPE_TIMEZONE 
  })
  
  return new Date(europeTimeString)
}

/**
 * Получает начало дня (midnight) для даты в европейской timezone
 */
function getStartOfDayInEurope(date: Date): Date {
  // Конвертируем дату в европейскую timezone
  const dateString = date.toLocaleString('en-US', { 
    timeZone: EUROPE_TIMEZONE 
  })
  const europeDate = new Date(dateString)
  
  // Устанавливаем время на начало дня (00:00:00)
  europeDate.setHours(0, 0, 0, 0)
  
  return europeDate
}

/**
 * Получает конец дня (23:59:59) для даты в европейской timezone
 */
function getEndOfDayInEurope(date: Date): Date {
  const dateString = date.toLocaleString('en-US', { 
    timeZone: EUROPE_TIMEZONE 
  })
  const europeDate = new Date(dateString)
  
  // Устанавливаем время на конец дня (23:59:59.999)
  europeDate.setHours(23, 59, 59, 999)
  
  return europeDate
}

/**
 * Проверяет, является ли дата прошлой (в европейской timezone)
 * Если дата без времени (только дата), сравнивает по дням
 * Если с временем - сравнивает точно
 */
export function isPastDate(dateString: string | undefined | null): boolean {
  const date = parseLocalDate(dateString)
  if (!date) return false

  const nowInEurope = getNowInEurope()

  // Проверяем, содержит ли дата время (часы/минуты)
  const hasTime = dateString?.includes('T') && !dateString.endsWith('T00:00:00.000Z')

  if (hasTime) {
    // Если есть время - точное сравнение
    const eventTimeInEurope = new Date(
      date.toLocaleString('en-US', { timeZone: EUROPE_TIMEZONE })
    )
    return eventTimeInEurope < nowInEurope
  } else {
    // Если только дата - сравниваем по дням
    const eventEndOfDay = getEndOfDayInEurope(date)
    return eventEndOfDay < nowInEurope
  }
}

/**
 * Проверяет, является ли дата будущей или сегодняшней (в европейской timezone)
 */
export function isUpcomingDate(dateString: string | undefined | null): boolean {
  return !isPastDate(dateString)
}

/**
 * Получает ключ для сравнения дат (для сортировки)
 */
export function getDateSortKey(dateString: string | undefined | null): number {
  const date = parseLocalDate(dateString)
  return date ? date.getTime() : 0
}

/**
 * Группирует даты по месяцам и годам
 */
export function groupByMonth(
  items: Array<{ date?: string }>
): Record<string, typeof items> {
  const groups: Record<string, typeof items> = {}

  items.forEach((item) => {
    if (!item.date) return

    const date = parseLocalDate(item.date)
    if (!date) return

    const key = new Intl.DateTimeFormat('nl-NL', {
      timeZone: EUROPE_TIMEZONE,
      year: 'numeric',
      month: 'long',
    }).format(date)

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  })

  return groups
}