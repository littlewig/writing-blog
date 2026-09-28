const container = document.getElementById("posts");

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function renderPost(post) {
  const article = document.createElement("article");
  article.className = "post";
  article.id = post.slug;

  const header = document.createElement("header");
  header.className = "post-header";

  const title = document.createElement("h2");
  const link = document.createElement("a");
  link.href = `#${post.slug}`;
  link.textContent = post.title;
  title.appendChild(link);

  const date = document.createElement("time");
  date.dateTime = post.date;
  date.textContent = dateFormat.format(new Date(post.date));

  header.append(title, date);

  const body = document.createElement("div");
  body.className = "post-body";
  body.innerHTML = post.html;

  article.append(header, body);
  return article;
}

async function init() {
  try {
    const res = await fetch("posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`posts.json: ${res.status}`);
    const posts = await res.json();

    container.innerHTML = "";
    if (posts.length === 0) {
      container.innerHTML = '<p class="status">No posts yet.</p>';
      return;
    }
    posts.forEach((post) => container.appendChild(renderPost(post)));

    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="status">Couldn’t load posts.</p>';
  }
}

init();
