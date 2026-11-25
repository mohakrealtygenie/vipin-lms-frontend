"use client"

import {
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react/dist/ssr"
import { useState, type FormEvent } from "react"

import { ErrorNote, errMsg } from "@/components/app-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { emailDiagnosticResult, type DiagnosticResultSummary } from "@/lib/api"

const MAX_NOTE = 1000

type EmailableResult = Pick<
  DiagnosticResultSummary,
  "id" | "firstName" | "lastName" | "email" | "testTitle"
>

/**
 * Lets an admin email one diagnostic result. It goes to the person who took the test unless
 * another address is typed in. The form resets every time the dialog opens.
 */
export function EmailResultDialog({
  result,
  open,
  onOpenChange,
}: {
  result: EmailableResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md">
        {result && <EmailResultForm result={result} onClose={() => onOpenChange(false)} />}
      </AlertDialogContent>
    </AlertDialog>
  )
}

function EmailResultForm({
  result,
  onClose,
}: {
  result: EmailableResult
  onClose: () => void
}) {
  const [to, setTo] = useState(result.email)
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const name = `${result.firstName} ${result.lastName}`.trim() || result.email
  const firstName = result.firstName.trim() || "them"
  const recipient = to.trim()
  const toSomeoneElse = recipient.toLowerCase() !== result.email.toLowerCase()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const res = await emailDiagnosticResult(result.id, {
        to: recipient,
        note: note.trim() || undefined,
      })
      setSentTo(res?.to ?? recipient)
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setSending(false)
    }
  }

  if (sentTo) {
    return (
      <>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-green-50 text-green-700">
            <CheckCircleIcon weight="duotone" />
          </AlertDialogMedia>
          <AlertDialogTitle>Result is on its way</AlertDialogTitle>
          <AlertDialogDescription>
            {name}&apos;s result was sent to{" "}
            <span className="font-medium break-words text-heading">{sentTo}</span>. It usually
            arrives within a minute.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Done</AlertDialogAction>
        </AlertDialogFooter>
      </>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-accent text-primary">
          <EnvelopeSimpleIcon weight="duotone" />
        </AlertDialogMedia>
        <AlertDialogTitle>Email {name}&apos;s result</AlertDialogTitle>
        <AlertDialogDescription>
          Sends the {result.testTitle} score, strongest and weakest chapter, and the chapter
          breakdown. Individual answers aren&apos;t included.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <Field>
        <FieldLabel htmlFor="email-result-to">Send to</FieldLabel>
        <Input
          id="email-result-to"
          type="email"
          required
          autoComplete="off"
          spellCheck={false}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          disabled={sending}
        />
        <FieldDescription>
          {toSomeoneElse ? (
            <>
              Not the email {firstName} took the test with.{" "}
              <button
                type="button"
                className="font-medium text-teal underline underline-offset-2 hover:opacity-80"
                onClick={() => setTo(result.email)}
                disabled={sending}
              >
                Use {result.email}
              </button>
            </>
          ) : (
            `The email ${firstName} took the test with.`
          )}
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="email-result-note">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Textarea
          id="email-result-note"
          rows={3}
          maxLength={MAX_NOTE}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Shown above the results, e.g. Great speaking today. Start with the chapters marked Weak."
          disabled={sending}
        />
        {note.length > MAX_NOTE - 100 && (
          <FieldDescription className="tnum text-right">
            {note.length}/{MAX_NOTE}
          </FieldDescription>
        )}
      </Field>

      <ErrorNote error={error} />

      <AlertDialogFooter>
        <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
        <Button type="submit" disabled={sending || recipient === ""}>
          <PaperPlaneTiltIcon />
          {sending ? "Sending…" : "Send result"}
        </Button>
      </AlertDialogFooter>
    </form>
  )
}
