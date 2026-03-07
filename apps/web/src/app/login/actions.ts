"use server";

import { cookies } from "next/headers";

export async function clearLoginErrorCookie() {
  const cookieStore = await cookies();
  cookieStore.set("login_error", "", { path: "/", maxAge: 0 });
}
