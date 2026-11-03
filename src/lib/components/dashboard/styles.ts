interface Colors {
  primary: string;
  accent: string;
  text: string;
  muted: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
}

/** Background and border of a dashboard section card. */
export const sectionStyle = (c: Colors) =>
  `background: linear-gradient(135deg, ${c.gradientStart}10, ${c.gradientMid}15, ${c.gradientEnd}10); border-color: ${c.primary}30;`;

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
  `color: ${active ? c.primary : c.muted}; background: ${active ? `${c.primary}20` : "transparent"}; border: 1px solid ${active ? `${c.primary}40` : "transparent"}; --tw-ring-color: ${c.primary};`;

/** An outlined chip that can be switched on, such as a filter or a tab. */
export const chipStyle = (c: Colors, active: boolean) =>
  `background: ${active ? `${c.primary}20` : "transparent"}; color: ${active ? c.primary : c.muted}; border: 1px solid ${active ? `${c.primary}30` : `${c.primary}15`}; --tw-ring-color: ${c.primary};`;

/** A filled toggle button, such as a group or view filter. */
export const toggleStyle = (c: Colors, active: boolean) =>
  `background: ${active ? `${c.primary}20` : `${c.primary}08`}; color: ${active ? c.primary : c.text}; border: 1px solid ${active ? `${c.primary}40` : "transparent"}; --tw-ring-color: ${c.primary};`;

/** Text inputs and search boxes. */
export const controlStyle = (c: Colors) =>
  `background: ${c.primary}08; border-color: ${c.primary}30; color: ${c.text}; --tw-ring-color: ${c.primary};`;
