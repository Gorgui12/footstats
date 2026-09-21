import { cookies } from "next/headers";
import { COUNTRY_COOKIE_NAME } from "@/config/auth";
import { DEFAULT_COUNTRY_CODE, getLaunchedCountries } from "@/config/countries";

/**
 * Pays utilisé pour l'affichage des heures locales et la mise en avant de
 * compétitions (brief §17). Lu depuis un cookie simple — pas besoin d'un
 * compte utilisateur pour ce réglage, contrairement aux favoris.
 */
export async function getPreferredCountryCode(): Promise<string> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COUNTRY_COOKIE_NAME)?.value;
  if (value && getLaunchedCountries().some((c) => c.code === value)) {
    return value;
  }
  return DEFAULT_COUNTRY_CODE;
}
