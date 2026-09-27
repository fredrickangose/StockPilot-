import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { sellersRouter } from "./routes/sellers.js";
import { productsRouter } from "./routes/products.js";
import { restocksRouter } from "./routes/restocks.js";
import { salesRouter } from "./routes/sales.js";
import { reportsRouter } from "./routes/reports.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use("/sellers", sellersRouter);
  app.use("/products", productsRouter);
  app.use("/restocks", restocksRouter);
  app.use("/sales", salesRouter);
  app.use("/reports", reportsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
