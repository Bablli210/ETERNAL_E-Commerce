/**
 * Runs before the page paints: honours the visitor's motion switch, flags a
 * visit that came from an ad (data-ad), and decides once per session whether
 * the Linen curtain (G1) shows, so it is there from the very first frame
 * instead of flashing in after hydration.
 *
 * An ad visit is an ad click (utm_*, fbclid, gclid) or any visit inside
 * Instagram's or Facebook's in-app browser: that is where the ads open, and a
 * click id does not always survive the hand-off. Ad visits get the headline
 * at once (home.css) and lose the brand-only sections.
 *
 * The curtain is only for a desktop visitor opening the home page as the
 * first page of the session. An ad visit, a viewport under 1024 px and every
 * other page go straight to the content: the curtain costs about half a
 * second, and ad visitors pay for it twice, in attention and in ad spend.
 * The ad flag is set before storage is touched, so blocked storage cannot drop it.
 *
 * data-hover: the first time a real mouse or trackpad moves over the page,
 * cards switch on their hover frame (collection.css), whatever the browser
 * reports about its pointer.
 */
const code =
  '(function(){var d=document.documentElement,l=location;' +
  'var ad=/Instagram|FBAN|FBAV/i.test(navigator.userAgent)||/[?&](utm_[a-z]+|fbclid|gclid)=/i.test(l.search);if(ad){d.dataset.ad="1";}' +
  'try{var m=localStorage.getItem("eternal.motion");if(m==="off"){d.dataset.motion="off";}' +
  'var first=!sessionStorage.getItem("eternal.loaded");sessionStorage.setItem("eternal.loaded","1");' +
  'if(first&&m!=="off"&&!ad&&l.pathname==="/"&&window.innerWidth>=1024' +
  '&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.loading="1";}}catch(e){}' +
  'function h(e){if(e.pointerType==="mouse"){d.dataset.hover="1";removeEventListener("pointerover",h,true);}}addEventListener("pointerover",h,true);})();';

export function MotionScript() {
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
