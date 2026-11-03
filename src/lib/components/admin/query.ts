const SNOWFLAKE = /^\d{1,20}$/;

/** The `pattern` attribute of an input that takes a Fluxer ID. */
export const SNOWFLAKE_PATTERN = "\\d{1,20}";

/** Whether text is a Fluxer ID. */
export const isSnowflake = (value: string | null | undefined): value is string => !!value && SNOWFLAKE.test(value);

/** A query value when it is a Fluxer ID, otherwise undefined. */
export function snowflakeParam(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim();
  return isSnowflake(value) ? value : undefined;
}

/** A whole number from the query, or undefined when it is missing or below `min`. */
export function intParam(params: URLSearchParams, key: string, min = 0): number | undefined {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return undefined;
  const value = Math.floor(Number(raw));
  return Number.isFinite(value) && value >= min ? value : undefined;
}

/** The current URL with some query values changed. Null or empty removes a value. */
export function hrefWith(url: URL, changes: Record<string, string | number | null | undefined>): string {
  const params = new URLSearchParams(url.searchParams);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : url.pathname;
}
