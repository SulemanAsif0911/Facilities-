// ============================================================
// CYBER HAYAT PK — Live AI Chatbot
// PASTE THIS BLOCK inside the IIFE in your script.js
// (Replace the old "── CHATBOT ──" section completely)
// ============================================================

// ── LIVE AI CHATBOT CONFIG ────────────────────────────────────
//
// OPTION A (Quick test — not for public site):
//   Paste your Anthropic API key below.
//   Get one free at: https://console.anthropic.com
//
// OPTION B (Recommended for public GitHub Pages site):
//   Use a Make.com webhook as a proxy — your key stays hidden.
//   Set CHAT_ENDPOINT to your Make.com webhook URL instead.
//   See CHATBOT_SETUP_GUIDE.md for full instructions.
//
const CHAT_API_KEY  = "PASTE_YOUR_ANTHROPIC_API_KEY_HERE";
const CHAT_ENDPOINT = ""; // Leave empty to use API directly, OR paste Make.com webhook URL

const CHAT_SYSTEM = `You are the AI support assistant for Cyber Hayat PK — a student-led cyber harassment awareness initiative in Pakistan at the University of Central Punjab (UCP).

Guide victims of cyber harassment step by step. Always reply in the same language the user writes in (Urdu or English).

Key rules:
- Tell users to SAVE EVIDENCE first before blocking or deleting anything
- For blackmail/sextortion: do NOT pay, do NOT send more content, call DRF 0800-39393
- For fake accounts: screenshot profile URL + messages, report inside platform, then file at complaint.fia.gov.pk
- For stalking: document timestamps, change privacy settings NOW
- For urgent safety: direct to 1043 (Punjab Women's Helpline) or 15 (Police) IMMEDIATELY

Pakistani legal references when relevant: PECA 2016, FIA Cybercrime Wing (9911), NCCIA (1799), DRF helpline (0800-39393), Punjab Women's Helpline (1043).

Keep replies to 3-5 sentences. Be calm and empathetic. Never ask for CNIC, home address, or full legal name.`;

// ── STATE ─────────────────────────────────────────────────────
const chatHistory = [];
let chatBusy = false;

// ── DOM ───────────────────────────────────────────────────────
const chatWin    = document.querySelector("#chatWindow");
const chatIn     = document.querySelector("#chatInput");
const chatBtn    = document.querySelector("#chatSendBtn");
const chatStatus = document.querySelector("#chatStatus");

// ── INIT ──────────────────────────────────────────────────────
if (chatWin) {
  chatAppend("assistant",
    "Assalam o Alaikum! I am the Cyber Hayat PK AI assistant. " +
    "Describe your situation in English or Urdu — I will guide you step by step. " +
    "Use the quick buttons below or type directly."
  );

  if (chatIn) {
    chatIn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatSend(); }
    });
    chatIn.addEventListener("input", () => {
      chatIn.style.height = "auto";
      chatIn.style.height = Math.min(chatIn.scrollHeight, 120) + "px";
    });
  }
}

// ── PUBLIC FUNCTIONS (called by HTML onclick) ─────────────────
window.chatChip = function(btn, text) {
  if (chatBusy || !chatIn) return;
  chatIn.value = text;
  chatSend();
};

window.chatSend = async function() {
  if (!chatIn || !chatWin) return;
  const text = chatIn.value.trim();
  if (!text || chatBusy) return;

  chatIn.value = "";
  chatIn.style.height = "auto";
  chatAppend("user", text);
  chatHistory.push({ role: "user", content: text });

  setChatBusy(true);
  const thinkEl = chatAppendThinking();

  try {
    const reply = await getChatReply(chatHistory);
    thinkEl.remove();
    chatAppend("assistant", reply);
    chatHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    thinkEl.remove();
    chatAppend("assistant",
      "Connection issue. For urgent help: 1043 (Punjab Women's Helpline), " +
      "1799 (NCCIA), or 9911 (FIA Cybercrime Wing)."
    );
    console.error("Chatbot error:", err);
  }

  setChatBusy(false);
};

// ── API CALL ──────────────────────────────────────────────────
async function getChatReply(messages) {

  // OPTION B: route through Make.com webhook (key hidden)
  if (CHAT_ENDPOINT) {
    const res = await fetch(CHAT_ENDPOINT + "?data=" + encodeURIComponent(JSON.stringify({
      type: "chat",
      messages: messages.slice(-10),
      system: CHAT_SYSTEM
    })));
    if (!res.ok) throw new Error("Proxy error " + res.status);
    const data = await res.json();
    return data.reply || data.content || "No response received.";
  }

  // OPTION A: call Anthropic API directly
  if (!CHAT_API_KEY || CHAT_API_KEY === "PASTE_YOUR_ANTHROPIC_API_KEY_HERE") {
    await new Promise(r => setTimeout(r, 1200));
    return (
      "Demo mode — API key not connected yet. " +
      "For real help right now: call 1043 (Punjab Women's Helpline), " +
      "1799 (NCCIA), or 9911 (FIA). " +
      "Follow the setup guide to activate the AI."
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CHAT_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-client-side-key-allowlist": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: CHAT_SYSTEM,
      messages: messages.slice(-10)
    })
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || "API error " + res.status);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "No response. Please try again.";
}

// ── UI HELPERS ────────────────────────────────────────────────
function chatAppend(role, text) {
  if (!chatWin) return null;
  const el = document.createElement("div");
  el.className = `message ${role}`;
  el.textContent = text;
  chatWin.appendChild(el);
  chatWin.scrollTop = chatWin.scrollHeight;
  return el;
}

function chatAppendThinking() {
  if (!chatWin) return document.createElement("div");
  const el = document.createElement("div");
  el.className = "message thinking";
  el.innerHTML = `<span class="dots"><span></span><span></span><span></span></span>`;
  chatWin.appendChild(el);
  chatWin.scrollTop = chatWin.scrollHeight;
  return el;
}

function setChatBusy(on) {
  chatBusy = on;
  if (chatBtn) chatBtn.disabled = on;
  if (chatIn) chatIn.disabled = on;
  if (chatStatus) chatStatus.textContent = on ? "AI is thinking…" : "";
  document.querySelectorAll("#chipsBar .chip-button").forEach(b => b.disabled = on);
}

// ── END OF CHATBOT SECTION ────────────────────────────────────
