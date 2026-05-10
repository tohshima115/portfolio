// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/",
    "/_astro/*",
    "/favicon.ico",
    "/favicon.svg",
    "/folder.svg",
    "/Iogo.svg",
    "/robots.txt",
    "/AIChatClip/favicon.svg",
    "/Swept/logoConcept.svg",
    "/Swept/logoHorizontal.svg",
    "/Swept/logoMark.svg",
    "/Swept/logoVertical.svg",
    "/blog/*",
    "/index.md",
    "/llms-full.txt",
    "/llms.txt",
    "/projects/*",
    "/rss.xml",
    "/about",
    "/contact",
    "/system",
    "/updates"
  ]
};

// node_modules/.pnpm/wrangler@4.65.0_@cloudflare+workers-types@4.20260212.0/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "C:\\src\\personal\\portfolio\\.wrangler\\tmp\\pages-pyqfso\\bundledWorker-0.5704142819855719.mjs";
import { isRoutingRuleMatch } from "C:\\src\\personal\\portfolio\\node_modules\\.pnpm\\wrangler@4.65.0_@cloudflare+workers-types@4.20260212.0\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\src\\personal\\portfolio\\.wrangler\\tmp\\pages-pyqfso\\bundledWorker-0.5704142819855719.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=b2f36v1hp3j.js.map
