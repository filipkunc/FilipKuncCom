import { defineConfig, devices } from '@playwright/test';

// End-to-end tests that exercise the WebGPU demo in a real browser. WebGPU only
// runs in the full Chromium build (not Playwright's default headless_shell), and
// on a machine with no GPU it falls back to SwiftShader's software Vulkan, which
// is exactly what these flags request. On a box with a real GPU the same tests
// run against the hardware adapter.
const WEBGPU_ARGS = [
  '--enable-unsafe-webgpu',
  '--enable-features=Vulkan,WebGPU',
  '--enable-unsafe-swiftshader',
  '--use-vulkan=swiftshader',
  '--use-angle=swiftshader',
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    channel: 'chromium',
    launchOptions: { args: WEBGPU_ARGS },
  },
  projects: [{ name: 'chromium-webgpu', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
