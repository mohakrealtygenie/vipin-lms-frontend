"use client"

import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { AppShell, ErrorNote, PageTitle, errMsg } from "@/components/app-shell"
import { DiagnosticIntro } from "@/components/diagnostic/diagnostic-intro"
import {
  BackToTests,
  DiagnosticAlreadyTaken,
  DiagnosticSubmitted,
  DiagnosticUnlockedResult,
} from "@/components/diagnostic/diagnostic-result"
import { DiagnosticTest } from "@/components/diagnostic/diagnostic-test"
import {
  ApiError,
  getDiagnosticQuestions,
  getDiagnosticTest,
  getMyDiagnosticResult,
  submitDiagnosticResult,
  type DiagnosticQuestion,
  type DiagnosticTestInfo,
  type MyDiagnosticResult,
} from "@/lib/api"
import type { DiagnosticAnswer } from "@/lib/diagnostic-score"

type Stage = "loading" | "missing" | "error" | "intro" | "test" | "submitted" | "taken" | "result"

export default function DiagnosticTestPage() {
  return (
    <AppShell>
      <DiagnosticFlow />
    </AppShell>
  )
}

function DiagnosticFlow() {
  const { slug } = useParams<{ slug: string }>()
  const [stage, setStage] = useState<Stage>("loading")
  const [test, setTest] = useState<DiagnosticTestInfo | null>(null)
  const [questions, setQuestions] = useState<DiagnosticQuestion[] | null>(null)
  const [result, setResult] = useState<MyDiagnosticResult | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [wantsStart, setWantsStart] = useState(false)
  const [answers, setAnswers] = useState<DiagnosticAnswer[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const failed = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 404) setStage("missing")
    else if (e instanceof ApiError && e.status === 409) setStage("taken")
    else {
      setLoadError(errMsg(e))
      setWantsStart(false)
      setStage((s) => (s === "loading" ? "error" : s))
    }
  }, [])

  // The questions come without the answer key; the server scores the attempt.
  const loadQuestions = useCallback(() => {
    setLoadError(null)
    return getDiagnosticQuestions(slug).then(setQuestions).catch(failed)
  }, [slug, failed])

  // Block a second attempt before the user starts, and fetch the questions while they read the intro.
  useEffect(() => {
    let cancelled = false
    getDiagnosticTest(slug)
      .then((t) => {
        if (cancelled) return
        setTest(t)
        if (t.taken && t.unlocked) {
          // An admin unlocked the result: show it. If it was locked again meanwhile (403), show the locked view.
          return getMyDiagnosticResult(slug)
            .then((r) => {
              if (cancelled) return
              setResult(r)
              setStage("result")
            })
            .catch((e) => {
              if (cancelled) return
              if (e instanceof ApiError && e.status === 403) setStage("taken")
              else failed(e)
            })
        }
        if (t.taken) {
          setStage("taken")
          return
        }
        setStage("intro")
        return loadQuestions()
      })
      .catch((e) => {
        if (!cancelled) failed(e)
      })
    return () => {
      cancelled = true
    }
  }, [slug, loadQuestions, failed])

  // Start pressed before the questions arrived: go as soon as they do.
  useEffect(() => {
    if (wantsStart && questions && stage === "intro") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStage("test")
    }
  }, [wantsStart, questions, stage])

  function start() {
    setWantsStart(true)
    if (!questions) loadQuestions()
  }

  async function save(finalAnswers: DiagnosticAnswer[]) {
    setSaving(true)
    setSaveError(null)
    try {
      await submitDiagnosticResult({ testSlug: slug, answers: finalAnswers })
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setStage("taken")
      } else {
        setSaveError(errMsg(e))
      }
    } finally {
      setSaving(false)
    }
  }

  async function submit(finalAnswers: DiagnosticAnswer[]) {
    setAnswers(finalAnswers)
    setStage("submitted")
    await save(finalAnswers)
  }

  if (stage === "loading") return null

  if (stage === "missing") {
    return (
      <>
        <PageTitle
          back={{ href: "/diagnostic", label: "All diagnostic tests" }}
          title="Test not found"
          subtitle="This diagnostic doesn't exist or isn't available any more."
        />
        <BackToTests />
      </>
    )
  }

  if (stage === "error" || !test) {
    return (
      <>
        <PageTitle back={{ href: "/diagnostic", label: "All diagnostic tests" }} title="Diagnostic" />
        <ErrorNote error={loadError ?? "Something went wrong"} />
        <BackToTests />
      </>
    )
  }

  if (stage === "result" && result) {
    return <DiagnosticUnlockedResult result={result} />
  }

  if (stage === "taken") {
    return <DiagnosticAlreadyTaken title={test.title} takenAt={test.takenAt} />
  }

  if (stage === "test" && questions) {
    if (questions.length === 0) {
      return (
        <>
          <PageTitle back={{ href: "/diagnostic", label: "All diagnostic tests" }} title={test.title} />
          <ErrorNote error="This test has no questions yet." />
        </>
      )
    }
    return <DiagnosticTest questions={questions} onSubmit={submit} />
  }

  if (stage === "submitted") {
    return <DiagnosticSubmitted saving={saving} saveError={saveError} onRetry={() => save(answers)} />
  }

  return (
    <>
      <DiagnosticIntro test={test} starting={wantsStart && !questions && !loadError} onStart={start} />
      <ErrorNote error={loadError} />
    </>
  )
}
