import type { MetadataRoute } from "next";

/** Lets phones "Add to Home Screen" with the ORACK icon and colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ORACK — Wear your identity",
    short_name: "ORACK",
    description: "Minimal black-and-white streetwear from Sri Lanka.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
