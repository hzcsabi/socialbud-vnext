"use client";

import { useEffect } from "react";
import { clearLoginErrorCookie } from "./actions";

export function ClearLoginErrorCookie({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) void clearLoginErrorCookie();
  }, [show]);
  return null;
}
