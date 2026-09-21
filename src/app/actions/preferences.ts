"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COUNTRY_COOKIE_NAME } from "@/config/auth";
import { getLaunchedCountries } from "@/config/countries";

export async function setPreferredCountryAction(formData: FormData): Promise<void> {
  const country = formData.get("country");
  if (typeof country !== "string") return;
  if (!getLaunchedCountries().some((c) => c.code === country)) return;

  const cookieStore = await cookies();
  cookieStore.set(COUNTRY_COOKIE_NAME, country, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  const redirectPath = formData.get("redirectPath");
  if (typeof redirectPath === "string" && redirectPath.length > 0) {
    revalidatePath(redirectPath);
  }
}
