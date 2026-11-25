// Diagnostic answer types, and helpers for showing results to admins. Attempts are scored on the server only.

/** How sure the person was when they picked an answer. */
export type DiagnosticConfidence = "high" | "medium" | "low" | "none"

export type DiagnosticAnswer = {
  questionId: number
  /** Index of the picked option. -1 means the question was left unanswered. */
  picked: number
  confidence: DiagnosticConfidence
}

/** The confidence choices shown after every answer. */
export const CONFIDENCE_LABEL: Record<DiagnosticConfidence, string> = {
  high: "Confident",
  medium: "Unsure",
  low: "Guessing",
  none: "Not rated",
}

export const CONFIDENCE_EMOJI: Record<DiagnosticConfidence, string> = {
  high: "😎",
  medium: "🤔",
  low: "😬",
  none: "—",
}

/** Points as a 0-100 percent, with negative totals clamped to zero. */
export function elementPercent(points: number, maxPoints: number) {
  if (maxPoints <= 0) return 0
  const clamped = Math.max(0, points)
  return Math.round((clamped / maxPoints) * 100)
}

type ElementPercentInput = {
  element: number
  points: number
  maxPoints: number
  /** Already worked out by the server, when it sends one. */
  percent?: number
}

/** The percent for an element from the API or from a local score. */
export function elementScorePercent(element: ElementPercentInput) {
  if (typeof element.percent === "number") return element.percent
  return elementPercent(element.points, element.maxPoints)
}

/** The element with the highest percent; ties go to more points. */
export function strongestElement<T extends ElementPercentInput>(elements: T[]): T {
  let best = elements[0]
  for (const element of elements) {
    const percent = elementScorePercent(element)
    const bestPercent = elementScorePercent(best)
    if (percent > bestPercent) best = element
    else if (percent === bestPercent && element.points > best.points) best = element
  }
  return best
}

/** The element with the lowest percent; ties go to fewer points. */
export function weakestElement<T extends ElementPercentInput>(elements: T[]): T {
  let worst = elements[0]
  for (const element of elements) {
    const percent = elementScorePercent(element)
    const worstPercent = elementScorePercent(worst)
    if (percent < worstPercent) worst = element
    else if (percent === worstPercent && element.points < worst.points) worst = element
  }
  return worst
}
