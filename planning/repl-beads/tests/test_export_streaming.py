"""CUJ-01: Export memory stops tracking tenant size."""
import tracemalloc


def rows(n, boom_at=None):
    for i in range(n):
        if boom_at is not None and i == boom_at:
            raise RuntimeError("row source failed")
        yield {"id": i, "occurred_at": "2026-01-01T00:00:00Z",
               "amount_cents": 1000, "description": "x" * 40}


class FakeDB:
    def __init__(self, gen):
        self.gen = gen

    def query(self, sql, tenant_id):
        return self.gen


def peak_bytes(fn):
    tracemalloc.start()
    fn()
    peak = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    return peak


def test_export_peak_memory_is_flat_across_sizes():
    from reporting.export import export_rows
    small = peak_bytes(lambda: [c for c in export_rows("t1", FakeDB(rows(10_000)))])
    large = peak_bytes(lambda: [c for c in export_rows("t1", FakeDB(rows(200_000)))])
    assert large < small * 2, f"peak grew with row count: {small} -> {large}"


def test_export_yields_before_consuming_all_rows():
    from reporting.export import export_rows
    emitted = []
    try:
        for chunk in export_rows("t1", FakeDB(rows(1000, boom_at=100))):
            emitted.append(chunk)
    except RuntimeError:
        pass
    assert len(emitted) >= 50, f"only {len(emitted)} chunks emitted before the source failed"


def test_export_header_precedes_first_row():
    from reporting.export import export_rows
    stream = export_rows("t1", FakeDB(rows(2)))
    assert next(stream).startswith("id,occurred_at,amount_cents,description")
