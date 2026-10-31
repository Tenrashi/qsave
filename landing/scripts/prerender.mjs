// Injects the server-rendered home page into dist/index.html so crawlers
// get real content without having to execute JavaScript.
import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const indexPath = `${root}dist/index.html`;
const ssrDir = `${root}dist-ssr`;

const { render } = await import(`${ssrDir}/entry-server.js`);
const rendered = await render();

// React emits resource hints (image preloads) ahead of the markup; they belong
// in <head>, not inside the hydration root.
const hints = rendered.match(/^(?:<link [^>]*\/>)*/)[0];
const html = rendered.slice(hints.length);

const template = await readFile(indexPath, "utf8");
const placeholder = '<div id="root"></div>';
if (!template.includes(placeholder)) {
  throw new Error(`Placeholder ${placeholder} not found in ${indexPath}`);
}

await writeFile(
  indexPath,
  template
    .replace("</head>", `${hints}</head>`)
    .replace(placeholder, `<div id="root">${html}</div>`),
);
await rm(ssrDir, { recursive: true, force: true });
