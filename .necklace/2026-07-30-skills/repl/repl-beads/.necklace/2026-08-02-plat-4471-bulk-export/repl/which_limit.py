"""REPL: at 2.3M rows, does the 30s gateway timeout or the OOM kill land first?

Falsification: if wall time crosses 30s well before memory gets large,
the timeout is the binding constraint and memory is a red herring.
"""
import sys, time, tracemalloc
sys.path.insert(0, "../../..")
from reporting.export import export_csv

class FakeDB:
    def __init__(self, n): self.n = n
    def query(self, sql, tenant_id):
        return ({"id": i, "occurred_at": "2026-01-01T00:00:00Z",
                 "amount_cents": 1000, "description": "x" * 40} for i in range(self.n))

print(f"{'rows':>9} {'secs':>7} {'peak MB':>9}")
for n in (100_000, 500_000):
    tracemalloc.start(); t = time.perf_counter()
    export_csv("t1", FakeDB(n))
    secs = time.perf_counter() - t
    peak = tracemalloc.get_traced_memory()[1] / 1e6
    tracemalloc.stop()
    print(f"{n:>9} {secs:>7.2f} {peak:>9.1f}")
    print(f"  -> at 2.3M: {secs*2_300_000/n:>6.1f}s  {peak*2_300_000/n:>7.0f} MB")
