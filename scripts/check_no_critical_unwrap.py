from __future__ import annotations

from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]

SCAN_ROOTS = [
    ROOT / "apps",
    ROOT / "crates",
]

UNWRAP_RE = re.compile(r"\.(unwrap|expect)\s*\(")
TEST_MOD_RE = re.compile(r"^\s*(pub\s+)?mod\s+\w+\s*\{")

ALLOW_TEST_SUFFIXES = (
    ".test.rs",
    "_test.rs",
)


def is_test_file(path: Path) -> bool:
    if path.suffix != ".rs":
        return False
    if path.name.endswith(ALLOW_TEST_SUFFIXES):
        return True
    return "tests" in path.parts or "benches" in path.parts


def should_scan(path: Path) -> bool:
    if path.suffix != ".rs":
        return False
    if is_test_file(path):
        return False
    if "target" in path.parts:
        return False
    return True


def main() -> int:
    violations: list[str] = []
    for root in SCAN_ROOTS:
        for path in root.rglob("*.rs"):
            if not should_scan(path):
                continue
            content = path.read_text(encoding="utf-8")
            in_cfg_test_module = False
            module_depth = 0
            saw_cfg_test = False

            for line_no, line in enumerate(content.splitlines(), start=1):
                stripped = line.strip()

                if stripped == "#[cfg(test)]":
                    saw_cfg_test = True
                    continue

                if saw_cfg_test and TEST_MOD_RE.match(line):
                    in_cfg_test_module = True
                    module_depth = line.count("{") - line.count("}")
                    saw_cfg_test = False
                    continue

                if saw_cfg_test and stripped and not stripped.startswith("#"):
                    saw_cfg_test = False

                if in_cfg_test_module:
                    module_depth += line.count("{") - line.count("}")
                    if module_depth <= 0:
                        in_cfg_test_module = False
                    continue

                if UNWRAP_RE.search(line):
                    violations.append(f"{path.relative_to(ROOT)}:{line_no}: {line.strip()}")

    if violations:
        print("Critical unwrap/expect usage found in runtime Rust code:")
        for entry in violations:
            print(f" - {entry}")
        print("\nReplace with typed error handling in runtime paths.")
        return 1

    print("Critical unwrap/expect check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
