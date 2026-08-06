;; REPL: what ids and classes does org-publish actually emit, and does it
;; survive our content? The skin hooks whatever this produces.
;;
;; Falsification: if there are no stable ids, a skin has nothing to target and
;; the approach needs a custom template instead of CSS.
(require 'ox-publish)
(setq org-publish-project-alist
      '(("probe" :base-directory "./org" :base-extension "org"
         :publishing-directory "./www" :recursive t
         :publishing-function org-html-publish-to-html
         :auto-sitemap t :sitemap-filename "sitemap.org")))
(org-publish-all t)
(message "published")
