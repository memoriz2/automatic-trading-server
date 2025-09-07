var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
export default defineConfig({
    plugins: __spreadArray([
        react(),
        runtimeErrorOverlay()
    ], (process.env.NODE_ENV !== "production" &&
        process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then(function (m) {
                return m.cartographer();
            }),
        ]
        : []), true),
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "client", "src"),
            "@shared": path.resolve(import.meta.dirname, "shared"),
            "@assets": path.resolve(import.meta.dirname, "attached_assets"),
        },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
        outDir: path.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true,
        rollupOptions: {
            external: [
                "@prisma/client",
                // Node.js built-in modules that Prisma might use
                "fs",
                "path",
                "os",
                "crypto",
            ],
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
        proxy: {
            "/api": "http://localhost:5000",
            "/ws": {
                target: "ws://localhost:5000",
                ws: true,
            },
        },
    },
    ssr: {
        noExternal: true, // 모든 의존성을 번들에 포함하도록 설정
        external: ["@prisma/client"], // Prisma Client는 예외로 처리
    },
});
