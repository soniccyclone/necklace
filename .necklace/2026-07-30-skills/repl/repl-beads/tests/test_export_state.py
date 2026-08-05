"""CUJ-03: Customer distinguishes running, ready, and failed."""
import pytest


def test_export_state_is_running_before_completion():
    from reporting.jobs import request_export, get_export
    from tests.test_export_jobs import CountingDB
    job_id = request_export("northwind", CountingDB(1_000))
    export = get_export(job_id)
    assert export.state == "running"
    assert export.artifact is None


def test_export_state_is_ready_with_artifact():
    from reporting.jobs import request_export, get_export, run_export
    from tests.test_export_jobs import CountingDB
    job_id = request_export("t1", CountingDB(3))
    run_export(job_id)
    export = get_export(job_id)
    assert export.state == "ready"
    assert export.artifact is not None
    assert len(export.artifact.splitlines()) == 4  # header + 3 rows


def test_export_failure_reports_a_reason():
    from reporting.jobs import request_export, get_export, run_export

    class ExplodingDB:
        def query(self, sql, tenant_id):
            raise RuntimeError("connection reset by peer")

    job_id = request_export("t1", ExplodingDB())
    run_export(job_id)
    export = get_export(job_id)
    assert export.state == "failed"
    assert export.reason
    assert "Traceback" not in export.reason


def test_unknown_job_id_is_not_reported_as_running():
    from reporting.jobs import get_export, UnknownExport
    with pytest.raises(UnknownExport):
        get_export("job-that-was-never-issued")
