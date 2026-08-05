"""Transaction export for the reporting API."""


def fetch_transactions(tenant_id, db):
    """Return every transaction row for a tenant."""
    return db.query("SELECT * FROM transactions WHERE tenant_id = ?", tenant_id)


def export_csv(tenant_id, db):
    """Build a CSV of every transaction for a tenant.

    Buffers the whole result set in memory before returning.
    """
    rows = fetch_transactions(tenant_id, db)
    lines = ["id,occurred_at,amount_cents,description"]
    for r in rows:
        lines.append(f"{r['id']},{r['occurred_at']},{r['amount_cents']},{r['description']}")
    return "\n".join(lines)
