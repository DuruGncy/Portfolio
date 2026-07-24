/**
 * Which ElevenLabs agent this portfolio talks to.
 *
 * Kept in its own module (no SDK import) so both the lazy-loaded engine and the
 * always-present provider can read it without pulling the WebRTC bundle into
 * the initial page load.
 */
export const AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ??
  "agent_7601kncsedaye66s90rwnc8g5f8v";

/**
 * The agent's public widget config — unauthenticated, same endpoint the
 * official embed uses. We read one field from it: whether the agent is set to
 * **text only**, in which case a voice session will connect and then sit there
 * in silence, because the agent never synthesises speech.
 *
 * Checking it means the mode toggle reflects what the agent can actually do,
 * and voice re-enables itself the moment the setting is changed on
 * elevenlabs.io — no redeploy needed.
 */
export const AGENT_CONFIG_URL = `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}/widget`;

/** `null` while unknown — the UI stays optimistic until we hear otherwise. */
export type VoiceSupport = boolean | null;

export async function fetchVoiceSupport(
  signal?: AbortSignal
): Promise<VoiceSupport> {
  try {
    const res = await fetch(AGENT_CONFIG_URL, { signal });
    if (!res.ok) return null;
    const data: { widget_config?: { text_only?: boolean } } = await res.json();
    const textOnly = data.widget_config?.text_only;
    return typeof textOnly === "boolean" ? !textOnly : null;
  } catch {
    // Offline, blocked, or the shape changed — stay optimistic and let the
    // session itself surface any problem.
    return null;
  }
}
