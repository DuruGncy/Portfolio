/**
 * The oversized editorial numeral ghosted behind a section masthead.
 *
 * Extracted rather than copied a sixth time, for two reasons beyond dedupe:
 *
 * 1. The original two copies hardcoded `text-white/[0.02]`. That is white ink
 *    at 2% — fine over the deep-space palette, invisible over the light theme's
 *    #f6f8fc page. `text-fg/[0.03]` flips with the theme (near-white on dark,
 *    near-black on light), so the ghost reads in both.
 * 2. It is `absolute`, so it paints above any *static* in-flow sibling. The
 *    masthead it sits behind must therefore carry `relative` of its own, or the
 *    numeral washes over the label instead of ghosting behind it.
 *
 * Deliberately not self-clipping: `-top-6` bleeds ~24px into the section above,
 * which lands harmlessly in that section's bottom padding. Clipping it with
 * `overflow-hidden` on the host section would also clip what legitimately
 * escapes these sections — Skills' falling chips, the project cards' hover
 * shadows, the Journey cards' tilt.
 */
export function SectionIndex({ children }: { children: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-6 right-2 select-none font-display text-[28vw] font-bold leading-none text-fg/[0.03] md:text-[16rem]"
    >
      {children}
    </span>
  );
}
