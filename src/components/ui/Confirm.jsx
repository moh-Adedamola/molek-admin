import { useCallback, useEffect, useRef, useState } from "react"
import { ConfirmContext } from "./confirmContext"

/*
 * The admin's one confirmation dialog (replaces browser pop-ups).
 * confirm({ title, message, details, confirmLabel, danger, requireText, choices })
 *  - details: list of lines shown as bullets (e.g. what will be deleted)
 *  - requireText: the confirm button stays disabled until this exact text is typed
 *  - choices: [{ value, label }] shows a dropdown; resolves to the chosen value
 *  - input: { label, defaultValue } shows a text box; resolves to the text (or null)
 * Resolves to true/false (or the chosen value / null).
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const [typed, setTyped] = useState("")
  const [choice, setChoice] = useState("")
  const [text, setText] = useState("")
  const resolver = useRef(null)
  const firstField = useRef(null)
  const cancelBtn = useRef(null)

  const confirm = useCallback((opts) => new Promise((resolve) => {
    resolver.current = resolve
    setTyped("")
    setChoice(opts.choices?.[0]?.value ?? "")
    setText(opts.input?.defaultValue ?? "")
    setState(opts)
  }), [])

  const close = (result) => {
    resolver.current?.(result)
    resolver.current = null
    setState(null)
  }

  useEffect(() => {
    if (!state) return undefined
    ;(firstField.current || cancelBtn.current)?.focus()
    const onKey = (e) => { if (e.key === "Escape") close(state.choices || state.input ? null : false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [state])

  const blocked = Boolean(state?.requireText) && typed !== state.requireText
  const onConfirm = () => { if (!blocked) close(state.choices ? choice : state.input ? text : true) }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message"
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 id="confirm-title" className="text-xl font-bold text-gray-900">{state.title}</h2>
            {state.message && <p id="confirm-message" className="mt-2 text-gray-700">{state.message}</p>}
            {state.details?.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-gray-800 space-y-1">
                {state.details.map((d) => <li key={d}>{d}</li>)}
              </ul>
            )}
            {state.choices && (
              <div className="mt-4">
                <label htmlFor="confirm-choice" className="block text-sm font-semibold text-gray-700 mb-1">{state.choiceLabel || "Choose"}</label>
                <select id="confirm-choice" ref={firstField} value={choice} onChange={(e) => setChoice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-blue-600">
                  {state.choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            )}
            {state.input && (
              <div className="mt-4">
                <label htmlFor="confirm-input" className="block text-sm font-semibold text-gray-700 mb-1">{state.input.label}</label>
                <input id="confirm-input" ref={firstField} value={text} onChange={(e) => setText(e.target.value)} autoComplete="off"
                  onKeyDown={(e) => { if (e.key === "Enter") onConfirm() }}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-blue-600" />
              </div>
            )}
            {state.requireText && (
              <div className="mt-4">
                <label htmlFor="confirm-typed" className="block text-sm font-semibold text-gray-700 mb-1">
                  To confirm, type <span className="font-mono bg-gray-100 px-1 rounded">{state.requireText}</span>
                </label>
                <input id="confirm-typed" ref={firstField} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off"
                  onKeyDown={(e) => { if (e.key === "Enter") onConfirm() }}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-red-700" />
              </div>
            )}
            <div className="mt-6 flex gap-3 justify-end">
              <button ref={cancelBtn} type="button" onClick={() => close(state.choices || state.input ? null : false)}
                className="px-4 py-2 rounded-lg font-semibold border-2 border-gray-300 text-gray-800 hover:bg-gray-50">
                {state.cancelLabel || "Cancel"}
              </button>
              <button type="button" onClick={onConfirm} disabled={blocked}
                className={`px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed ${state.danger ? "bg-red-700 hover:bg-red-800" : "bg-blue-700 hover:bg-blue-800"}`}>
                {state.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
