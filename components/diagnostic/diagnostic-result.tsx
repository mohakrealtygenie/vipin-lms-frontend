"use client"

import { ArrowUpRightIcon, CalendarCheckIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { useEffect, useState } from "react"

import { ErrorNote, PageTitle } from "@/components/app-shell"
import { RadarChart } from "@/components/diagnostic/radar-chart"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { DiagnosticResultElement, MyDiagnosticResult } from "@/lib/api"
import { DIAGNOSTIC_ELEMENTS } from "@/lib/diagnostic-questions"
import { elementScorePercent } from "@/lib/diagnostic-score"
import { cn } from "@/lib/utils"

/** Where a student books the call in which Vipin goes through their diagnostic result with them. */
export const BOOK_CALL_URL = "https://cal.com/vipin-garg-fin-coach/strategy"

const BACK = { href: "/diagnostic", label: "All diagnostic tests" }

/** Shown after submitting: saving, a retry on failure, then the locked result. */
export function DiagnosticSubmitted({
  saving,
  saveError,
  onRetry,
}: {
  saving: boolean
  saveError: string | null
  onRetry: () => void
}) {
  if (saveError) {
    return (
      <>
        <PageTitle title="Could not save" subtitle="Your answers are still here. Try again." />
        <ErrorNote error={saveError} />
        <div>
          <Button onClick={onRetry} disabled={saving}>
            Try again
          </Button>
        </div>
      </>
    )
  }

  if (saving) {
    return <PageTitle title="Saving your answers" subtitle="This takes a moment. Please keep this page open." />
  }

  return (
    <>
      <PageTitle
        back={BACK}
        title="Your result is ready"
        subtitle="Thank you, your answers are in. Book a call to see your result and talk it through."
      />
      <LockedResult />
    </>
  )
}

/**
 * The student's own result, once an admin has unlocked it (usually after the strategy call):
 * the score, the strongest chapters and those to review, and how they did in each chapter.
 * The server sends no answers, so nothing here can give away the answer key.
 */
export function DiagnosticUnlockedResult({ result }: { result: MyDiagnosticResult }) {
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const ranked = rankChapters(result.elements)
  const strongest = ranked.slice(0, 2)
  const toReview = ranked.slice(-2).reverse()
  const when = new Date(result.takenAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })

  return (
    <>
      <PageTitle
        back={BACK}
        eyebrow={result.testTitle}
        title="Your result"
        subtitle={`You took this diagnostic on ${when}. Here is how you did in each chapter.`}
      />

      <Card className="pop overflow-hidden bg-navy">
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm text-white/75">Overall</div>
            <div className="tnum text-5xl font-semibold text-white sm:text-6xl">
              {result.correct}
              <span className="text-2xl text-white/60 sm:text-3xl">/{result.total}</span>
              <span className="ml-3 text-lg font-normal text-white/75 sm:text-xl">correct</span>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-white/60">Strongest chapters</dt>
              <dd className="font-medium text-white">{joinChapterNames(strongest)}</dd>
            </div>
            <div>
              <dt className="text-white/60">Chapters to review</dt>
              <dd className="font-medium text-white">{joinChapterNames(toReview)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="grid items-center gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <RadarChart
            labels={result.elements.map((element) => chapterName(element.element))}
            values={result.elements.map((element) => elementScorePercent(element))}
          />

          <ul className="divide-y divide-border">
            {ranked.map((element) => {
              const percent = elementScorePercent(element)
              return (
                <li key={element.element} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-heading">{chapterName(element.element)}</span>
                    <span className="tnum shrink-0 text-sm text-muted-foreground">
                      {element.correct}/{element.total} right · {percent}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-teal transition-[width] duration-700 ease-out motion-reduce:transition-none"
                      style={{ width: drawn ? `${percent}%` : "0%" }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        A chapter&apos;s percent weighs how sure you were: a confident right answer counts double, and a wrong answer
        takes a point away.
      </p>
    </>
  )
}

function chapterName(element: number) {
  const found = DIAGNOSTIC_ELEMENTS[element - 1]
  return found ? found.name : `Chapter ${element}`
}

/** Highest percent first; ties go to more points, like the admin result page. */
function rankChapters(elements: DiagnosticResultElement[]) {
  const ranked = [...elements]
  ranked.sort((a, b) => elementScorePercent(b) - elementScorePercent(a) || b.points - a.points)
  return ranked
}

function joinChapterNames(elements: DiagnosticResultElement[]) {
  return elements.map((element) => chapterName(element.element)).join(", ")
}

/** Shown when this email already took the test. */
export function DiagnosticAlreadyTaken({ title, takenAt }: { title: string; takenAt: string | null }) {
  const when = takenAt
    ? new Date(takenAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : null
  return (
    <>
      <PageTitle
        back={BACK}
        eyebrow={title}
        title="Your result is ready"
        subtitle={
          when
            ? `You took this diagnostic on ${when}. Each test can be taken once per email.`
            : "You already took this diagnostic. Each test can be taken once per email."
        }
      />
      <LockedResult />
    </>
  )
}

/**
 * The result, hazed over and locked. The server never sends a student their score, so the blurred
 * layer is a fixed decorative shape with no numbers or text in it: unblurring it in devtools reveals
 * nothing. The only way to see the result is the call.
 */
export function LockedResult() {
  return (
    <section
      aria-labelledby="locked-result-title"
      className="relative isolate overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(10,37,64,0.07),0_1px_2px_rgba(10,37,64,0.04),0_8px_24px_-12px_rgba(10,37,64,0.10)]"
    >
      <ResultPlaceholder />

      <div className="relative z-10 flex min-h-[26rem] flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.7)_45%,rgba(255,255,255,0.25)_100%)] px-6 py-12 text-center sm:min-h-[28rem]">
        <span className="mb-5 grid size-14 place-items-center rounded-full bg-navy text-white shadow-[0_8px_24px_-8px_rgba(16,42,67,0.6)]">
          <LockSimpleIcon className="size-6" weight="fill" aria-hidden="true" />
        </span>
        <h2 id="locked-result-title" className="display text-2xl font-semibold text-heading sm:text-[1.75rem]">
          Your result is locked
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-gray-700">
          Book a strategy call with Vipin to see your result. You&apos;ll go through it chapter by chapter and leave with a
          plan for what to study first.
        </p>
        <a
          href={BOOK_CALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "mt-7")}
        >
          <CalendarCheckIcon className="size-5" />
          Book a call to see your result
          <ArrowUpRightIcon className="size-4 opacity-70" />
        </a>
        <p className="mt-3 text-[13px] text-muted-foreground">Opens cal.com in a new tab</p>
      </div>
    </section>
  )
}

/** A made-up skill shape and bars, the same for everyone. It is decoration only, not data. */
const PLACEHOLDER_SHAPE = [0.78, 0.52, 0.9, 0.36, 0.68, 0.58, 0.84, 0.44, 0.62]
const PLACEHOLDER_BARS = [82, 64, 91, 47, 73]

function ResultPlaceholder() {
  const point = (i: number, r: number) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / PLACEHOLDER_SHAPE.length
    return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`
  }
  const ring = (r: number) => PLACEHOLDER_SHAPE.map((_, i) => point(i, r)).join(" ")
  const shape = PLACEHOLDER_SHAPE.map((v, i) => point(i, v * 100)).join(" ")

  return (
    <div
      aria-hidden="true"
      inert
      className="pointer-events-none absolute inset-0 grid scale-105 items-center gap-10 p-8 blur-[7px] select-none sm:grid-cols-[1.1fr_1fr] sm:p-12"
    >
      <svg viewBox="-120 -120 240 240" className="mx-auto w-full max-w-[20rem]">
        {[25, 50, 75, 100].map((r) => (
          <polygon key={r} points={ring(r)} fill="none" stroke="#102a43" strokeOpacity={0.25} strokeWidth={1.5} />
        ))}
        <polygon points={shape} fill="hsl(var(--teal))" fillOpacity={0.45} stroke="hsl(var(--teal))" strokeWidth={4} />
      </svg>
      <div className="hidden space-y-5 sm:block">
        <div className="flex items-end gap-2">
          <div className="h-11 w-16 rounded-lg bg-heading/45" />
          <div className="h-6 w-10 rounded-md bg-heading/20" />
        </div>
        {PLACEHOLDER_BARS.map((width, i) => (
          <div key={i} className="space-y-2">
            <div className="h-2.5 rounded-full bg-heading/30" style={{ width: `${40 + ((i * 17) % 35)}%` }} />
            <div className="h-2.5 rounded-full bg-gray-200/80">
              <div className="h-2.5 rounded-full bg-teal" style={{ width: `${width}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** A link back to the list, for screens with no other way out on phones. */
export function BackToTests() {
  return (
    <div>
      <Link href="/diagnostic" className={buttonVariants({ variant: "outline" })}>
        All diagnostic tests
      </Link>
    </div>
  )
}
