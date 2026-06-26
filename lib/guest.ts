"use client";

const GUEST_KEY = "mongli-guest-id";

export function getGuestId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_KEY);
}

export function createGuestSession(): string {
  const id = "guest-" + Math.random().toString(36).slice(2, 10);
  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export function clearGuestSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_KEY);
  }
}

export function isGuestMode(): boolean {
  return !!getGuestId();
}
