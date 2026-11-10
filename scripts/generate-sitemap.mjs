import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = (process.env.SITE_URL || "https://d26667476-bit.github.io/BTS---Bangtan-Sonyeondan")
    .replace(/\/+$/, "");
const excludedDirectories = new Set([".git", ".github", "functions", "node_modules", "scripts"]);
const htmlFiles = [];

async function collectHtmlFiles(directory = ".") {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const relativePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (!excludedDirectories.has(entry.name) && entry.name !== "_site") {
                await collectHtmlFiles(relativePath);
            }
        } else if (entry.isFile() && entry.name.endsWith(".html") && relativePath !== "index.html") {
            htmlFiles.push(relativePath);
        }
    }
}

function toSiteUrl(filePath) {
    const encodedPath = filePath
        .split(path.sep)
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    return `${siteUrl}/${encodedPath}`;
}

await collectHtmlFiles();
htmlFiles.sort();

const urls = htmlFiles.map((filePath) => `    <url><loc>${toSiteUrl(filePath)}</loc></url>`).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

await writeFile("sitemap.xml", sitemap, "utf8");
console.log(`Generated sitemap.xml with ${htmlFiles.length} pages.`);
