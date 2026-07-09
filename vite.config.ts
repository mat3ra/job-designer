import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
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
            "@mui/utils",
            "@mui/base",
        ],
        alias: [
            // Local cove.js reference (has entityIcons, TabsMenu, LoadingIndicator etc.)
            {
                find: /^@exabyte-io\/cove\.js\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "../cove.js/dist/$1"),
            },
            {
                find: /^@exabyte-io\/cove\.js$/,
                replacement: path.resolve(__dirname, "../cove.js/dist/index.js"),
            },
            // cove.js src/* — ThreeDEditor from wave.js imports AlertProvider via the /src/ path.
            {
                find: /^@exabyte-io\/cove\.js\/src\/(.*)$/,
                replacement: path.resolve(__dirname, "../cove.js/src/$1"),
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
                find: /^@mat3ra\/wove$/,
                replacement: path.resolve(__dirname, "../wove/src/exports.ts"),
            },
            {
                find: /^@mat3ra\/wove\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "../wove/src/$1"),
            },
            {
                find: /^@mat3ra\/ave$/,
                replacement: path.resolve(__dirname, "../ave/src/exports.ts"),
            },
            {
                find: /^@mat3ra\/ave\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "../ave/src/$1"),
            },
            {
                find: /^@mat3ra\/ive$/,
                replacement: path.resolve(__dirname, "../ive/src/exports.ts"),
            },
            {
                find: /^@mat3ra\/ive\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "../ive/src/$1"),
            },
            {
                find: /^@mat3ra\/move$/,
                replacement: path.resolve(__dirname, "../move/src/exports.ts"),
            },
            {
                find: /^@mat3ra\/move\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "../move/src/$1"),
            },
            {
                find: /^@mat3ra\/jove$/,
                replacement: path.resolve(__dirname, "../jove/src/exports.ts"),
            },
            {
                find: /^@mat3ra\/jove\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "../jove/src/$1"),
            },
            {
                find: /^@mat3ra\/jode$/,
                replacement: path.resolve(__dirname, "../jode/src/js/index.ts"),
            },
            {
                find: /^@mat3ra\/jode\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "../jode/src/$1"),
            },
            {
                find: /^@mat3ra\/prove$/,
                replacement: path.resolve(__dirname, "../prove/src/exports.ts"),
            },
            {
                find: /^@mat3ra\/prove\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "../prove/src/$1"),
            },
            {
                find: /^@mat3ra\/workflow-designer$/,
                replacement: path.resolve(__dirname, "../workflow-designer/src/exports.ts"),
            },
            {
                find: /^@mat3ra\/workflow-designer\/dist\/(.*)$/,
                replacement: path.resolve(__dirname, "../workflow-designer/src/$1"),
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
            "@exabyte-io/cove.js",
            "@mat3ra/wove",
            "@mat3ra/ave",
            "@mat3ra/ive",
            "@mat3ra/move",
            "@mat3ra/jove",
            "@mat3ra/workflow-designer",
            "@mat3ra/job-designer",
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
        rollupOptions: {
            output: {
                entryFileNames: "main.js",
                chunkFileNames: "[name]-[hash].js",
                assetFileNames: "[name]-[hash].[ext]",
            },
        },
    },
});
