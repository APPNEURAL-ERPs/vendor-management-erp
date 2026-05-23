import cors from "cors";
import express from "express";
import { commerceRouter } from "./api/router";
import { createCommerceOS } from "./commerceos";
import { seedDemoData } from "./seed";
import { errorHandler } from "./shared/errors";

const app = express();
const os = createCommerceOS();
seedDemoData(os);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "CommerceOS", version: "1.0.0" });
});

app.use("/commerceos", commerceRouter(os));
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`CommerceOS API running on http://localhost:${port}`);
});
