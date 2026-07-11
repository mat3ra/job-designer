import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
    // Matches the repo name so assets resolve under the GitHub Pages
    // subpath (mat3ra.github.io/job-designer/). Harmless for `npm run dev`.
    base: "/job-designer/",
    server: {
        port: 3003,
        fs: {
            // Allow serving aliased sibling packages (cove.js, wave.js) outside this package dir.
            allow: [
                path.resolve(__dirname, ".."),
                path.resolve(__dirname, "node_modules"),
            ],
        },
    },
    plugins: [
        react({
            jsxImportSource: "@emotion/react",
            babel: {
                plugins: ["@emotion/babel-plugin"],
            },
        }),
        nodePolyfills(),
    ],
    resolve: {
        dedupe: [
            "react",
            "react-dom",
            "@emotion/react",
            "@emotion/styled",
            "@mui/material",
            "@mui/styles",
            "@mui/system",
            "@mui/lab",
            "@mui/icons-material",
        ],
        alias: [
            {
                find: "vite-plugin-node-polyfills/shims/global",
                replacement: path.resolve(__dirname, "node_modules/vite-plugin-node-polyfills/shims/global"),
            },
            {
                find: "vite-plugin-node-polyfills/shims/process",
                replacement: path.resolve(__dirname, "node_modules/vite-plugin-node-polyfills/shims/process"),
            },
            {
                find: "vite-plugin-node-polyfills/shims/buffer",
                replacement: path.resolve(__dirname, "node_modules/vite-plugin-node-polyfills/shims/buffer"),
            },
            // @exabyte-io/wave.js — point to the local installed dist.
            {
                find: /^@exabyte-io\/wave\.js$/,
                replacement: path.resolve(__dirname, "node_modules/@exabyte-io/wave.js/dist/exports.js"),
            },
            // Bypass narrow prode exports field
            {
                find: /^@mat3ra\/prode\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "node_modules/@mat3ra/prode/dist/$1"),
            },
            {
                find: "moment-duration-format",
                replacement: path.resolve(__dirname, "src/standalone/stubs/moment-duration-format.js"),
            },
            {
                find: "use-sync-external-store/shim/with-selector.js",
                replacement: "use-sync-external-store/shim/with-selector",
            },
            {
                find: /^@mat3ra\/job-designer$/,
                replacement: path.resolve(__dirname, "src/exports.ts"),
            },
            {
                find: /^@mat3ra\/job-designer\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "src/$1"),
            },
            {
                find: /^\/imports\/(.*)$/,
                replacement: path.resolve(__dirname, "src/standalone/stubs/meteor.js"),
            },
            {
                find: /^meteor\/(.*)$/,
                replacement: path.resolve(__dirname, "src/standalone/stubs/meteor.js"),
            },
            {
                find: "simple-react-form",
                replacement: path.resolve(__dirname, "src/standalone/stubs/simple-react-form.js"),
            },
            {
                find: /^@mui\/system\/(?!esm\/)(.*)$/,
                replacement: path.resolve(__dirname, "node_modules/@mui/system/esm/$1"),
            },
            {
                find: /^@mui\/icons-material\/(?!esm\/)(.*)$/,
                replacement: path.resolve(__dirname, "node_modules/@mui/icons-material/esm/$1"),
            },
            {
                find: /^lodash\/(?!es\/)(.*)$/,
                replacement: path.resolve(__dirname, "node_modules/lodash-es/$1.js"),
            },
        ],
    },
    define: {
        __dirname: JSON.stringify(__dirname),
    },
    optimizeDeps: {
        exclude: [
            // Self-referencing alias to local src/exports.ts.
            "@mat3ra/job-designer",
            // Aliased to a local stub file, not a real package.
            "moment-duration-format",
        ],
        include: [
            "react",
            "react-dom",
            "prop-types",
            "lodash",
            "underscore",
            "underscore.string",
            "underscore.string/capitalize",
            "mixwith",
            "react-error-boundary",
            "redux-logger",
            "flat",
            "simpl-schema",
            "d3-hierarchy",
            "@mui/material",
            "@mui/system",
            "@mui/lab",
            "@mui/icons-material",
            "@rjsf/mui",
            "@rjsf/utils",
            "@rjsf/validator-ajv8",
            "react-is",
            "hoist-non-react-statics",
            "ajv",
            "ajv/dist/ajv",
            "@mat3ra/code/dist/js/utils",
            "@mat3ra/code/dist/js/utils/object",
            "@mat3ra/code/dist/js/utils/schemas",
            "@mat3ra/prode",
            "@mat3ra/ide",
            "@mat3ra/made",
            "@mat3ra/prove",
            "@mat3ra/ade",
            "@mat3ra/utils",
            "@mat3ra/standata",
            "@mat3ra/wode",
            "@mat3ra/mode",
            "@mat3ra/code",
            "@mat3ra/jode",
            "@exabyte-io/periodic-table.js",
            "react-json-view",
            "use-sync-external-store/shim/with-selector",
        ],
        // Prevent esbuild from inlining @mat3ra/wode/dist/js/Workflow into jode's pre-bundle.
        // Without this, esbuild creates a split esse/JSONSchemasInterface instance that doesn't
        // see the schemas set in preloads.ts — causing "missing schema id" errors at runtime.
        esbuildOptions: {
            external: ["@mat3ra/wode/dist/js/Workflow"],
        },
    },
    build: {
        outDir: "build",
        commonjsOptions: {
            include: [/node_modules/, /reference/],
        },
        rollupOptions: {
            output: {
                entryFileNames: "main.js",
                chunkFileNames: "[name]-[hash].js",
                assetFileNames: "[name]-[hash].[ext]",
            },
        },
    },
});
