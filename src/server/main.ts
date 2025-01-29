import express from "express";
import ViteExpress from "vite-express";
import { injectVariables } from "./injectVariables.js";
import { addTrailingSlashes } from "@/middleware/trailing-slashes.js";

const app = express();
app.use(addTrailingSlashes);

app.use(injectVariables('/', {
  title: 'Vite + Express',
}));

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on http://localhost:3000"),
);
