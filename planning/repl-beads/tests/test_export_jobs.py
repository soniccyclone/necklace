"""CUJ-02: Export request returns a job id inside the gateway budget."""
import time


class CountingDB:
    def __init__(self, n):
        self.n = n
        self.rows_read = 0

    def query(self, sql, tenant_id):
        def gen():
            for i in range(self.n):
                self.rows_read += 1
                yield {"id": i, "occurred_at": "2026-01-01T00:00:00Z",
                       "amount_cents": 1000, "description": "x" * 40}
        return gen()


def test_export_request_returns_job_id_immediately():
    from reporting.jobs import request_export
    db = CountingDB(2_300_000)
    job_id = request_export("northwind", db)
    assert job_id
    assert db.rows_read == 0, f"request read {db.rows_read} rows; it must not touch the data"


def test_export_request_latency_independent_of_tenant_size():
    from reporting.jobs import request_export
    t = time.perf_counter(); request_export("small", CountingDB(1_000))
    small = time.perf_counter() - t
    t = time.perf_counter(); request_export("northwind", CountingDB(2_300_000))
    large = time.perf_counter() - t
    assert large < max(small, 1e-4) * 10, f"latency scaled with tenant size: {small} -> {large}"
