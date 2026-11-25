"use client"

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"

import { PageTitle } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import type { DiagnosticTestInfo } from "@/lib/api"

export function DiagnosticIntro({
  test,
  starting,
  onStart,
}: {
  test: DiagnosticTestInfo
  /** The questions are still loading. */
  starting?: boolean
  onStart: () => void
}) {
  return (
    <>
      <PageTitle
        back={{ href: "/diagnostic", label: "All diagnostic tests" }}
        eyebrow={test.examCode || undefined}
        title={test.title}
        subtitle={test.description || undefined}
      />

      <section className="max-w-2xl space-y-6">
        <dl className="tnum grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm">
          <div className="bg-white px-5 py-4">
            <dt className="text-xs text-muted-foreground">Questions</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-heading">{test.questionCount}</dd>
          </div>
          <div className="bg-white px-5 py-4">
            <dt className="text-xs text-muted-foreground">Time</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-heading">About {test.durationMinutes} min</dd>
          </div>
        </dl>

        <ul className="space-y-3 text-[15px] leading-relaxed text-gray-700">
          <li>You see one question at a time and can go back to change any answer.</li>
          <li>
            After each answer, tell us how sure you were: confident, unsure or guessing. A correct
            answer you were sure of scores more than a lucky guess.
          </li>
          <li>
            Nothing is marked while you take it. Your result stays locked after you submit: you&apos;ll
            book a call with Vipin to see it and plan what to study first.
          </li>
          <li>There is no timer. Your answers are only saved when you submit.</li>
          <li>You can take this diagnostic only once, so set aside the time before you start.</li>
        </ul>

        <Button size="lg" onClick={onStart} disabled={starting}>
          {starting ? "Loading questions…" : "Start the diagnostic"}
          <ArrowRightIcon />
        </Button>
      </section>
    </>
  )
}
