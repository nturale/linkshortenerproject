#!/usr/bin/env python3
"""
Plot a bar chart of links created per month over the past 12 months.
Reads DATABASE_URL from .env.local in the current working directory.
"""

import argparse
import os
import sys
from datetime import date, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# Dependency check
# ---------------------------------------------------------------------------
try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    sys.exit("Missing dependency: run  pip install psycopg2-binary")

try:
    import matplotlib
    matplotlib.use("Agg")          # headless / no display required
    import matplotlib.pyplot as plt
    import matplotlib.ticker as mticker
except ImportError:
    sys.exit("Missing dependency: run  pip install matplotlib")

try:
    from dotenv import load_dotenv
except ImportError:
    sys.exit("Missing dependency: run  pip install python-dotenv")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_database_url() -> str:
    """Load DATABASE_URL from .env.local, falling back to environment."""
    env_path = Path(".env.local")
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    else:
        # Try plain .env as a fallback
        load_dotenv(dotenv_path=Path(".env"), override=True)

    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit(
            "DATABASE_URL not found. "
            "Make sure .env.local exists in the project root and contains DATABASE_URL=..."
        )

    # psycopg2/libpq does not recognise the Neon-specific `channel_binding=requirenp`
    # value.  Strip it so the connection does not fail with "invalid channel_binding value".
    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
    parsed = urlparse(url)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    qs.pop("channel_binding", None)
    cleaned = urlunparse(parsed._replace(query=urlencode(qs, doseq=True)))
    return cleaned


def build_month_range(months: int = 12) -> list[date]:
    """Return the first-day-of-month for each of the past `months` months, oldest first."""
    today = date.today()
    # Start from the 1st of the month `months` ago
    result = []
    year, month = today.year, today.month
    for _ in range(months):
        result.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    result.reverse()
    return result


def query_monthly_counts(url: str, months: int = 12) -> dict[date, int]:
    """
    Return {first_of_month: count} for the past `months` calendar months.
    Months with no links are NOT included — caller must fill gaps.
    """
    # The earliest date we care about
    month_range = build_month_range(months)
    since = month_range[0]  # first day of the oldest month

    sql = """
        SELECT
            DATE_TRUNC('month', created_at AT TIME ZONE 'UTC')::date AS month,
            COUNT(*)::int AS link_count
        FROM links
        WHERE created_at >= %(since)s
        GROUP BY month
        ORDER BY month;
    """

    conn = None
    try:
        conn = psycopg2.connect(url)
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(sql, {"since": since})
            rows = cur.fetchall()
    except psycopg2.OperationalError as exc:
        sys.exit(f"Database connection error: {exc}")
    finally:
        if conn:
            conn.close()

    return {row["month"]: row["link_count"] for row in rows}


def plot_chart(month_labels: list[str], counts: list[int], output_path: str) -> None:
    """Render and save the bar chart."""
    fig, ax = plt.subplots(figsize=(14, 6))

    bar_color = "#4F8EF7"
    bars = ax.bar(month_labels, counts, color=bar_color, edgecolor="white", width=0.6)

    # Add value labels on top of each bar
    for bar, count in zip(bars, counts):
        if count > 0:
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + max(counts) * 0.01,
                str(count),
                ha="center",
                va="bottom",
                fontsize=9,
                color="#333333",
            )

    ax.set_title("Links Created per Month (Past 12 Months)", fontsize=15, fontweight="bold", pad=16)
    ax.set_xlabel("Month", fontsize=11, labelpad=10)
    ax.set_ylabel("Links Created", fontsize=11, labelpad=10)

    ax.yaxis.set_major_locator(mticker.MaxNLocator(integer=True))
    ax.set_ylim(0, max(counts) * 1.15 if any(c > 0 for c in counts) else 10)

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.tick_params(axis="x", rotation=35)
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    plt.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export a bar chart of links created per month to a PNG."
    )
    parser.add_argument(
        "--output",
        default="links-monthly-chart.png",
        help="Output PNG path (default: links-monthly-chart.png)",
    )
    parser.add_argument(
        "--months",
        type=int,
        default=12,
        help="Number of past months to include (default: 12)",
    )
    args = parser.parse_args()

    database_url = load_database_url()

    print(f"Querying database for the past {args.months} months…")
    raw_counts = query_monthly_counts(database_url, args.months)

    # Build the full month list (fill gaps with 0)
    month_range = build_month_range(args.months)
    month_labels = [d.strftime("%b %Y") for d in month_range]
    counts = [raw_counts.get(d, 0) for d in month_range]

    print("\nMonthly link counts:")
    for label, count in zip(month_labels, counts):
        bar = "#" * count if count <= 50 else "#" * 50 + f"  (+{count - 50})"
        print(f"  {label:>10}  {count:>5}  {bar}")

    print(f"\nRendering chart → {args.output}")
    plot_chart(month_labels, counts, args.output)
    print(f"Done. Chart saved to: {Path(args.output).resolve()}")


if __name__ == "__main__":
    main()
