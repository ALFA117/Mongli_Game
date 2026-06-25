"use client";

import { useEffect } from "react";
import { initAudio } from "@/lib/audio";

export function AudioInit() {
  useEffect(() => { initAudio(); }, []);
  return null;
}
