"""Vercel entrypoint: exposes the API as a module-level `app`.

Vercel loads this file directly, so make the `src/` package importable whether or not the
project itself was installed into the environment.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from mindlink.api.app import create_app

app = create_app()
