const esbuild = require("esbuild");
const { clean } = require("esbuild-plugin-clean");
const pkg = require("./package.json");

esbuild
  .build({
    platform: "node",
    plugins: [clean()],
    target: "es2020",
    tsconfig: "./tsconfig.json",
    format: "cjs",
    bundle: true,
    minify: true,
    treeShaking: true,
    sourcemap: true,
    entryPoints: ["./src/main.ts"],
    outdir: "dist",
    external: Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {})),
  })
  .then(() => console.log("Build succeeded"))
  .catch(() => process.exit(1));
