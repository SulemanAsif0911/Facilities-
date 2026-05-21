(() => {
  const markMissingImage = (image) => {
    image.classList.add("missing-media");
    image.alt = "";
  };

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => markMissingImage(image), { once: true });
    if (image.complete && image.naturalWidth === 0) {
      markMissingImage(image);
    }
  });

  const copyButtons = document.querySelectorAll("[data-copy]");
  const activeTimeouts = new Map();

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback failed to copy text: ", err);
    }

    document.body.removeChild(textArea);
  };

  copyButtons.forEach((button) => {
    if (!button.hasAttribute("aria-live")) {
      button.setAttribute("aria-live", "polite");
    }

    button.addEventListener("click", async () => {
      const number = button.dataset.copy;
      const originalText = "Copy";
      if (!number) return;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(number);
          button.textContent = "Copied!";
        } catch {
          fallbackCopyText(number);
          button.textContent = "Copied!";
        }
      } else {
        fallbackCopyText(number);
        button.textContent = "Copied!";
      }

      if (activeTimeouts.has(button)) {
        clearTimeout(activeTimeouts.get(button));
      }

      const timeoutId = window.setTimeout(() => {
        button.textContent = originalText;
        activeTimeouts.delete(button);
      }, 1400);
      activeTimeouts.set(button, timeoutId);
    });
  });

  const storageKey = "cyberHayatIncidentDrafts";
  let latestIncidentText = "";
  let latestLetterText = "";

  const getValue = (selector) => document.querySelector(selector)?.value.trim() || "";

  const readReports = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  };

  const saveReports = (reports) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reports));
      return true;
    } catch {
      return false;
    }
  };

  const downloadTextFile = (filename, text) => {
    if (!text.trim()) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const makeIncidentText = (report) => (
    `Cyber Hayat PK anonymous incident draft\n\n` +
    `Draft ID: ${report.id}\n` +
    `Created: ${report.createdAt}\n` +
    `Type: ${report.type}\n` +
    `Platform: ${report.platform || "Not provided"}\n` +
    `Approximate date: ${report.date || "Not provided"}\n` +
    `Safe contact: ${report.contact || "Not provided"}\n\n` +
    `Description:\n${report.description}\n\n` +
    `Reminder: This is a private website draft. Submit through official channels when ready.`
  );

  const incidentForm = document.querySelector("#incidentForm");
  const incidentResult = document.querySelector("#incidentResult");
  const exportIncident = document.querySelector("#exportIncident");

  if (incidentForm && incidentResult) {
    incidentForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const createdAt = new Date().toLocaleString();
      const dateStamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      const id = `CHPK-${dateStamp}-${Math.floor(1000 + Math.random() * 9000)}`;
      const report = {
        id,
        createdAt,
        type: getValue("#incidentType"),
        platform: getValue("#incidentPlatform"),
        date: getValue("#incidentDate"),
        contact: getValue("#incidentContact"),
        description: getValue("#incidentDescription"),
        status: "Private draft saved on this browser",
      };

      const reports = readReports();
      reports.unshift(report);
      const saved = saveReports(reports.slice(0, 20));
      latestIncidentText = makeIncidentText(report);

      incidentResult.textContent = saved
        ? `Draft saved locally.\nCase ID: ${id}\nNext step: export this draft, save your evidence, and use official portals when safe.`
        : `Draft created, but browser storage was unavailable.\nCase ID: ${id}\nUse Export Draft now if you want to keep a copy.`;

      const trackerInput = document.querySelector("#trackerInput");
      if (trackerInput) trackerInput.value = id;
    });
  }

  if (exportIncident) {
    exportIncident.addEventListener("click", () => {
      if (!latestIncidentText) {
        const reports = readReports();
        latestIncidentText = reports[0] ? makeIncidentText(reports[0]) : "";
      }

      if (!latestIncidentText && incidentResult) {
        incidentResult.textContent = "Save a report draft first, then export it.";
        return;
      }

      downloadTextFile("cyber-hayat-incident-draft.txt", latestIncidentText);
    });
  }

  const timelineSteps = [
    "Save evidence before blocking or deleting messages.",
    "Submit the complaint through the official NCCIA/FIA portal or office.",
    "Keep the acknowledgement number and any email or SMS replies.",
    "Follow up with the official office or helpline if there is no response.",
    "Update passwords, privacy settings, and trusted contacts.",
  ];

  const renderTimeline = (activeIndex) => {
    const trackerTimeline = document.querySelector("#trackerTimeline");
    if (!trackerTimeline) return;

    trackerTimeline.innerHTML = "";
    timelineSteps.forEach((step, index) => {
      const item = document.createElement("li");
      item.textContent = step;
      if (index <= activeIndex) item.classList.add("is-active");
      trackerTimeline.appendChild(item);
    });
  };

  const trackButton = document.querySelector("#trackButton");
  const trackerOutput = document.querySelector("#trackerOutput");

  if (trackButton && trackerOutput) {
    trackButton.addEventListener("click", () => {
      const id = getValue("#trackerInput").toUpperCase();
      const reports = readReports();
      const found = reports.find((report) => report.id.toUpperCase() === id);

      if (found) {
        trackerOutput.textContent =
          `Local draft found.\nStatus: ${found.status}\nType: ${found.type}\nCreated: ${found.createdAt}\nSuggested next step: export the draft and submit through an official complaint channel when safe.`;
        renderTimeline(1);
        return;
      }

      trackerOutput.textContent =
        "No local draft was found for this ID. If this is an NCCIA/FIA acknowledgement number, keep checking the official portal, email/SMS replies, or helpline. This website cannot read government case databases.";
      renderTimeline(2);
    });
  }

  renderTimeline(0);

  const chatWindow = document.querySelector("#chatWindow");
  const chatResponses = {
    blackmail:
      "Do not pay, do not send more material, and do not argue. Save every threat, username, phone number, payment demand, and link. Tell one trusted person. If intimate content or physical danger is involved, use official support urgently.",
    fake:
      "Copy the fake profile link, screenshot the profile, bio, posts, followers, and messages. Report the profile inside the platform, warn close contacts privately, and keep the official complaint option ready if identity misuse continues.",
    stalking:
      "Document the pattern before blocking: repeated messages, accounts used, dates, screenshots, and call logs. Tighten privacy settings, remove public location details, and ask trusted people not to share your information.",
    doxing:
      "Save the public post and comments, then report it to the platform as private information. Tell trusted family or campus staff if your address, phone number, or routine was exposed. Escalate urgent safety risk immediately.",
    urgent:
      "If you feel physically unsafe, move near trusted people and contact local emergency help first. Online reporting can wait until you are safe. Save evidence only if it does not put you at more risk.",
  };

  const addChatMessage = (role, text) => {
    if (!chatWindow) return;
    const message = document.createElement("div");
    message.className = `message ${role}`;
    message.textContent = text;
    chatWindow.appendChild(message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  if (chatWindow) {
    addChatMessage(
      "assistant",
      "Assalam o Alaikum. Choose the situation closest to yours and I will show the safest first steps."
    );

    document.querySelectorAll("[data-chat-topic]").forEach((button) => {
      button.addEventListener("click", () => {
        const topic = button.dataset.chatTopic;
        addChatMessage("user", button.textContent.trim());
        addChatMessage("assistant", chatResponses[topic] || "Save evidence, secure your accounts, and contact trusted support.");
      });
    });
  }

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      const language = button.dataset.language;
      document.body.dataset.language = language;
      document.querySelectorAll("[data-language]").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.language === language);
      });
    });
  });

  const checklistData = {
    stalking: [
      "Screenshots of repeated messages or calls",
      "Profile links and usernames of every account involved",
      "Dates, times, and frequency of contact",
      "Any threats, location tracking, or attempts to contact friends/family",
      "Privacy settings changed after the incident",
    ],
    sextortion: [
      "All threats and demands exactly as received",
      "Phone numbers, wallet details, bank details, or payment requests",
      "Profile links, usernames, and screenshots",
      "Dates and times of blackmail attempts",
      "Do not send more content or money",
    ],
    impersonation: [
      "Fake profile URL",
      "Screenshots of profile photo, bio, posts, and messages",
      "Proof of your original account or identity ownership",
      "Reports submitted to the platform",
      "Names of people contacted by the fake account",
    ],
    doxing: [
      "Public post URL where private information appeared",
      "Screenshots showing your exposed data",
      "Comments, shares, or threats connected to the leak",
      "Records of platform takedown requests",
      "Safety steps taken offline",
    ],
    bullying: [
      "Screenshots of threats, insults, or coordinated abuse",
      "Links to posts, groups, or comment threads",
      "Names/usernames of accounts involved",
      "Impact notes such as school, workplace, or family pressure",
      "Trusted person informed and privacy settings updated",
    ],
  };

  const buildChecklist = document.querySelector("#buildChecklist");
  const checklistOutput = document.querySelector("#checklistOutput");

  const renderChecklist = () => {
    if (!checklistOutput) return;
    const type = document.querySelector("#evidenceType")?.value || "stalking";
    const items = checklistData[type] || checklistData.stalking;
    checklistOutput.innerHTML = "";
    const list = document.createElement("ul");
    list.className = "checklist";
    items.forEach((text) => {
      const item = document.createElement("li");
      const label = document.createElement("label");
      label.className = "checkbox-row";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const span = document.createElement("span");
      span.textContent = text;
      label.append(checkbox, span);
      item.appendChild(label);
      list.appendChild(item);
    });
    checklistOutput.appendChild(list);
  };

  if (buildChecklist) {
    buildChecklist.addEventListener("click", renderChecklist);
    renderChecklist();
  }

  const passwordInput = document.querySelector("#passwordInput");
  const passwordFeedback = document.querySelector("#passwordFeedback");
  const passwordMeter = document.querySelector("#passwordMeter");

  const updatePasswordScore = () => {
    if (!passwordInput || !passwordFeedback || !passwordMeter) return;
    const value = passwordInput.value;
    let score = 0;
    if (value.length >= 10) score += 1;
    if (value.length >= 14) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    if (/(password|123456|qwerty|pakistan|cyber)/i.test(value)) score -= 1;
    score = Math.max(0, Math.min(score, 5));

    const width = score * 20;
    const color = score >= 4 ? "var(--green)" : score >= 3 ? "var(--amber)" : "var(--red)";
    const label = score >= 4 ? "Strong" : score >= 3 ? "Medium" : "Weak";
    passwordMeter.style.setProperty("--meter-width", `${width}%`);
    passwordMeter.style.setProperty("--meter-color", color);
    passwordFeedback.textContent = value
      ? `${label} password pattern. Improve it with 14+ characters, mixed case, numbers, symbols, and unique use per account.`
      : "Password feedback will appear here.";
  };

  if (passwordInput) {
    passwordInput.addEventListener("input", updatePasswordScore);
  }

  const auditForm = document.querySelector("#auditForm");
  const auditResult = document.querySelector("#auditResult");

  const updateAudit = () => {
    if (!auditForm || !auditResult) return;
    const checked = auditForm.querySelectorAll("input:checked").length;
    const total = auditForm.querySelectorAll("input").length;
    const percent = Math.round((checked / total) * 100);
    const status = percent >= 75 ? "Good" : percent >= 50 ? "Needs improvement" : "High risk";
    auditResult.textContent = `${status}: ${checked}/${total} safety habits checked (${percent}%).`;
  };

  if (auditForm) {
    auditForm.addEventListener("change", updateAudit);
    updateAudit();
  }

  const letterForm = document.querySelector("#letterForm");
  const letterPreview = document.querySelector("#letterPreview");
  const downloadLetter = document.querySelector("#downloadLetter");

  const buildLetter = () => {
    const today = new Date().toLocaleDateString();
    const name = getValue("#letterName") || "[Your Name]";
    const city = getValue("#letterCity") || "[City]";
    const type = getValue("#letterType") || "[Incident Type]";
    const platform = getValue("#letterPlatform") || "[Platform]";
    const accused = getValue("#letterAccused") || "[Account / phone / identifier]";
    const date = getValue("#letterDate") || "[Incident Date]";
    const summary = getValue("#letterSummary") || "[Briefly explain what happened.]";
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
    letterForm.addEventListener("submit", (event) => {
      event.preventDefault();
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

  const storyForm = document.querySelector("#storyForm");
  const storyResult = document.querySelector("#storyResult");

  if (storyForm && storyResult) {
    storyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const theme = getValue("#storyTheme") || "Anonymous experience";
      const outcome = getValue("#storyOutcome") || "Support received";
      const story = getValue("#storyText") || "No story text added.";
      storyResult.textContent = `Story draft added locally.\nTheme: ${theme}\nOutcome: ${outcome}\n\n${story}`;
      storyForm.reset();
    });
  }

  const ambassadorForm = document.querySelector("#ambassadorForm");
  const ambassadorResult = document.querySelector("#ambassadorResult");

  if (ambassadorForm && ambassadorResult) {
    ambassadorForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = getValue("#ambassadorName") || "Student";
      const campus = getValue("#ambassadorCampus") || "Campus not provided";
      const city = getValue("#ambassadorCity") || "City not provided";
      ambassadorResult.textContent = `Ambassador draft saved locally.\nName: ${name}\nCampus: ${campus}\nCity: ${city}\nNext step: connect this form to a secure form service before collecting real applications.`;
      ambassadorForm.reset();
    });
  }

  const whatsappMessage = document.querySelector("#whatsappMessage");
  const whatsappLink = document.querySelector("#whatsappLink");

  const updateWhatsAppLink = () => {
    if (!whatsappMessage || !whatsappLink) return;
    whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(whatsappMessage.value)}`;
  };

  if (whatsappMessage) {
    whatsappMessage.addEventListener("input", updateWhatsAppLink);
    updateWhatsAppLink();
  }
})();
