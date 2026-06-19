// App-runtime client for the (paid, authenticated) summarizer service.
// The credential is read from the environment at call time. It is never
// hardcoded here, and the agent that writes endpoint code never needs its value.
export function summarize(text) {
  const key = process.env.SUMMARY_API_KEY;
  if (!key) throw new Error("SUMMARY_API_KEY is not set");

  // Stand-in for the authenticated upstream call. Deterministic, so the demo
  // is reproducible offline. The real service would be reached over the network
  // using `key`; here the key only has to be present.
  const firstSentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return firstSentence.slice(0, 140).trim();
}
