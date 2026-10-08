"""Compatibility CLI for the current source-based reference-model generators.

The earlier frozen-AABB finishing pass is retired. It must not overwrite the
redesigned meshes with the old box/cylinder silhouettes. This command now runs
the complete current generator(s), including their original geometry checks.
"""
from pathlib import Path
import argparse
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ('kawasaki-bx250l', 'nimak-multiframegun')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--asset', choices=ASSETS)
    args = parser.parse_args()
    for asset in (args.asset,) if args.asset else ASSETS:
        command = [sys.executable, str(ROOT / asset / 'tools/generate_model.py')]
        if args.check:
            command.append('--check')
        subprocess.run(command, check=True)

if __name__ == '__main__':
    main()
