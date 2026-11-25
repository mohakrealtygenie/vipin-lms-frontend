"use client"

import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  ListNumbersIcon,
  LockSimpleIcon,
  TimerIcon,
} from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { useEffect, useState } from "react"

import { AppShell, ErrorNote, PageTitle, errMsg } from "@/components/app-shell"
import { Empty, Loading } from "@/components/learning"
import { listDiagnosticTests, type DiagnosticTestInfo } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function DiagnosticTestsPage() {
  return (
    <AppShell>
      <DiagnosticTests />
    </AppShell>
  )
}

function DiagnosticTests() {
  const [tests, setTests] = useState<DiagnosticTestInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listDiagnosticTests()
      .then(setTests)
      .catch((e) => setError(errMsg(e)))
  }, [])

  return (
    <>
      <PageTitle
        title="Diagnostic tests"
        subtitle="Find out which chapters you already know and which need work. Pick a test to begin."
      />
      <ErrorNote error={error} />
      {!tests && !error && <Loading rows={3} />}

      {tests && tests.length === 0 && (
        <Empty
          icon={ClipboardTextIcon}
          title="No diagnostic tests yet"
          text="When a diagnostic is available, it shows up here."
        />
      )}

      {tests && tests.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <li key={test.id}>
              <TestCard test={test} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function TestCard({ test }: { test: DiagnosticTestInfo }) {
  return (
    <Link
      href={`/diagnostic/${encodeURIComponent(test.slug)}`}
      className={cn(
        "group flex h-full flex-col rounded-2xl bg-white p-5 transition-[box-shadow,transform] duration-200 ease-(--ease-out) sm:p-6",
        "shadow-[0_0_0_1px_rgba(10,37,64,0.07),0_1px_2px_rgba(10,37,64,0.04),0_8px_24px_-12px_rgba(10,37,64,0.10)]",
        "hover:shadow-[0_0_0_1px_rgba(10,37,64,0.12),0_2px_4px_rgba(10,37,64,0.05),0_16px_32px_-16px_rgba(10,37,64,0.18)] active:scale-[0.99]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {test.examCode ? (
          <span
            title={test.examName || undefined}
            className="rounded-full bg-navy/[0.06] px-2.5 py-1 text-[12px] font-semibold tracking-[0.02em] text-heading/80"
          >
            {test.examCode}
          </span>
        ) : (
          <span />
        )}
        {test.taken && (
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-teal">
            <CheckCircleIcon weight="fill" className="size-4" />
            Completed
          </span>
        )}
      </div>

      <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-heading">{test.title}</h2>
      {test.description && (
        <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-muted-foreground">{test.description}</p>
      )}

      <ul className="tnum mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-gray-600">
        <li className="flex items-center gap-1.5">
          <ListNumbersIcon className="size-4 text-heading/45" aria-hidden="true" />
          {test.questionCount} questions
        </li>
        <li className="flex items-center gap-1.5">
          <TimerIcon className="size-4 text-heading/45" aria-hidden="true" />
          About {test.durationMinutes} min
        </li>
      </ul>

      <div className="mt-auto pt-5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-semibold",
            test.taken && !test.unlocked ? "text-heading/70" : "text-heading"
          )}
        >
          {test.taken && test.unlocked ? (
            <>
              See your result
              <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          ) : test.taken ? (
            <>
              <LockSimpleIcon weight="fill" className="size-4" />
              Result locked · Book a call to see it
            </>
          ) : (
            <>
              Start the test
              <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </span>
      </div>
    </Link>
  )
}
