var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js/index.js
import { r as renderers } from "./chunks/_@astro-renderers_BHW5Y9SD.mjs";
import { c as createExports, s as serverEntrypointModule } from "./chunks/_@astrojs-ssr-adapter_DycQ_Uko.mjs";
import { manifest } from "./manifest_D-Xvyiw_.mjs";
globalThis.process ??= {};
globalThis.process.env ??= {};
var serverIslandMap = /* @__PURE__ */ new Map();
var _page0 = /* @__PURE__ */ __name(() => import("./pages/_image.astro.mjs"), "_page0");
var _page1 = /* @__PURE__ */ __name(() => import("./pages/about.astro.mjs"), "_page1");
var _page2 = /* @__PURE__ */ __name(() => import("./pages/api/keystatic/_---params_.astro.mjs"), "_page2");
var _page3 = /* @__PURE__ */ __name(() => import("./pages/blog.astro.mjs"), "_page3");
var _page4 = /* @__PURE__ */ __name(() => import("./pages/blog/_---slug_.md.astro.mjs"), "_page4");
var _page5 = /* @__PURE__ */ __name(() => import("./pages/blog/_---slug_.astro.mjs"), "_page5");
var _page6 = /* @__PURE__ */ __name(() => import("./pages/contact.astro.mjs"), "_page6");
var _page7 = /* @__PURE__ */ __name(() => import("./pages/index.md.astro.mjs"), "_page7");
var _page8 = /* @__PURE__ */ __name(() => import("./pages/keystatic/_---params_.astro.mjs"), "_page8");
var _page9 = /* @__PURE__ */ __name(() => import("./pages/llms-full.txt.astro.mjs"), "_page9");
var _page10 = /* @__PURE__ */ __name(() => import("./pages/llms.txt.astro.mjs"), "_page10");
var _page11 = /* @__PURE__ */ __name(() => import("./pages/projects.astro.mjs"), "_page11");
var _page12 = /* @__PURE__ */ __name(() => import("./pages/projects/_---slug_.md.astro.mjs"), "_page12");
var _page13 = /* @__PURE__ */ __name(() => import("./pages/projects/_---slug_.astro.mjs"), "_page13");
var _page14 = /* @__PURE__ */ __name(() => import("./pages/rss.xml.astro.mjs"), "_page14");
var _page15 = /* @__PURE__ */ __name(() => import("./pages/system.astro.mjs"), "_page15");
var _page16 = /* @__PURE__ */ __name(() => import("./pages/updates.astro.mjs"), "_page16");
var _page17 = /* @__PURE__ */ __name(() => import("./pages/_page_.md.astro.mjs"), "_page17");
var _page18 = /* @__PURE__ */ __name(() => import("./pages/index.astro.mjs"), "_page18");
var pageMap = /* @__PURE__ */ new Map([
  ["node_modules/.pnpm/@astrojs+cloudflare@12.6.12_68874b6786e659732c051b92adb3bb18/node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
  ["src/pages/about/index.astro", _page1],
  ["node_modules/.pnpm/@keystatic+astro@5.0.6_@key_75a2a0fdccbc94d00774d7af23036afe/node_modules/@keystatic/astro/internal/keystatic-api.js", _page2],
  ["src/pages/blog/index.astro", _page3],
  ["src/pages/blog/[...slug].md.ts", _page4],
  ["src/pages/blog/[...slug].astro", _page5],
  ["src/pages/contact.astro", _page6],
  ["src/pages/index.md.ts", _page7],
  ["node_modules/.pnpm/@keystatic+astro@5.0.6_@key_75a2a0fdccbc94d00774d7af23036afe/node_modules/@keystatic/astro/internal/keystatic-astro-page.astro", _page8],
  ["src/pages/llms-full.txt.ts", _page9],
  ["src/pages/llms.txt.ts", _page10],
  ["src/pages/projects/index.astro", _page11],
  ["src/pages/projects/[...slug].md.ts", _page12],
  ["src/pages/projects/[...slug].astro", _page13],
  ["src/pages/rss.xml.ts", _page14],
  ["src/pages/system.astro", _page15],
  ["src/pages/updates.astro", _page16],
  ["src/pages/[page].md.ts", _page17],
  ["src/pages/index.astro", _page18]
]);
var _manifest = Object.assign(manifest, {
  pageMap,
  serverIslandMap,
  renderers,
  actions: /* @__PURE__ */ __name(() => import("./noop-entrypoint.mjs"), "actions"),
  middleware: /* @__PURE__ */ __name(() => import("./_astro-internal_middleware.mjs"), "middleware")
});
var _args = void 0;
var _exports = createExports(_manifest);
var __astrojsSsrVirtualEntry = _exports.default;
var _start = "start";
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
  serverEntrypointModule[_start](_manifest, _args);
}
export {
  __astrojsSsrVirtualEntry as default,
  pageMap
};
//# sourceMappingURL=bundledWorker-0.5704142819855719.mjs.map
