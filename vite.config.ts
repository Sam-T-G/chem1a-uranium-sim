import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` must match the GitHub Pages project path: /<repo>/
export default defineConfig({
	plugins: [react()],
	base: "/chem1a-uranium-sim/",
});
