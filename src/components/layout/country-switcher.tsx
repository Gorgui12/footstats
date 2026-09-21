import { getLaunchedCountries } from "@/config/countries";
import { setPreferredCountryAction } from "@/app/actions/preferences";

export function CountrySwitcher({ currentCode, redirectPath }: { currentCode: string; redirectPath: string }) {
  const countries = getLaunchedCountries();
  if (countries.length <= 1) return null;

  return (
    <form action={setPreferredCountryAction} className="flex items-center gap-1">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <select
        name="country"
        defaultValue={currentCode}
        className="rounded-full border border-white/15 bg-pitch-900 px-2 py-1 text-xs text-white/80"
      >
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <button type="submit" className="text-xs text-white/50 hover:text-white">
        ✓
      </button>
    </form>
  );
}
