;; REPL: splash page iteration. Builds org -> HTML with the purple skin so the
;; result can be screenshotted and argued about.
;;
;; THEME env var picks the palette: dark (default) or light.
(require 'package)
(package-initialize)
(require 'htmlize nil t)
(require 'ox-publish)

(setq org-html-htmlize-output-type 'css
      org-html-head-include-default-style nil
      org-html-head-include-scripts nil
      org-html-validation-link nil
      org-export-with-section-numbers nil)

(defvar nk-theme (or (getenv "THEME") "sepia"))
;; LAYOUT: markbig  = 160px mark, wordmark unchanged
;;         wordsmall = 96px mark, wordmark down to 2.4rem
(defvar nk-layout (or (getenv "LAYOUT") "wordsmall"))
(defvar nk-mark-size (if (string= nk-layout "wordsmall") "96px" "160px"))
(defvar nk-title-size (if (string= nk-layout "wordsmall")
                          "2.4rem"
                        "clamp(2.6rem, 8vw, 3.6rem)"))

;; 2010-era dark: mid greys and warm browns, not near-black.

;; Zenburn. The canonical Emacs dark theme, olive-tinted warm grey.
(defvar nk-zenburn "
  --bg:#3f3f3f; --panel:#4a4a4a; --ink:#dcdccc; --muted:#9d9d84;
  --line:#5f5f5f; --accent:#c8a3e0; --accent-2:#a68ac0; --code-bg:#383838;
")

;; Sepia. Warm brown, closer to a terminal on a CRT than to a code editor.
(defvar nk-sepia "
  --bg:#372f2b; --panel:#443a35; --ink:#e0d6c8; --muted:#a8998a;
  --line:#56483f; --accent:#c9a3e6; --accent-2:#a880c8; --code-bg:#2f2825;
")

;; Slate. Neutral mid grey, the plain 2010 default.
(defvar nk-slate "
  --bg:#353535; --panel:#404040; --ink:#dedede; --muted:#9a9a9a;
  --line:#525252; --accent:#c5a0e8; --accent-2:#a37fd0; --code-bg:#2d2d2d;
")

;; HIER: how many things on screen are purple.
;;   flat  = h1, h2, strong and links all the accent (current)
;;   two   = h1 bright, everything else one dimmer purple
;;   spare = only the h1 and the mark are purple; the rest is ink
(defvar nk-hier (or (getenv "HIER") "flat"))
(defvar nk-h2-colour   (cond ((string= nk-hier "flat") "var(--accent)")
                             ((string= nk-hier "two")  "var(--accent-2)")
                             (t "var(--ink)")))
(defvar nk-strong-colour (cond ((string= nk-hier "flat") "var(--accent)")
                               ((string= nk-hier "two")  "var(--accent-2)")
                               (t "var(--ink)")))
(defvar nk-link-colour (cond ((string= nk-hier "flat") "var(--accent)")
                             ((string= nk-hier "two")  "var(--accent-2)")
                             (t "var(--ink)")))

(setq org-html-head
      (concat "<link rel=\"icon\" href=\"mark.svg\" type=\"image/svg+xml\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
<style>
:root {" (cond ((string= nk-theme "sepia") nk-sepia)
                ((string= nk-theme "slate") nk-slate)
                (t nk-zenburn)) "}
* { box-sizing: border-box; }
body {
  margin:0; background:var(--bg); color:var(--ink);
  font: 16px/1.65 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
}
#content { max-width: 46rem; margin: 0 auto; padding: 3.5rem 1.5rem 5rem; }
.title, .subtitle { display: none; }

.hero { text-align:center; padding: 1rem 0 2.25rem; }
.hero.compact { padding: .5rem 0 1.5rem; }
.hero.compact h1 { font-size: 2rem; }
.hero.compact .mark { width:64px; height:64px; }
.hero .mark { display:block; margin: 0 auto .75rem; width:" nk-mark-size "; height:" nk-mark-size "; }
.hero h1 {
  margin:0; font-size:" nk-title-size "; letter-spacing:-.03em;
  font-weight: 700; color: var(--accent);
}
.tagline { margin:.4rem 0 0; color: var(--muted); font-size:1.06rem; }

h2 {
  margin: 2.75rem 0 .75rem; font-size:1.12rem; font-weight:650;
  letter-spacing:.02em; color: " nk-h2-colour ";
}
p, li { color: var(--ink); }
ol, ul { padding-left: 1.15rem; }
li { margin:.4rem 0; }
b, strong { color: " nk-strong-colour "; font-weight:650; }

a { color: " nk-link-colour "; text-decoration: none; border-bottom:1px solid var(--line); }
a:hover { border-bottom-color: var(--accent); }
footer { margin-top:3.5rem; padding-top:1.25rem; border-top:1px solid var(--line);
         color:var(--muted); font-size:.94rem; }
footer a { color: var(--muted); border-bottom:none; }
footer a:hover { color: var(--accent); }

.org-src-container { margin: 1.5rem 0; }
pre.src {
  background: var(--code-bg); border:1px solid var(--line); border-radius:8px;
  padding: .9rem 1.1rem; overflow-x:auto; font-size:.94rem;
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
}
code { background: var(--code-bg); padding:.1em .35em; border-radius:4px; font-size:.93em; }

.org-keyword { color:#c9a9f0; } .org-builtin { color:#8fd3f4; }
.org-string  { color:#b7e6a6; } .org-variable-name { color:#f0c9a9; }
.org-comment, .org-comment-delimiter { color: var(--muted); font-style: italic; }

#postamble { display:none; }
/* Copy button. Lives inside the code block, top right. */
.org-src-container { position: relative; }
.copy-btn {
  position:absolute; top:.5rem; right:.5rem;
  width:2rem; height:2rem; padding:0;
  display:grid; place-items:center;
  background:transparent; border:1px solid var(--line); border-radius:6px;
  color:var(--muted); cursor:pointer;
  opacity:0; transition:opacity .15s ease, color .15s ease, border-color .15s ease;
}
.org-src-container:hover .copy-btn,
.copy-btn:focus-visible { opacity:1; }
.copy-btn:hover { color:var(--accent); border-color:var(--accent); }
.copy-btn svg { width:15px; height:15px; fill:none; stroke:currentColor; stroke-width:1.8; }
/* Short blocks centre the button; tall ones pin it to the top, where it reads
   as belonging to the block rather than to whichever line it happens to sit
   beside. top/bottom 0 with margin auto centres without a transform, leaving
   transform free for the click animation. */
.copy-btn.centred { top:0; bottom:0; margin:auto 0; }
.copy-btn::after {
  content:\"\"; position:absolute; inset:-1px; border-radius:6px;
  border:1px solid var(--accent); opacity:0; pointer-events:none;
}
.copy-btn.copied { color:var(--accent); border-color:var(--accent); animation: nk-press .28s ease; }
.copy-btn.copied::after { animation: nk-ring .55s ease-out; }
@keyframes nk-press { 0%{transform:scale(1)} 45%{transform:scale(.88)} 100%{transform:scale(1)} }
@keyframes nk-ring  { 0%{opacity:.9; transform:scale(1)} 100%{opacity:0; transform:scale(1.9)} }
@media (prefers-reduced-motion: reduce) {
  .copy-btn.copied, .copy-btn.copied::after { animation:none; }
}
</style>
<script>
document.addEventListener('DOMContentLoaded', function () {
  var ICON = '<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">' +
    '<rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2\"/>' +
    '<path d=\"M5 15V5a2 2 0 0 1 2-2h10\"/></svg>';
  document.querySelectorAll('.org-src-container').forEach(function (box) {
    var pre = box.querySelector('pre');
    if (!pre) return;
    var b = document.createElement('button');
    b.className = 'copy-btn';
    b.type = 'button';
    b.innerHTML = ICON;
    b.setAttribute('aria-label', 'Copy to clipboard');
    b.addEventListener('click', function () {
      navigator.clipboard.writeText(pre.innerText.trimEnd()).then(function () {
        b.classList.remove('copied');
        void b.offsetWidth;
        b.classList.add('copied');
        setTimeout(function () { b.classList.remove('copied'); }, 600);
      });
    });
    if (pre.innerText.trim().split('\\n').length === 1) b.classList.add('centred');
    box.appendChild(b);
  });
});
</script>"))

;; svg needs the attachment publisher, org files the html one
(setq org-publish-project-alist
      `(("splash-org"
         :base-directory "./org" :base-extension "org"
         :publishing-directory "./www" :recursive t
         :publishing-function org-html-publish-to-html)
        ("splash-assets"
         :base-directory "./org" :base-extension "svg\\|png"
         :publishing-directory "./www" :recursive t
         :publishing-function org-publish-attachment)
        ("splash" :components ("splash-org" "splash-assets"))))

(org-publish-all t)
(message "built theme=%s" nk-theme)
