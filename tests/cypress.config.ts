/* eslint-disable import/no-extraneous-dependencies */
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import createEsbuildPlugin from "@badeball/cypress-cucumber-preprocessor/esbuild";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { defineConfig } from "cypress";

// Matches `vite --port 3003` in the package.json `dev` script (vite.config.ts `server.port`).
const defaultBaseUrl = "http://localhost:3003";

export default defineConfig({
    e2e: {
        baseUrl: process.env.CYPRESS_BASE_URL || defaultBaseUrl,
        specPattern: "cypress/e2e/**/*.feature",
        // Reduce security to allow cross-origin JS execution in iframes
        chromeWebSecurity: false,
        retries: {
            // Configure retry attempts for `cypress run` (CI/headless mode)
            runMode: 1,
            // Configure retry attempts for `cypress open` (local development)
            openMode: 0,
        },
        async setupNodeEvents(
            on: Cypress.PluginEvents,
            config: Cypress.PluginConfigOptions,
        ): Promise<Cypress.PluginConfigOptions> {
            await addCucumberPreprocessorPlugin(on, config);
            on(
                "file:preprocessor",
                createBundler({
                    plugins: [createEsbuildPlugin(config)],
                }),
            );
            return config;
        },
        viewportHeight: 800,
        viewportWidth: 1280,
    },
});
