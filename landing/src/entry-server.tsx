import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import i18n from "./i18n";
import { App } from "./App";

export const render = async (): Promise<string> => {
  await i18n.changeLanguage("en");
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};
