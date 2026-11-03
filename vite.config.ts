import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(() => ({
  plugins: [
    sentrySvelteKit({
      autoUploadSourceMaps: Boolean(process.env.SENTRY_AUTH_TOKEN),
      sourceMapsUploadOptions: {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
    tailwindcss(),
    sveltekit(),
  ],
  esbuild: {
    supported: {
      "top-level-await": true,
    },
  },
}));
