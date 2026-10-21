/**
 * Reads every row of a query, 1000 at a time — PostgREST caps a single
 * response at 1000 rows, so a plain select can silently truncate.
 * `page(from, to)` must apply `.range(from, to)` to a freshly built query.
 */
export async function selectAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<{ data: T[]; error: unknown }> {
  const SIZE = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += SIZE) {
    const { data, error } = await page(from, from + SIZE - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < SIZE) return { data: rows, error: null };
  }
}
