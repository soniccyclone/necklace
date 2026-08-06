;; REPL: does htmlize actually fontify our code blocks, and what classes does
;; it emit for the skin to colour?
;;
;; Falsification: if the output is still plain <pre> with no spans, htmlize is
;; not engaging and the site has to style unhighlighted code.
(require 'package)
(package-initialize)
(require 'htmlize nil t)
(require 'ox-publish)

(setq org-html-htmlize-output-type 'css)   ; classes, not inline styles
(setq org-html-head-include-default-style nil)  ; org ships ~200 lines of CSS
(setq org-html-head-include-scripts nil)

(setq org-publish-project-alist
      '(("probe" :base-directory "./org" :base-extension "org"
         :publishing-directory "./www" :recursive t
         :publishing-function org-html-publish-to-html
         :auto-sitemap t :sitemap-filename "sitemap.org")))
(org-publish-all t)
(message "published")
