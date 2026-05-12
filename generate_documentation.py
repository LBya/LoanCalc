#!/usr/bin/env python3
"""
generate_documentation.py - LoanCalc Documentation Generator

Generate a single Markdown document capturing:

1. The full ASCII tree of the project repository.
2. Embedded contents of all relevant source files.
3. Excludes dependencies, build artifacts, and local dev files.

Usage
-----
python generate_documentation.py
python generate_documentation.py --root . --output LoanCalc_struc_20260511.md
"""
from __future__ import annotations

import argparse
import fnmatch
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Set
import re

# ── Static Configuration ──────────────────────────────────────────────────

PROJECT_NAME: str = "LoanCalc"
REPO_ROOT_DEFAULT: Path = Path(__file__).resolve().parent

EXCLUDED_PATTERNS_BASE: List[str] = [
    # This script itself
    "generate_documentation.py",

    # Dependencies and build output
    "node_modules/**", "node_modules/",
    "dist/**", "dist/",

    # Virtual environments
    ".venv/", "**/.venv/**",
    "venv/", "**/venv/**",

    # Local dev / export artifacts
    "export_log/**", "export_log/",

    # Git
    "**/.git/**",

    # IDE and editor files
    "**/.idea/**",
    "**/.vscode/**",
    "**/*.swp", "**/*.swo", "**/*~",
    "**/.cursorignore", "**/.cursorrules",

    # Environment files
    "**/.env", "**/.env.*",

    # Lock files (deps are summarised from package.json instead)
    "package-lock.json",


    # Generated structure docs (prevent recursion)
    "*struc_*.md", "**/*struc_*.md",

    # Binary files
    "**/*.exe", "**/*.dll",
    "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif", "**/*.webp", "**/*.ico",
    "**/*.woff", "**/*.woff2",
    "**/*.db", "**/*.sqlite",

    # Log and temp files
    "**/*.log", "**/temp/**", "**/tmp/**",
]

ALWAYS_INCLUDE_PATTERNS_BASE: List[str] = []

# File types to embed in the output
EMBED_EXTENSIONS: Set[str] = {
    # JavaScript / React
    ".js", ".jsx",
    # Styles
    ".css",
    # Config
    ".json", ".yaml", ".yml",
    # Tests
    ".test.js",
    # Web
    ".html",
    # Build config
    ".config.js",
}

ALWAYS_EMBED_FILENAMES: Set[str] = {
    ".gitignore",
}

TREE_EXTENSIONS: Set[str] = EMBED_EXTENSIONS | {".json"}

MAX_EMBED_SIZE_KB = 400
MAX_EMBED_LINES = 5000

# Runtime state
PROJECT_ROOT: Optional[Path] = None
RUNTIME_EXCLUDES: Set[Path] = set()
ACTIVE_EXCLUDE_PATTERNS: List[str] = []
ACTIVE_ALWAYS_INCLUDE_PATTERNS: List[str] = []


# ── Helper Functions ───────────────────────────────────────────────────────

def matches_pattern(path_str: str, pattern: str) -> bool:
    if pattern == path_str:
        return True
    if '*' not in pattern and '**' not in pattern:
        return path_str == pattern
    if '**' in pattern:
        regex_pattern = pattern.replace('**/', '(.*/)?').replace('/**', '(/.*)?')
        regex_pattern = regex_pattern.replace('**', '.*')
        regex_pattern = '^' + regex_pattern + '$'
        try:
            return bool(re.match(regex_pattern, path_str))
        except re.error:
            if '/**' in pattern:
                return path_str.startswith(pattern.replace('/**', ''))
            elif '**/' in pattern:
                suffix = pattern.replace('**/', '')
                return path_str.endswith(suffix) or suffix in path_str
            return pattern.replace('**', '') in path_str
    return fnmatch.fnmatch(path_str, pattern)


def is_excluded(path: Path) -> bool:
    if path.resolve() in RUNTIME_EXCLUDES:
        return True
    if not PROJECT_ROOT:
        return False
    try:
        rel_path_str = path.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        return True
    if any(matches_pattern(rel_path_str, p) for p in ACTIVE_ALWAYS_INCLUDE_PATTERNS):
        return False
    return any(matches_pattern(rel_path_str, p) for p in ACTIVE_EXCLUDE_PATTERNS)


def should_show_in_tree(path: Path) -> bool:
    if path.name in ALWAYS_EMBED_FILENAMES:
        return True
    return path.suffix.lower() in TREE_EXTENSIONS


def should_embed(path: Path) -> bool:
    embeddable = (
        path.name in ALWAYS_EMBED_FILENAMES
        or path.suffix.lower() in EMBED_EXTENSIONS
    )
    if not embeddable:
        return False
    try:
        if path.stat().st_size / 1024 > MAX_EMBED_SIZE_KB:
            return False
        with path.open("r", encoding="utf-8", errors="ignore") as fh:
            for i, _ in enumerate(fh, 1):
                if i > MAX_EMBED_LINES:
                    return False
    except (OSError, UnicodeDecodeError):
        return False
    return True


def read_text(path: Path) -> str:
    for enc in ("utf-8", "latin-1", "ascii"):
        try:
            return path.read_text(encoding=enc)
        except UnicodeDecodeError:
            continue
        except Exception as e:
            return f"[Error reading {path.name}: {e}]"
    return f"[Unable to decode {path.name}]"


