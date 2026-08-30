"""
Streamlit Prototyping Studio Launcher for RekaKarbon ML Engine.
"""

import sys
from pathlib import Path

from streamlit.web import cli as stcli


def main() -> None:
    """Launches the Streamlit development studio dashboard."""
    app_path = Path(__file__).parent / "app.py"
    sys.argv = ["streamlit", "run", str(app_path)]
    sys.exit(stcli.main())


if __name__ == "__main__":
    main()
