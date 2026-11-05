interface Colors {
  primary: string;
  accent: string;
  text: string;
  muted: string;
  selectedSurface?: string;
  selectedBorder?: string;
}

const surfaceOf = (c: Colors) => c.selectedSurface ?? `${c.primary}20`;
const borderOf = (c: Colors) => c.selectedBorder ?? `${c.primary}40`;

/** Background and border of a dashboard section card. */
export const sectionStyle = (c: Colors) => `background: ${c.primary}08; border-color: ${c.primary}30;`;

/** A button tinted with one colour. */
export const tintedStyle = (color: string) =>
  `background: ${color}20; color: ${color}; border: 1px solid ${color}30; --tw-ring-color: ${color};`;

/** The primary action button. */
export const buttonStyle = (c: Colors) => tintedStyle(c.primary);

/** A destructive action button. */
export const dangerStyle = (c: Colors) => tintedStyle(c.accent);

/** A secondary button, such as Cancel. */
export const quietStyle = (c: Colors) => `background: ${c.muted}20; color: ${c.muted}; --tw-ring-color: ${c.primary};`;

/** A button in a segmented control, such as the density switch. */
export const segmentStyle = (c: Colors, active: boolean) =>
  `color: ${active ? c.text : c.muted}; background: ${active ? surfaceOf(c) : "transparent"}; border: 1px solid ${active ? borderOf(c) : "transparent"}; --tw-ring-color: ${c.primary};`;

/** An outlined chip that can be switched on, such as a filter or a tab. */
export const chipStyle = (c: Colors, active: boolean) =>
  `background: ${active ? surfaceOf(c) : "transparent"}; color: ${active ? c.text : c.muted}; border: 1px solid ${active ? borderOf(c) : `${c.primary}15`}; --tw-ring-color: ${c.primary};`;

/** A filled toggle button, such as a group or view filter. */
export const toggleStyle = (c: Colors, active: boolean) =>
  `background: ${active ? surfaceOf(c) : `${c.primary}08`}; color: ${c.text}; border: 1px solid ${active ? borderOf(c) : "transparent"}; --tw-ring-color: ${c.primary};`;

/** Text inputs and search boxes. */
export const controlStyle = (c: Colors) =>
  `background: ${c.primary}08; border-color: ${c.primary}30; color: ${c.text}; --tw-ring-color: ${c.primary};`;
