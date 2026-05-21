const lectures = window.LECTURES || [];

const player = document.querySelector("#player");
const currentTitle = document.querySelector("#currentTitle");
const currentLecture = document.querySelector("#currentLecture");
const playlistList = document.querySelector("#playlistList");
const searchInput = document.querySelector("#searchInput");
const lectureFilters = document.querySelector("#lectureFilters");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");
const autoplayToggle = document.querySelector("#autoplayToggle");
const lectureCount = document.querySelector("#lectureCount");
const sourceMode = document.querySelector("#sourceMode");

let activeIndex = 0;
let selectedLecture = "all";
let query = "";

const isFileMode = window.location.protocol === "file:";
sourceMode.textContent = isFileMode ? "File playback mode" : "Local media server";
lectureCount.textContent = `${lectures.length} clips`;

function sourceFor(item) {
  return isFileMode ? item.sourceUrl : item.mediaUrl;
}

function normalize(value) {
  return String(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function filteredLectures() {
  const q = normalize(query);
  return lectures.filter((item) => {
    const lectureMatch = selectedLecture === "all" || item.lecture === selectedLecture;
    if (!lectureMatch) return false;
    if (!q) return true;
    return normalize(`${item.title} ${item.lecture} ${item.clip}`).includes(q);
  });
}

function renderFilters() {
  const lecturesByName = ["all", ...new Set(lectures.map((item) => item.lecture))];
  lectureFilters.innerHTML = lecturesByName
    .map((lecture) => {
      const active = lecture === selectedLecture ? " is-active" : "";
      const label = lecture === "all" ? "All" : lecture.replace("LECTURE ", "Lecture ");
      return `<button class="filter-button${active}" type="button" data-lecture="${lecture}">${label}</button>`;
    })
    .join("");
}

function renderPlaylist() {
  const items = filteredLectures();
  if (!items.length) {
    playlistList.innerHTML = `<div class="empty-state">No lecture title matches this search.</div>`;
    return;
  }

  playlistList.innerHTML = items
    .map((item) => {
      const isActive = item.index - 1 === activeIndex;
      const activeClass = isActive ? " is-active" : "";
      const indicator = isActive ? `<span class="play-indicator">Playing</span>` : "";
      return `
        <button class="playlist-item${activeClass}" type="button" data-index="${item.index - 1}">
          <span class="thumb-wrap">
            <img src="${item.thumbnail}" alt="">
            ${indicator}
          </span>
          <span class="item-copy">
            <span class="item-title">${item.title}</span>
            <span class="item-meta">${item.lecture.replace("LECTURE ", "Lecture ")} - ${item.clip.replace("CLIP ", "Clip ")}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function setActive(index, shouldPlay = false) {
  if (!lectures.length) return;
  activeIndex = Math.max(0, Math.min(index, lectures.length - 1));
  const item = lectures[activeIndex];
  const src = sourceFor(item);

  currentTitle.textContent = item.title;
  currentLecture.textContent = `${item.lecture.replace("LECTURE ", "Lecture ")} - ${item.clip.replace("CLIP ", "Clip ")}`;
  player.poster = item.thumbnail;

  if (player.getAttribute("src") !== src) {
    player.src = src;
  }

  previousButton.disabled = activeIndex === 0;
  nextButton.disabled = activeIndex === lectures.length - 1;
  document.title = `${item.title} - Bayan ul Quran`;
  renderPlaylist();

  const activeButton = playlistList.querySelector(`[data-index="${activeIndex}"]`);
  if (activeButton) {
    activeButton.scrollIntoView({ block: "nearest" });
  }

  if (shouldPlay) {
    player.play().catch(() => {});
  }
}

function moveBy(delta, shouldPlay = true) {
  setActive(activeIndex + delta, shouldPlay);
}

lectureFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lecture]");
  if (!button) return;
  selectedLecture = button.dataset.lecture;
  renderFilters();
  renderPlaylist();
});

playlistList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-index]");
  if (!button) return;
  setActive(Number(button.dataset.index), true);
});

searchInput.addEventListener("input", (event) => {
  query = event.target.value;
  renderPlaylist();
});

previousButton.addEventListener("click", () => moveBy(-1));
nextButton.addEventListener("click", () => moveBy(1));

player.addEventListener("ended", () => {
  if (autoplayToggle.checked && activeIndex < lectures.length - 1) {
    moveBy(1, true);
  }
});

renderFilters();
renderPlaylist();
setActive(0);
