/**
 * Runs before the page paints: honours the visitor's motion switch, flags a
 * visit that came from an ad (data-ad), and decides once per session whether
 * the Linen curtain (G1) shows, so it is there from the very first frame
 * instead of flashing in after hydration.
 *
 * The curtain is only for a desktop visitor opening the home page as the
 * first page of the session. An ad click (utm_*, fbclid, gclid), Instagram's
 * or Facebook's in-app browser, a viewport under 1024 px and every other page
 * go straight to the content: the curtain costs about half a second, and ad
 * visitors pay for it twice, in attention and in ad spend.
 */
const code =
  '(function(){try{var d=document.documentElement,l=location;var m=localStorage.getItem("eternal.motion");if(m==="off"){d.dataset.motion="off";}' +
  'var ad=/[?&](utm_[a-z]+|fbclid|gclid)=/i.test(l.search);if(ad){d.dataset.ad="1";}' +
  'var first=!sessionStorage.getItem("eternal.loaded");sessionStorage.setItem("eternal.loaded","1");' +
  'if(first&&m!=="off"&&!ad&&l.pathname==="/"&&window.innerWidth>=1024&&!/Instagram|FBAN|FBAV/i.test(navigator.userAgent)' +
  '&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.loading="1";}}catch(e){}})();';

export function MotionScript() {
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