def walk(base: Path):
    try:
        entries = sorted(base.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
    except OSError:
        return
    for item in entries:
        if is_excluded(item):
            continue
        if item.is_dir():
            yield item
            yield from walk(item)
        elif item.is_file():
            yield item


def walk_tree(base: Path, prefix: str = "") -> List[str]:
    lines: List[str] = []
    top_level = [p for p in sorted(base.iterdir()) if not is_excluded(p)]
    for idx, item in enumerate(top_level):
        connector = "└── " if idx == len(top_level) - 1 else "├── "
        extension = "    " if idx == len(top_level) - 1 else "│   "
        if item.is_dir():
            lines.append(f"{prefix}{connector}{item.name}/")
            lines.extend(walk_tree_recursive(item, prefix + extension))
        elif should_show_in_tree(item):
            lines.append(f"{prefix}{connector}{item.name}")
    return lines


def walk_tree_recursive(base: Path, prefix: str = "") -> List[str]:
    try:
        entries = sorted(base.iterdir())
    except OSError:
        return []
    lines: List[str] = []
    visible = [p for p in entries if not is_excluded(p)]
    for idx, item in enumerate(visible):
        connector = "└── " if idx == len(visible) - 1 else "├── "
        next_prefix = "    " if idx == len(visible) - 1 else "│   "
        if item.is_dir():
            lines.append(f"{prefix}{connector}{item.name}/")
            lines.extend(walk_tree_recursive(item, prefix + next_prefix))
        elif should_show_in_tree(item):
            lines.append(f"{prefix}{connector}{item.name}")
    return lines


SUFFIX_LANG_MAP = {
    ".js": "javascript",
    ".jsx": "jsx",
    ".css": "css",
    ".json": "json",
    ".html": "html",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".py": "python",
    ".sh": "bash",
    ".md": "markdown",
}


def generate_deps_table(project_root: Path) -> List[str]:
    """Parse package.json and return a markdown table of dependencies."""
    pkg_path = project_root / "package.json"
    if not pkg_path.exists():
        return []
    try:
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []

    lines: List[str] = []
    for section in ("dependencies", "devDependencies"):
        deps = pkg.get(section)
        if not deps:
            continue
        lines.append(f"**{section}:**\n")
        lines.append("| Package | Version |")
        lines.append("|---------|---------|")
        for name, version in sorted(deps.items()):
            lines.append(f"| {name} | `{version}` |")
        lines.append("")
    return lines


def embed_all_files(project_root: Path, markdown: List[str]) -> None:
    print("[*] Embedding source files...")
    count = 0
    for path in walk(project_root):
        if not path.is_file() or not should_embed(path):
            continue
        rel = path.relative_to(project_root).as_posix()
        size_kb = path.stat().st_size / 1024
        line_cnt = sum(1 for _ in path.open("r", encoding="utf-8", errors="ignore"))
        lang = SUFFIX_LANG_MAP.get(path.suffix.lower(), path.suffix.lstrip("."))
        markdown.append(f"### `{rel}` (_{size_kb:.1f} KB, {line_cnt} lines_)\n")
        markdown.append(f"```{lang}")
        markdown.append(read_text(path))
        markdown.append("```\n")
        count += 1
    print(f"[*] Embedded {count} files.")


# ── Core Generation ────────────────────────────────────────────────────────

def generate_doc(project_root: Path, output_md: Path) -> None:
    print(f"[*] Generating {PROJECT_NAME} documentation from: {project_root}")
    RUNTIME_EXCLUDES.add(output_md.resolve())

    md: List[str] = [f"# {PROJECT_NAME} - Project Structure Documentation\n"]
    md.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    md.append("## Project Overview\n")
    md.append(
        "Interactive home loan scenario comparison tool. "
        "Client-side React SPA with a pure JS calculation engine. "
        "Compare up to 4 loan repayment strategies with live charts, offset/FHSS modeling, and dynamic insights.\n"
    )
    md.append("## Directory Tree\n```")
    md.extend(walk_tree(project_root))
    md.append("```\n")

    deps = generate_deps_table(project_root)
    if deps:
        md.append("## Dependencies\n")
        md.extend(deps)

    md.append("## Source Code Files\n")
    embed_all_files(project_root, md)

    output_md.parent.mkdir(parents=True, exist_ok=True)
    output_md.write_text("\n".join(md), encoding="utf-8")
    print(f"[*] Documentation written to: {output_md}")


# ── CLI ────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    default_output = REPO_ROOT_DEFAULT / f"{PROJECT_NAME}_struc_{timestamp}.md"
    p = argparse.ArgumentParser(
        description=f"Generate a Markdown tree + embedded-source doc for {PROJECT_NAME}."
    )
    p.add_argument("--root", type=Path, default=REPO_ROOT_DEFAULT,
                   help="Project root (default: script directory)")
    p.add_argument("--output", type=Path, default=default_output,
                   help=f"Output file (default: {default_output.name})")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    global ACTIVE_EXCLUDE_PATTERNS, ACTIVE_ALWAYS_INCLUDE_PATTERNS, PROJECT_ROOT
    ACTIVE_EXCLUDE_PATTERNS = EXCLUDED_PATTERNS_BASE.copy()
    ACTIVE_ALWAYS_INCLUDE_PATTERNS = ALWAYS_INCLUDE_PATTERNS_BASE.copy()
    root = args.root.resolve()
    PROJECT_ROOT = root
    if not root.is_dir():
        raise SystemExit(f"Error: '{root}' is not a directory.")
    try:
        generate_doc(root, args.output)
    finally:
        print("[*] Done.")


if __name__ == "__main__":
    main()
