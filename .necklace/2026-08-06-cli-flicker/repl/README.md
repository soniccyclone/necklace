# repl: CLI prompt flicker

    npm i
    node demo.mjs current     # what ships today
    node demo.mjs onewrite    # the same output in one write
    node demo.mjs inquirer    # @inquirer/checkbox off the shelf
    node demo.mjs core        # rebuilt on @inquirer/core

Hold an arrow key down in each. Findings in `../ledger.md`.

    node drive.cjs current    # counts writes per frame
    node smoke.cjs core       # asserts a mode still selects and confirms

Then resize the window narrow (under ~60 columns) and try `onewrite` against
`core`. That is the one comparison the probes could not settle.
