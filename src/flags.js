/**
 * Feature flag declarations for Matchboard.
 *
 * Flags are evaluated server-side via the /api/flags endpoint using
 * @vercel/flags-core, controlled from the Vercel Flags dashboard.
 *
 * https://vercel.com/yortos-projects/matchboard/flags
 */

/**
 * grid-redesign
 *
 * Controls whether the user sees the new grid-based match card layout
 * (true) or the legacy list-based layout (false).
 *
 * Dashboard: https://vercel.com/yortos-projects/matchboard/flag/grid-redesign
 */
export const gridRedesignFlag = {
  key: 'grid-redesign',
  defaultValue: false,
  options: [
    { value: false, label: 'Off' },
    { value: true, label: 'On' },
  ],
  description:
    'controls whether the user sees the current list-like design or the new grid-based design.',
}
