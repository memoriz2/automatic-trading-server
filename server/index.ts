/*import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/healthz", (_req: Request, res: Response) => {
  res.type("text/plain").send("ok");
});


app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});


(async () => {
  const server = await registerRoutes(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? "Internal Server Error";
  res.status(status).json({ message });
  console.error(err); // 서버 종료하지 않음
});

//             여기부터   //
  //app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    //const status = err.status || err.statusCode || 500;
    //const message = err.message || "Internal Server Error";

    //res.status(status).json({ message });
    //console.error(err); // throw err;//
  //});

//          여기까지 수정본 //

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
*/

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http"; // ✅ 추가

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ 가장 위에 헬스체크
app.get("/healthz", (_req: Request, res: Response) => {
  res.type("text/plain").send("ok");
});

// (기존 로깅 미들웨어 유지)

(async () => {
  const server = createServer(app); // ✅ 1) app으로 http.Server 생성
  await registerRoutes(app); // ✅ 2) 라우트는 app에만 등록

  // ✅ 서버 죽이지 않기 (throw 금지)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? err.statusCode ?? 500;
    const message = err.message ?? "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  if (app.get("env") === "development") {
    await setupVite(app, server); // ✅ 3) 같은 server를 Vite에도 넘김
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  // Windows 환경 호환성을 위해 host와 reusePort 옵션 제거
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
