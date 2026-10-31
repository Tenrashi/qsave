import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import i18n from "./i18n";
import { App } from "./App";

const container = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// The HTML is prerendered in English; other languages render from scratch
// instead of hydrating mismatched markup.
const mount = () => {
  if (container.hasChildNodes() && i18n.resolvedLanguage === "en") {
    hydrateRoot(container, app);
    return;
  }
  createRoot(container).render(app);
};

mount();
