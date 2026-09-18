/**
 * Runs before the page paints: honours the visitor's motion switch and marks
 * a first visit in this session so the Linen curtain (G1) shows from the very
 * first frame instead of flashing in after hydration.
 */
const code =
  '(function(){try{var d=document.documentElement;var m=localStorage.getItem("eternal.motion");if(m==="off"){d.dataset.motion="off";}' +
  'if(m!=="off"&&!sessionStorage.getItem("eternal.loaded")&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.loading="1";}}catch(e){}})();';

export function MotionScript() {
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
