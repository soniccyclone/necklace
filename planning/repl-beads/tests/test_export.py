from reporting.export import export_csv


class FakeDB:
    def __init__(self, rows):
        self.rows = rows

    def query(self, sql, tenant_id):
        return self.rows


def test_export_csv_has_header():
    db = FakeDB([])
    assert export_csv("t1", db).splitlines()[0] == "id,occurred_at,amount_cents,description"
