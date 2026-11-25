// The CIRE diagnostic's chapters, by element number (index 0 is element 1). Shown only on admin result pages.
// The questions and the answer key live on the server: the browser never receives the answers,
// and every attempt is scored there. Admins get each result's questions with the answers from the API.
export const DIAGNOSTIC_ELEMENTS = [
  { name: "Regulatory framework" },
  { name: "Prospective client relationships" },
  { name: "Scope of client relationships" },
  { name: "Complaint handling" },
  { name: "Market and company analysis" },
  { name: "Market integrity and trading" },
  { name: "Securities and managed products" },
  { name: "Derivatives" },
  { name: "Ethics and conflicts" },
] as const
