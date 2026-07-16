/* ============================================================
   Digital Oak — shared site behaviour
   ============================================================ */

/* ---------- Theme (light / dark) ---------- */
(function () {
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
})();

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

/* ---------- Mobile nav ---------- */
function toggleNav() {
  document.getElementById("navLinks").classList.toggle("open");
}

/* ---------- Mark active nav link ---------- */
function markActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
    // keep post.html highlighting its source section
    if (path === "post.html") {
      const type = new URLSearchParams(location.search).get("type");
      if ((type === "book" && href === "books.html") || (type !== "book" && href === "blog.html"))
        a.classList.add("active");
    }
  });
}

/* ---------- Content loading ---------- */
async function loadPosts() {
  const res = await fetch("content/posts.json", { cache: "no-store" });
  if (!res.ok) throw new Error("posts.json not found");
  const posts = await res.json();
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function fmtDate(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return iso; }
}

function stars(rating) {
  const n = Math.round(rating || 0);
  let out = "";
  for (let i = 1; i <= 5; i++) out += i <= n ? "★" : '<span class="off">★</span>';
  return out;
}

/* Render blog OR book cards into #cardGrid */
async function renderList(type) {
  const grid = document.getElementById("cardGrid");
  try {
    const posts = (await loadPosts()).filter((p) => p.type === type);
    if (!posts.length) {
      grid.outerHTML = '<p class="empty-note">Nothing here yet — check back soon. 🌱</p>';
      return;
    }
    grid.innerHTML = posts.map((p) => cardHTML(p)).join("");
  } catch (e) {
    grid.outerHTML =
      '<p class="empty-note">Posts load once the site is served over http (GitHub Pages or a local server).</p>';
  }
}

function cardHTML(p) {
  const cover = p.cover
    ? `<div class="card-cover"><img src="${p.cover}" alt="" loading="lazy"></div>`
    : "";
  const author = p.type === "book" && p.author ? `<p class="book-author">by ${p.author}</p>` : "";
  const rating = p.type === "book" && p.rating ? `<span class="rating">${stars(p.rating)}</span>` : "";
  const tags = (p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("");
  return `
    <article class="card">
      <a class="card-link" href="post.html?slug=${encodeURIComponent(p.slug)}&type=${p.type}">
        ${cover}
        <div class="card-body">
          <div class="card-meta">${rating}<span>${fmtDate(p.date)}</span></div>
          <h3>${p.title}</h3>
          ${author}
          <p>${p.excerpt || ""}</p>
          <div class="card-meta" style="margin-top:auto">${tags}</div>
        </div>
      </a>
    </article>`;
}

/* Render a single post from ?slug= into #article */
async function renderPost() {
  const slug = new URLSearchParams(location.search).get("slug");
  const el = document.getElementById("article");
  if (!slug) { el.innerHTML = '<p class="empty-note">No post specified.</p>'; return; }
  try {
    const posts = await loadPosts();
    const p = posts.find((x) => x.slug === slug);
    if (!p) { el.innerHTML = '<p class="empty-note">Post not found.</p>'; return; }
    document.title = p.title + " — Alona's Digital Oak";
    const mdRes = await fetch(`content/posts/${slug}.md`, { cache: "no-store" });
    const md = await mdRes.text();
    const back = p.type === "book" ? "books.html" : "blog.html";
    const backLabel = p.type === "book" ? "Book Reviews" : "Blog";
    const author = p.type === "book" && p.author ? ` · ${p.author}` : "";
    const rating = p.type === "book" && p.rating ? `<span class="rating">${stars(p.rating)}</span>` : "";
    const cover = p.cover ? `<div class="article-cover"><img src="${p.cover}" alt=""></div>` : "";
    el.innerHTML = `
      <a class="back" href="${back}">← ${backLabel}</a>
      <header class="article-head">
        <div class="card-meta">${rating}<span>${fmtDate(p.date)}${author}</span></div>
        <h1>${p.title}</h1>
      </header>
      ${cover}
      <div class="article-body">${marked.parse(md)}</div>`;
  } catch (e) {
    el.innerHTML = '<p class="empty-note">Could not load this post.</p>';
  }
}

/* Render short-form thoughts into #thoughtsList (timeline style) */
async function renderThoughts() {
  const el = document.getElementById("thoughtsList");
  try {
    const posts = (await loadPosts()).filter((p) => p.type === "thought");
    if (!posts.length) {
      el.innerHTML = '<p class="empty-note">No thoughts posted yet — the well is quiet for now. 🌾</p>';
      return;
    }
    el.innerHTML = posts
      .map(
        (p) => `
        <article class="thought">
          <div class="thought-date">${fmtDate(p.date)}</div>
          <div class="thought-body">
            ${marked.parse(p.body || "")}
            <div class="card-meta">${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
          </div>
        </article>`
      )
      .join("");
  } catch (e) {
    el.innerHTML =
      '<p class="empty-note">Thoughts load once the site is served over http (GitHub Pages or a local server).</p>';
  }
}

document.addEventListener("DOMContentLoaded", markActiveNav);
