"""REPL: does export_csv stream or buffer? What does 2.3M rows cost?

Falsification: if peak memory tracks a constant rather than row count,
the buffering theory is wrong and the 30s gateway timeout is the real bind.
"""
import sys, tracemalloc
sys.path.insert(0, "../../..")
from reporting.export import export_csv

class FakeDB:
    def __init__(self, n): self.n = n
    def query(self, sql, tenant_id):
        return ({"id": i, "occurred_at": "2026-01-01T00:00:00Z",
                 "amount_cents": 1000, "description": "x" * 40} for i in range(self.n))

for n in (1_000, 10_000, 100_000):
    tracemalloc.start()
    out = export_csv("t1", FakeDB(n))
    peak = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    print(f"rows={n:>7}  peak={peak/1e6:8.2f} MB  chars={len(out):>9}")
