;; REPL: can org include the real SKILL.md files, so the docs pages cannot
;; drift from the skills they describe?
;;
;; Falsification: if INCLUDE cannot reach outside the base directory, or
;; mangles markdown, the docs have to be written by hand and kept in step.
(require 'package) (package-initialize) (require 'htmlize nil t) (require 'ox-publish)
(setq org-html-head-include-default-style nil org-html-validation-link nil)
(setq org-publish-project-alist
      '(("p" :base-directory "./org" :base-extension "org"
         :publishing-directory "./www" :recursive t
         :publishing-function org-html-publish-to-html)))
(org-publish-all t)
(message "built")
