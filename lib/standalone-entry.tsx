import React from "react";
import { createRoot } from "react-dom/client";
import { SmoothScroll } from "@/components/smooth-scroll";
import Home from "../app/page";

const container = document.getElementById("root");
if (!container) {
  throw new Error("standalone-entry: #root not found");
}
createRoot(container).render(
  <>
    <SmoothScroll />
    <Home />
  </>
);
