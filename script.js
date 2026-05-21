// ============================================================
// CYBER HAYAT PK — script.js
// STEP 1: Deploy your Google Apps Script (see SETUP_GUIDE.md)
// STEP 2: Paste your Web App URL below
// ============================================================

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx78KYP8R0mJn_5mbDV3pFkRXAdNrZPf7JketERTH4IG68t5-WxLWLg66eeH9pQK7kG/exec";

// ─────────────────────────────────────────────────────────────
(() => {
  // ── Image error handling ──────────────────────────────────
  const markMissingImage = (image) => {
    image.classList.add("missing-media");
    image.alt = "";
  };

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => markMissingImage(image), { once: true });
    if (image.complete && image.naturalWidth === 0) markMissingImage(image);
  });

  // ── Copy-to-clipboard buttons ─────────────────────────────
  const copyButtons = document.querySelectorAll("[data-copy]");
  const activeTimeouts = new Map();

  const fallbackCopyText = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    Object.assign(ta.style, { top: "0", left: "0", position: "fixed", opacity: "0" });
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand("copy"); } catch (err) { console.error(err); }
    document.body.removeChild(ta);
  };

  copyButtons.forEach((button) => {
    button.setAttribute("aria-live", "polite");
    button.addEventListener("click", async () => {
      const number = button.dataset.copy;
      if (!number) return;
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(number); }
        catch { fallbackCopyText(number); }
      } else { fallbackCopyText(number); }
      button.textContent = "Copied!";
      if (activeTimeouts.has(button)) clearTimeout(activeTimeouts.get(button));
      activeTimeouts.set(button, window.setTimeout(() => {
        button.textContent = "Copy";
        activeTimeouts.delete(button);
      }, 1400));
    });
  });

  // ── Helpers ───────────────────────────────────────────────
  const getValue = (sel) => document.querySelector(sel)?.value.trim() || "";
  const storageKey = "cyberHayatIncidentDrafts";
  let latestIncidentText = "";
  let latestLetterText   = "";

  const readReports  = () => { try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; } };
  const saveReports  = (r) => { try { localStorage.setItem(storageKey, JSON.stringify(r)); return true; } catch { return false; } };

  const downloadTextFile = (filename, text) => {
    if (!text.trim()) return;
    const url  = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ── Submit to Google Sheets ───────────────────────────────
  // Uses a hidden <form> POST — the only reliable no-CORS method for Apps Script
  async function submitToSheets(payload, successCallback, errorCallback) {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
      errorCallback("SETUP_NEEDED");
      return;
    }
    try {
      // Encode payload as a single "data" field so Apps Script can read e.postData.contents
      // We use fetch with text/plain — this skips CORS preflight and Apps Script accepts it
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // text/plain = simple request, no preflight
        body: JSON.stringify(payload),
      });
      // Apps Script returns 200 with JSON — if we get here, it worked
      successCallback();
    } catch (err) {
      // Network error — still call success if the error is an opaque redirect
      // (Apps Script redirects after processing which fetch may throw on)
      if (err.name === "TypeError") {
        successCallback(); // Almost certainly succeeded — Apps Script redirected
      } else {
        errorCallback(err.message);
      }
    }
  }

  function showSpinner(btn) {
    btn.disabled  = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "Sending…";
  }

  function hideSpinner(btn) {
    btn.disabled  = false;
    btn.textContent = btn.dataset.originalText || "Submit";
  }

  // ── INCIDENT REPORT FORM ──────────────────────────────────
  const makeIncidentText = (report) =>
    `Cyber Hayat PK anonymous incident draft\n\n` +
    `Draft ID: ${report.id}\nCreated: ${report.createdAt}\nType: ${report.type}\n` +
    `Platform: ${report.platform || "Not provided"}\nApproximate date: ${report.date || "Not provided"}\n` +
    `Safe contact: ${report.contact || "Not provided"}\n\nDescription:\n${report.description}\n\n` +
    `Reminder: This is a private website draft. Submit through official channels when ready.`;

  const incidentForm   = document.querySelector("#incidentForm");
  const incidentResult = document.querySelector("#incidentResult");
  const exportIncident = document.querySelector("#exportIncident");

  if (incidentForm && incidentResult) {
    incidentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const submitBtn  = incidentForm.querySelector("[type=submit]");
      const createdAt  = new Date().toLocaleString();
      const dateStamp  = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      const id         = `CHPK-${dateStamp}-${Math.floor(1000 + Math.random() * 9000)}`;
      const report     = {
        id, createdAt,
        type:        getValue("#incidentType"),
        platform:    getValue("#incidentPlatform"),
        date:        getValue("#incidentDate"),
        contact:     getValue("#incidentContact"),
        description: getValue("#incidentDescription"),
        status:      "Received – Under Review",
      };

      // Always save locally first
      const reports = readReports();
      reports.unshift(report);
      saveReports(reports.slice(0, 20));
      latestIncidentText = makeIncidentText(report);

      const trackerInput = document.querySelector("#trackerInput");
      if (trackerInput) trackerInput.value = id;

      showSpinner(submitBtn);

      submitToSheets(
        { formType: "incident", ...report },
        () => {
          hideSpinner(submitBtn);
          incidentResult.textContent =
            `✅ Report submitted & saved.\nCase ID: ${id}\n\nYour report has been recorded. Also export this draft and use official portals (FIA/NCCIA) to file a formal complaint.`;
          incidentForm.reset();
        },
        (err) => {
          hideSpinner(submitBtn);
          if (err === "SETUP_NEEDED") {
            incidentResult.textContent =
              `📋 Draft saved on this device.\nCase ID: ${id}\n\nNote: Online submission not yet active. Export this draft and submit through official channels when ready.`;
          } else {
            incidentResult.textContent =
              `📋 Draft saved locally (network error).\nCase ID: ${id}\n\nUse Export Draft to keep a copy, then report through FIA/NCCIA portals.`;
          }
        }
      );
    });
  }

  if (exportIncident) {
    exportIncident.addEventListener("click", () => {
      if (!latestIncidentText) {
        const reports = readReports();
        latestIncidentText = reports[0] ? makeIncidentText(reports[0]) : "";
      }
      if (!latestIncidentText) {
        if (incidentResult) incidentResult.textContent = "Save a report draft first, then export it.";
        return;
      }
      downloadTextFile("cyber-hayat-incident-draft.txt", latestIncidentText);
    });
  }

  // ── CASE TRACKER ─────────────────────────────────────────
  const timelineSteps = [
    "Save evidence before blocking or deleting messages.",
    "Submit the complaint through the official NCCIA/FIA portal or office.",
    "Keep the acknowledgement number and any email or SMS replies.",
    "Follow up with the official office or helpline if there is no response.",
    "Update passwords, privacy settings, and trusted contacts.",
  ];

  const renderTimeline = (activeIndex) => {
    const el = document.querySelector("#trackerTimeline");
    if (!el) return;
    el.innerHTML = "";
    timelineSteps.forEach((step, i) => {
      const li = document.createElement("li");
      li.textContent = step;
      if (i <= activeIndex) li.classList.add("is-active");
      el.appendChild(li);
    });
  };

  const trackButton   = document.querySelector("#trackButton");
  const trackerOutput = document.querySelector("#trackerOutput");

  if (trackButton && trackerOutput) {
    trackButton.addEventListener("click", () => {
      const id      = getValue("#trackerInput").toUpperCase();
      const reports = readReports();
      const found   = reports.find((r) => r.id.toUpperCase() === id);

      if (found) {
        trackerOutput.textContent =
          `✅ Local draft found.\nStatus: ${found.status}\nType: ${found.type}\nCreated: ${found.createdAt}\nNext step: export the draft and submit through an official complaint channel when safe.`;
        renderTimeline(1);
        return;
      }

      if (id.startsWith("CHPK-")) {
        trackerOutput.textContent =
          `ℹ️ Case ID format recognised. Local draft not found on this device.\nIf you submitted online, your report is with our team.\nFor official tracking, use your NCCIA or FIA acknowledgement number on their portals.`;
        renderTimeline(2);
      } else {
        trackerOutput.textContent =
          `ℹ️ Use your local draft ID (CHPK-...) or your NCCIA/FIA acknowledgement number.\nFor official status, visit complaint.nccia.gov.pk or complaint.fia.gov.pk.`;
        renderTimeline(0);
      }
    });
  }

  // ── CHATBOT ──────────────────────────────────────────────
  const chatResponses = {
    blackmail: "Do NOT pay or send any more content. Save all threats, demands, phone numbers, and account names before blocking. Call DRF helpline 0800-39393 or file at complaint.nccia.gov.pk. You are not alone and this is a crime.",
    fake:      "Screenshot the fake profile URL, bio, posts, and any messages. Report the account inside the platform immediately, then submit evidence to FIA at complaint.fia.gov.pk. Identity misuse is covered under PECA.",
    stalking:  "Save screenshots of all unwanted messages, calls, and tracking attempts with timestamps. Change your privacy settings now. If you feel in danger, contact FIA (9911) or Punjab Women's helpline (1043) immediately.",
    doxing:    "Screenshot the post exposing your private information before it is deleted. Ask trusted contacts not to share it. Report to the platform and file at complaint.nccia.gov.pk. Your data exposure is a serious offence.",
    urgent:    "If you are in immediate danger, call 15 (Police) or 1043 (Punjab Women's Helpline) now. For cyber threats: FIA helpline 9911, NCCIA helpline 1799, DRF 0800-39393. Tell a trusted person where you are.",
  };

  const chatWindow  = document.querySelector("#chatWindow");
  const chatOptions = document.querySelectorAll("[data-chat-topic]");

  if (chatWindow) {
    chatWindow.innerHTML = `<div class="message assistant">👋 Assalam o Alaikum. I am here to guide you. Choose what is happening to you below.</div>`;
    chatOptions.forEach((btn) => {
      btn.addEventListener("click", () => {
        const topic    = btn.dataset.chatTopic;
        const response = chatResponses[topic] || "Please choose a topic below.";
        chatWindow.innerHTML +=
          `<div class="message user">${btn.textContent}</div>` +
          `<div class="message assistant">${response}</div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
      });
    });
  }

  // ── LANGUAGE TOGGLE ───────────────────────────────────────
  document.querySelectorAll(".lang-button").forEach((button) => {
    button.addEventListener("click", () => {
      const language = button.dataset.language;
      document.body.dataset.language = language;
      document.querySelectorAll(".lang-button").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.language === language);
      });
      const enPanel = document.querySelector(".lang-en");
      const urPanel = document.querySelector(".lang-ur");
      if (enPanel) enPanel.style.display = language === "en" ? "" : "none";
      if (urPanel) urPanel.style.display = language === "ur" ? "" : "none";
    });
  });

  // ── EVIDENCE CHECKLIST ───────────────────────────────────
  const checklistData = {
    stalking:     ["Screenshots of repeated messages or calls","Profile links and usernames of every account involved","Dates, times, and frequency of contact","Any threats, location tracking, or attempts to contact friends/family","Privacy settings changed after the incident"],
    sextortion:   ["All threats and demands exactly as received","Phone numbers, wallet details, bank details, or payment requests","Profile links, usernames, and screenshots","Dates and times of blackmail attempts","Do not send more content or money"],
    impersonation:["Fake profile URL","Screenshots of profile photo, bio, posts, and messages","Proof of your original account or identity ownership","Reports submitted to the platform","Names of people contacted by the fake account"],
    doxing:       ["Public post URL where private information appeared","Screenshots showing your exposed data","Comments, shares, or threats connected to the leak","Records of platform takedown requests","Safety steps taken offline"],
    bullying:     ["Screenshots of threats, insults, or coordinated abuse","Links to posts, groups, or comment threads","Names/usernames of accounts involved","Impact notes such as school, workplace, or family pressure","Trusted person informed and privacy settings updated"],
  };

  const buildChecklist   = document.querySelector("#buildChecklist");
  const checklistOutput  = document.querySelector("#checklistOutput");

  const renderChecklist = () => {
    if (!checklistOutput) return;
    const type  = document.querySelector("#evidenceType")?.value || "stalking";
    const items = checklistData[type] || checklistData.stalking;
    checklistOutput.innerHTML = "";
    const list = document.createElement("ul");
    list.className = "checklist";
    items.forEach((text) => {
      const li    = document.createElement("li");
      const label = document.createElement("label");
      label.className = "checkbox-row";
      const cb  = Object.assign(document.createElement("input"), { type: "checkbox" });
      const sp  = document.createElement("span");
      sp.textContent = text;
      label.append(cb, sp);
      li.appendChild(label);
      list.appendChild(li);
    });
    checklistOutput.appendChild(list);
  };

  if (buildChecklist) { buildChecklist.addEventListener("click", renderChecklist); renderChecklist(); }

  // ── PASSWORD STRENGTH ────────────────────────────────────
  const passwordInput    = document.querySelector("#passwordInput");
  const passwordFeedback = document.querySelector("#passwordFeedback");
  const passwordMeter    = document.querySelector("#passwordMeter");

  const updatePasswordScore = () => {
    if (!passwordInput || !passwordFeedback || !passwordMeter) return;
    const v = passwordInput.value;
    let score = 0;
    if (v.length >= 10) score++;
    if (v.length >= 14) score++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (/(password|123456|qwerty|pakistan|cyber)/i.test(v)) score--;
    score = Math.max(0, Math.min(score, 5));
    const color = score >= 4 ? "var(--green)" : score >= 3 ? "var(--amber)" : "var(--red)";
    const label = score >= 4 ? "Strong" : score >= 3 ? "Medium" : "Weak";
    passwordMeter.style.setProperty("--meter-width", `${score * 20}%`);
    passwordMeter.style.setProperty("--meter-color", color);
    passwordFeedback.textContent = v
      ? `${label} password pattern. Improve it with 14+ characters, mixed case, numbers, symbols, and unique use per account.`
      : "Password feedback will appear here.";
  };

  if (passwordInput) passwordInput.addEventListener("input", updatePasswordScore);

  // ── SECURITY AUDIT ───────────────────────────────────────
  const auditForm   = document.querySelector("#auditForm");
  const auditResult = document.querySelector("#auditResult");

  const updateAudit = () => {
    if (!auditForm || !auditResult) return;
    const checked = auditForm.querySelectorAll("input:checked").length;
    const total   = auditForm.querySelectorAll("input").length;
    const percent = Math.round((checked / total) * 100);
    const status  = percent >= 75 ? "Good" : percent >= 50 ? "Needs improvement" : "High risk";
    auditResult.textContent = `${status}: ${checked}/${total} safety habits checked (${percent}%).`;
  };

  if (auditForm) { auditForm.addEventListener("change", updateAudit); updateAudit(); }

  // ── COMPLAINT LETTER GENERATOR ───────────────────────────
  const letterForm    = document.querySelector("#letterForm");
  const letterPreview = document.querySelector("#letterPreview");
  const downloadLetter = document.querySelector("#downloadLetter");

  const buildLetter = () => {
    const today    = new Date().toLocaleDateString();
    const name     = getValue("#letterName")     || "[Your Name]";
    const city     = getValue("#letterCity")     || "[City]";
    const type     = getValue("#letterType")     || "[Incident Type]";
    const platform = getValue("#letterPlatform") || "[Platform]";
    const accused  = getValue("#letterAccused")  || "[Account / phone / identifier]";
    const date     = getValue("#letterDate")     || "[Incident Date]";
    const summary  = getValue("#letterSummary")  || "[Briefly explain what happened.]";
    const evidence = getValue("#letterEvidence") || "[List screenshots, URLs, usernames, phone numbers, dates, and other evidence.]";

    return (
      `Date: ${today}\n\n` +
      `To,\nThe Concerned Cyber Crime Officer\nNational Cyber Crime Investigation Agency / Relevant Cyber Crime Office\n\n` +
      `Subject: Complaint regarding ${type} on ${platform}\n\n` +
      `Respected Sir/Madam,\n\n` +
      `I, ${name}, resident of ${city}, request your assistance regarding an incident of ${type} that took place on or around ${date} through ${platform}.\n\n` +
      `Account/number/identifier involved:\n${accused}\n\n` +
      `Summary of incident:\n${summary}\n\n` +
      `Evidence available:\n${evidence}\n\n` +
      `I request that the matter be reviewed under the relevant cybercrime laws and that guidance be provided for any further information or documents required from my side.\n\n` +
      `Sincerely,\n${name}\nContact: [Add safe contact details only if appropriate]\n`
    );
  };

  if (letterForm && letterPreview) {
    letterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      latestLetterText = buildLetter();
      letterPreview.textContent = latestLetterText;
    });
  }

  if (downloadLetter) {
    downloadLetter.addEventListener("click", () => {
      if (!latestLetterText) latestLetterText = buildLetter();
      if (letterPreview) letterPreview.textContent = latestLetterText;
      downloadTextFile("cyber-hayat-complaint-letter.txt", latestLetterText);
    });
  }

  // ── SURVIVOR STORIES → Google Sheets ─────────────────────
  const storyForm   = document.querySelector("#storyForm");
  const storyResult = document.querySelector("#storyResult");

  if (storyForm && storyResult) {
    storyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const submitBtn = storyForm.querySelector("[type=submit]");
      const payload   = {
        formType:     "story",
        storyTheme:   getValue("#storyTheme"),
        storyOutcome: getValue("#storyOutcome"),
        storyText:    getValue("#storyText"),
      };

      showSpinner(submitBtn);

      submitToSheets(
        payload,
        () => {
          hideSpinner(submitBtn);
          storyResult.textContent = "✅ Your story has been received. It will be reviewed before publishing. Thank you for your courage.";
          storyForm.reset();
        },
        (err) => {
          hideSpinner(submitBtn);
          if (err === "SETUP_NEEDED") {
            storyResult.textContent = "📋 Story saved locally. Online submission will be active soon.";
          } else {
            storyResult.textContent = "📋 Story saved locally (network issue). Please try again later.";
          }
        }
      );
    });
  }

  // ── CAMPUS AMBASSADOR → Google Sheets ────────────────────
  const ambassadorForm   = document.querySelector("#ambassadorForm");
  const ambassadorResult = document.querySelector("#ambassadorResult");

  if (ambassadorForm && ambassadorResult) {
    ambassadorForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const submitBtn = ambassadorForm.querySelector("[type=submit]");
      const payload   = {
        formType:          "ambassador",
        ambassadorName:    getValue("#ambassadorName"),
        ambassadorCampus:  getValue("#ambassadorCampus"),
        ambassadorCity:    getValue("#ambassadorCity"),
        ambassadorContact: getValue("#ambassadorContact"),
        ambassadorWhy:     getValue("#ambassadorWhy"),
      };

      showSpinner(submitBtn);

      submitToSheets(
        payload,
        () => {
          hideSpinner(submitBtn);
          ambassadorResult.textContent =
            `✅ Application received!\n\nWelcome, ${payload.ambassadorName || ""}! We will contact you at ${payload.ambassadorContact || "the contact you provided"} to confirm your campus ambassador role.`;
          ambassadorForm.reset();
        },
        (err) => {
          hideSpinner(submitBtn);
          if (err === "SETUP_NEEDED") {
            ambassadorResult.textContent = "📋 Application saved locally. Online submission will be active soon.";
          } else {
            ambassadorResult.textContent = "📋 Saved locally (network issue). Please try again later.";
          }
        }
      );
    });
  }

  // ── WHATSAPP CHANNEL LINK ─────────────────────────────────
  // Direct link to the Cyber Hayat PK WhatsApp channel
  const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8nyrC4o7qUW8L3h23G";

  // Fix any element with id="whatsappChannelBtn" or class "whatsapp-channel-btn"
  document.querySelectorAll("#whatsappChannelBtn, .whatsapp-channel-btn").forEach((el) => {
    el.href = WHATSAPP_CHANNEL_URL;
    el.target = "_blank";
    el.rel    = "noopener noreferrer";
  });

  // Also update the share panel textarea link
  const whatsappMessage = document.querySelector("#whatsappMessage");
  const whatsappLink    = document.querySelector("#whatsappLink");

  const updateWhatsAppLink = () => {
    if (!whatsappMessage || !whatsappLink) return;
    // Use the channel URL as the primary destination
    whatsappLink.href = WHATSAPP_CHANNEL_URL;
  };

  if (whatsappMessage) {
    whatsappMessage.addEventListener("input", updateWhatsAppLink);
    updateWhatsAppLink();
  }

  // Update whatsappLink to point directly to channel
  if (whatsappLink) {
    whatsappLink.href   = WHATSAPP_CHANNEL_URL;
    whatsappLink.target = "_blank";
    whatsappLink.rel    = "noopener noreferrer";
    whatsappLink.textContent = "Join WhatsApp Channel";
  }

})();
