globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../../chunks/astro/server_i0cwT6oL.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_BHW5Y9SD.mjs';

const prerender = false;
const $$KeystaticAstroPage = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Keystatic", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "C:/src/personal/portfolio/node_modules/.pnpm/@keystatic+astro@5.0.6_@key_75a2a0fdccbc94d00774d7af23036afe/node_modules/@keystatic/astro/internal/keystatic-page.js", "client:component-export": "Keystatic" })}`;
}, "C:/src/personal/portfolio/node_modules/.pnpm/@keystatic+astro@5.0.6_@key_75a2a0fdccbc94d00774d7af23036afe/node_modules/@keystatic/astro/internal/keystatic-astro-page.astro", void 0);

const $$file = "C:/src/personal/portfolio/node_modules/.pnpm/@keystatic+astro@5.0.6_@key_75a2a0fdccbc94d00774d7af23036afe/node_modules/@keystatic/astro/internal/keystatic-astro-page.astro";
const $$url = undefined;

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$KeystaticAstroPage,
	file: $$file,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
