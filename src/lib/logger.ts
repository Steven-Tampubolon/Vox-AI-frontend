// src/lib/logger.ts

const STYLES = {
  prefix:  "color:#E35336;font-weight:bold",
  send:    "color:#4ADE80;font-weight:bold",
  reply:   "color:#60A5FA;font-weight:bold",
  error:   "color:#F87171;font-weight:bold",
  warning: "color:#FBBF24;font-weight:bold",
  char:    "color:#FACC15",
  info:    "color:#A78BFA;font-weight:bold",
};

export const logger = {
  send: (char: string, msg: string) =>
    console.log(
      "%c[VOX AI] %c→ SEND %c[%s]",
      STYLES.prefix, STYLES.send, STYLES.char, char,
      "\n Message:", msg
    ),

  reply: (char: string, reply: string, convId: string) =>
    console.log(
      "%c[VOX AI] %c← REPLY %c[%s]",
      STYLES.prefix, STYLES.reply, STYLES.char, char,
      "\n Conversation:", convId,
      "\n Reply:", reply
    ),

  error: (char: string, err: unknown) =>
    console.error(
      "%c[VOX AI] %c✕ ERROR %c[%s]",
      STYLES.prefix, STYLES.error, STYLES.char, char,
      "\n", err
    ),

  warning: (msg: string, detail: unknown) =>
    console.warn(
      "%c[VOX AI] %c⚠ WARNING",
      STYLES.prefix, STYLES.warning,
      "\n", msg, detail
    ),

  info: (label: string, detail?: unknown) =>
    console.log(
      "%c[VOX AI] %cℹ %s",
      STYLES.prefix, STYLES.info, label,
      ...(detail !== undefined ? ["\n", detail] : [])
    ),
};