"use client";

// The custom cursor was retired in the "Expediente" redesign: native cursors
// are faster, accessible and expected. Kept as a no-op so existing imports
// across pages keep compiling.
export default function Cursor() {
  return null;
}
