import { createWebHistory } from "vue-router";

import { createApplyTrackApp } from "./app";
import { createBrowserContainer } from "./di/browser";
import "./style.css";

const { app } = createApplyTrackApp({
  useCases: createBrowserContainer(),
  history: createWebHistory(),
});

app.mount("#app");
