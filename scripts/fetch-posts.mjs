// Fetches the public Buttondown RSS feed and writes posts.json for the site.
// Run with: node scripts/fetch-posts.mjs

import { writeFile } from "node:fs/promises";

const FEED_URL = "https://buttondown.com/caseyc/rss";
const POSTS_FILE = new URL("../posts.json", import.meta.url);
const SITE_FILE = new URL("../site.json", import.meta.url);

function decodeEntities(str) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function getTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeEntities(match[1]).trim() : "";
}

function cleanHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .trim();
}

function slugFromUrl(url) {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

const res = await fetch(FEED_URL);
if (!res.ok) throw new Error(`Feed request failed: ${res.status}`);
const xml = await res.text();

const channel = xml.slice(0, xml.indexOf("<item>"));
const siteTitle = getTag(channel, "title");

const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
const posts = items
  .map((item) => {
    const url = getTag(item, "link");
    return {
      title: getTag(item, "title"),
      slug: slugFromUrl(url),
      url,
      date: new Date(getTag(item, "pubDate")).toISOString(),
      html: cleanHtml(getTag(item, "description")),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

// posts.json stays a plain array so cached copies of older app.js can still read it.
await writeFile(POSTS_FILE, JSON.stringify(posts, null, 2) + "\n");
await writeFile(SITE_FILE, JSON.stringify({ title: siteTitle }, null, 2) + "\n");
console.log(`Wrote ${posts.length} posts from "${siteTitle}" to posts.json`);
