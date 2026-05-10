globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_COsO3nik.mjs';
import './chunks/astro/server_i0cwT6oL.mjs';
import { s as sequence } from './chunks/index_Dtgumf86.mjs';

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	
	
);

export { onRequest };
