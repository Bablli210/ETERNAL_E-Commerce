/**
 * Words for /house that only the owner can give. As in content/site.ts, a
 * value still in [square brackets] is not confirmed: confirmed() from
 * lib/facts.ts reads it as missing and the section that needs it stays off.
 * The founder section shows once both lines are real and
 * public/images/house-founder exists; the photograph must be the founder.
 */
export const house = {
  /** Two or three sentences in the founder's own voice. */
  founderNote: "[Two or three sentences in the founder’s voice]",
  /** The name the note is signed with. */
  founderName: "[Founder’s name]",
} as const;
