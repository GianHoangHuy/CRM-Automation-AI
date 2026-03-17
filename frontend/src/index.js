import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "react-toastify/dist/ReactToastify.css";

import * as Api from "./services/api";

if (process.env.NODE_ENV !== 'production' && typeof window !== "undefined") {
  window.Api = Api;
}

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element with id "root" not found');
}

const root = ReactDOM.createRoot(container);

root.render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>
);