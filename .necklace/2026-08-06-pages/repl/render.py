# REPL: does a five-bead necklace read as anything at favicon size?
# Falsification: if the 16px render is an indistinct blob, the design needs
# fewer or larger elements and "5 beads, centre largest" does not survive
# contact with a browser tab.
import cairosvg
for size in (16, 32, 128):
    cairosvg.svg2png(url="icon.svg", write_to=f"probe-{size}.png",
                     output_width=size, output_height=size)
    print(f"rendered {size}px")
