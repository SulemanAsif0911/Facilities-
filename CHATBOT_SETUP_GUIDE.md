# Cyber Hayat PK — Live AI Chatbot Setup Guide

---

## WHAT YOU GET
A real Claude AI chatbot on your website that:
- Answers in English OR Urdu (automatically detects which the user writes in)
- Knows Pakistani laws (PECA 2016), FIA, NCCIA, DRF helplines
- Gives step-by-step guidance for each harassment type
- Shows typing dots animation while thinking
- Has 6 quick-topic buttons

---

## FILES PROVIDED

| File | What to do with it |
|------|--------------------|
| `chatbot-preview.html` | Open in browser to see the chatbot working first |
| `chatbot-section.html` | Copy the `<section>` block into your `features.html` |
| `chatbot-script-addition.js` | Copy the JS code block into your `script.js` |
| `CHATBOT_SETUP_GUIDE.md` | This file |

---

## STEP 1 — Get an Anthropic API Key (Free credits available)

1. Go to **https://console.anthropic.com**
2. Sign up for a free account
3. Click **API Keys** in the left sidebar
4. Click **Create Key** → give it a name like `CyberHayatPK`
5. Copy the key — it looks like: `sk-ant-api03-xxxxxxxxxx`
6. **Save it somewhere safe — you only see it once**

Free tier gives you $5 of credits — enough for thousands of chatbot messages.

---

## STEP 2 — Update features.html

1. Open your `features.html`
2. Find the entire block:
   ```html
   <section class="band dark-band" id="chatbot" ...>
     ...
   </section>
   ```
3. **Delete it entirely**
4. Open `chatbot-section.html`
5. Copy the `<section>` block and paste it in the same place

---

## STEP 3 — Update script.js

1. Open your `script.js`
2. Find the old chatbot section — it looks like:
   ```javascript
   // ── CHATBOT ───────────────────────────────────────────────
   const chatResponses = {
     blackmail: "Do NOT pay...",
     ...
   ```
3. **Delete that entire section** (from the comment to the closing `}`)
4. Open `chatbot-script-addition.js`
5. Copy the entire file contents
6. Paste it into `script.js` in the same place
7. Find line 5 of the pasted code:
   ```javascript
   const CHAT_API_KEY  = "PASTE_YOUR_ANTHROPIC_API_KEY_HERE";
   ```
8. Replace with your actual key:
   ```javascript
   const CHAT_API_KEY  = "sk-ant-api03-xxxxxxxxxx";
   ```

---

## STEP 4 — Add CSS to styles.css

1. Open `chatbot-section.html`
2. Scroll to the bottom — there is a block of CSS inside a comment
3. Copy all the CSS rules (everything between the `/* === ADD THIS CSS */` markers)
4. Open `styles.css`
5. Paste at the very bottom of the file

---

## STEP 5 — Test locally

1. Open `features.html` in your browser
2. Scroll to the chatbot section
3. Type a message or click a chip button
4. You should see the typing dots, then a real AI reply

---

## STEP 6 — Upload to GitHub Pages

Upload updated files:
- `features.html`
- `script.js`
- `styles.css`

---

## ⚠ IMPORTANT — API KEY SECURITY

**The Option A (direct API key in script.js) is fine for testing and for a low-traffic student project.**

However, your API key is visible in browser DevTools. Anyone who finds it could use your credits.

**To protect your key (Option B — recommended after launch):**

### Use Make.com as a proxy (free):

1. Create a Make.com scenario with a Webhook trigger
2. Add an HTTP module that calls `https://api.anthropic.com/v1/messages`
   - Method: POST
   - Headers: add `x-api-key: YOUR_KEY` and `anthropic-version: 2023-06-01`
   - Body: pass through the messages from the webhook
3. Add a Webhook Response module to return the reply
4. In `chatbot-script-addition.js`, set:
   ```javascript
   const CHAT_ENDPOINT = "https://hook.eu1.make.com/YOUR_WEBHOOK_ID";
   ```
5. Set `CHAT_API_KEY = ""` (leave empty — key is now only in Make.com)

This way your API key never appears in your website's code.

---

## COST ESTIMATE

The chatbot uses `claude-haiku-4-5` — the fastest and cheapest model.

| Usage | Approximate cost |
|-------|-----------------|
| 100 messages/day | ~$0.05/day |
| 1,000 messages/day | ~$0.50/day |
| $5 free credits | ~10,000 messages |

For a student awareness project, the free credits will last a very long time.

---

## TROUBLESHOOTING

**"Demo mode" message appears:**
→ You haven't pasted your API key yet. Check `CHAT_API_KEY` in `script.js`.

**"Connection issue" message:**
→ Your API key may be wrong, or you've run out of credits. Check console.anthropic.com.

**Chatbot doesn't appear:**
→ Check that you replaced the correct `<section id="chatbot">` block in `features.html`.

**Typing dots show but no response:**
→ Open browser DevTools → Console tab → look for a red error message → share it.

**API key error 401:**
→ Key is wrong or expired. Generate a new one at console.anthropic.com.

---

*Cyber Hayat PK — Stay Safe. Protect Yourself.*
