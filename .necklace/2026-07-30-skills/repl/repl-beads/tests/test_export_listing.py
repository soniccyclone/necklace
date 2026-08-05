"""CUJ-04: Support lists a tenant's exports and their states."""


def test_exports_listable_by_tenant():
    from reporting.jobs import request_export, run_export, list_exports
    from tests.test_export_jobs import CountingDB

    class ExplodingDB:
        def query(self, sql, tenant_id):
            raise RuntimeError("connection reset by peer")

    first = request_export("northwind", ExplodingDB())
    run_export(first)
    second = request_export("northwind", CountingDB(5))

    listed = list_exports("northwind")
    ids = [e.id for e in listed]
    assert ids == [second, first], "newest first"
    assert {e.state for e in listed} == {"running", "failed"}


def test_listing_includes_failure_reason():
    from reporting.jobs import request_export, run_export, list_exports

    class ExplodingDB:
        def query(self, sql, tenant_id):
            raise RuntimeError("connection reset by peer")

    request_export("acme", ExplodingDB())
    run_export(list_exports("acme")[0].id)
    failed = list_exports("acme")[0]
    assert failed.state == "failed"
    assert failed.reason, "reason must be present in the listing without a second lookup"
