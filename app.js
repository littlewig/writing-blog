const app = document.getElementById("app");
const SITE_TITLE = document.title;

const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

let posts = [];

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function readingTime(html) {
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

function renderIndex() {
  document.title = SITE_TITLE;

  const table = el("table", { className: "index" });
  table.append(
    el("thead", {}, [
      el("tr", {}, [
        el("th", { scope: "col", className: "col-year", textContent: "Year" }),
        el("th", { scope: "col", className: "col-date", textContent: "Date" }),
        el("th", { scope: "col", className: "col-title", textContent: "Title" }),
        el("th", { scope: "col", className: "col-length", textContent: "Read" }),
      ]),
    ])
  );

  const byYear = new Map();
  posts.forEach((post) => {
    const year = new Date(post.date).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(post);
  });

  for (const [year, yearPosts] of byYear) {
    const tbody = el("tbody");
    yearPosts.forEach((post, i) => {
      const row = el("tr", { className: "index-row" });
      if (i === 0) {
        row.append(
          el("th", {
            scope: "rowgroup",
            rowSpan: yearPosts.length,
            className: "col-year",
            textContent: year,
          })
        );
      }
      const link = el("a", { href: `#${post.slug}`, textContent: post.title });
      row.append(
        el("td", { className: "col-date" }, [
          el("time", { dateTime: post.date, textContent: monthDay.format(new Date(post.date)) }),
        ]),
        el("td", { className: "col-title" }, [link]),
        el("td", { className: "col-length", textContent: readingTime(post.html) })
      );
      row.addEventListener("click", (e) => {
        if (e.target !== link) link.click();
      });
      tbody.append(row);
    });
    table.append(tbody);
  }

  app.replaceChildren(table);
}

function renderPost(post) {
  document.title = `${post.title} — ${SITE_TITLE}`;
  const i = posts.indexOf(post);
  const newer = posts[i - 1];
  const older = posts[i + 1];

  const body = el("div", { className: "post-body" });
  body.innerHTML = post.html;

  const article = el("article", { className: "post" }, [
    el("header", { className: "post-header" }, [
      el("a", { href: "./", className: "back-link", textContent: "← All writing" }),
      el("h2", { textContent: post.title }),
      el("time", { dateTime: post.date, textContent: fullDate.format(new Date(post.date)) }),
    ]),
    body,
  ]);

  const pager = el("nav", { className: "pager" }, [
    older
      ? el("a", { href: `#${older.slug}`, className: "pager-older" }, [
          el("span", { className: "pager-label", textContent: "Older" }),
          older.title,
        ])
      : el("span"),
    newer
      ? el("a", { href: `#${newer.slug}`, className: "pager-newer" }, [
          el("span", { className: "pager-label", textContent: "Newer" }),
          newer.title,
        ])
      : el("span"),
  ]);

  app.replaceChildren(article, pager);
  window.scrollTo(0, 0);
}

function route() {
  const slug = decodeURIComponent(location.hash.slice(1));
  const post = slug && posts.find((p) => p.slug === slug);
  if (post) renderPost(post);
  else renderIndex();
}

async function init() {
  try {
    const res = await fetch("posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`posts.json: ${res.status}`);
    posts = await res.json();
    if (posts.length === 0) {
      app.innerHTML = '<p class="status">No posts yet.</p>';
      return;
    }
    route();
    window.addEventListener("hashchange", route);
  } catch (err) {
    console.error(err);
    app.innerHTML = '<p class="status">Couldn’t load posts.</p>';
  }
}

init();
