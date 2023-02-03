/**
 * Using a deno script for this task since running npm:esbuild in watch mode
 * directly from CLI seems to not work yet.
 */

import * as esbuild from "npm:esbuild";

let ctx = await esbuild.context({
	entryPoints: ["index.tsx"],
	bundle: true,
	format: "esm",
	outfile: "index.js",
	jsx: "automatic",
	jsxImportSource: "https://esm.sh/preact@10.11.3",
	define: {"LIVE_RELOAD": "true"}
});
await ctx.watch();
console.log(await ctx.serve({servedir: "."}));