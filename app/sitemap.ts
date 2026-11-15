import type { MetadataRoute } from "next";

const BASE = "https://mongli-game.vercel.app";
const ROUTES = ["", "/game", "/about", "/judges", "/leaderboard", "/gallery", "/trailer", "/world", "/speedrun", "/diary", "/history", "/vote"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({ url: `${BASE}${r}`, changeFrequency: "weekly", priority: r ? 0.6 : 1 }));
}
