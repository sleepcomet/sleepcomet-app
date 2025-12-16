"use client";

import { useEffect } from "react";

export function TurboInit() {
  useEffect(() => {
    void import("@hotwired/turbo");
  }, []);

  return null;
}
