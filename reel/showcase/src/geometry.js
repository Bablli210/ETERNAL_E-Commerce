// Where things sit on the table, in stage px (1 px on screen at camera zoom 1). Shared by
// the compositor and the tools (the score pans each click to its device's place on screen).
export const W = 1920, H = 1080;
export const DESK_SCALE = 0.7875; // 1440 css px → 1134 stage px
export const PHONE_SCALE = 0.94;
export const BROWSER = { x: 120, y: 281, w: 1134, h: 748.75, bar: 40 };
export const PHONE = { x: 1407, y: 166, w: 418 * PHONE_SCALE, h: 919 * PHONE_SCALE, screen: 14, status: 47 };
/** Where a device's viewport sits on the table and its css → stage scale. */
export const VIEWPORT = {
  desktop: { x: BROWSER.x, y: BROWSER.y + BROWSER.bar, s: DESK_SCALE },
  phone: { x: PHONE.x + PHONE.screen * PHONE_SCALE, y: PHONE.y + (PHONE.screen + PHONE.status) * PHONE_SCALE, s: PHONE_SCALE },
};
