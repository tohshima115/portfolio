globalThis.process ??= {}; globalThis.process.env ??= {};
const ROLES = [
  { label: "UX Research", value: "ux-research" },
  { label: "UI Design", value: "ui-design" },
  { label: "Frontend Dev", value: "frontend-dev" },
  { label: "Backend Dev", value: "backend-dev" },
  { label: "Visual Identity", value: "visual-identity" },
  { label: "Branding", value: "branding" },
  { label: "Graphic Design", value: "graphic-design" }
];

export { ROLES as R };
