from __future__ import annotations

from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
FEATURES_DIR = ROOT / "apps" / "desktop-ui" / "src" / "features"
APP_DIR = ROOT / "apps" / "desktop-ui" / "src" / "app"

IMPORT_RE = re.compile(r"^\s*import\s+.*?from\s+[\"']([^\"']+)[\"']")

ALLOWED_IPC_IMPORTERS = {
    "apps/desktop-ui/src/features/ui-store.ts",
    "apps/desktop-ui/src/features/ui-store.project.ts",
    "apps/desktop-ui/src/features/ui-store.analysis.ts",
    "apps/desktop-ui/src/features/ui-store.persistence.ts",
    "apps/desktop-ui/src/features/ui-store.timeline.ts",
}


def is_ipc_client_import(source: str) -> bool:
    normalized = source.replace("\\", "/")
    return normalized.endswith("ipc/client") or "ipc/client" in normalized


def main() -> int:
    violations: list[str] = []

    for root in (FEATURES_DIR, APP_DIR):
        for path in root.rglob("*"):
            if path.suffix not in {".ts", ".tsx"}:
                continue
            if path.name.endswith(".test.ts") or path.name.endswith(".test.tsx"):
                continue

            rel = path.relative_to(ROOT).as_posix()
            content = path.read_text(encoding="utf-8")
            for index, line in enumerate(content.splitlines(), start=1):
                match = IMPORT_RE.match(line)
                if not match:
                    continue
                source = match.group(1)

                if root == FEATURES_DIR:
                    if source.startswith("@/app/") or "/app/" in source:
                        violations.append(f"{rel}:{index} imports forbidden app layer: {source}")

                if source.startswith("@tauri-apps/"):
                    violations.append(f"{rel}:{index} imports tauri API directly: {source}")

                if is_ipc_client_import(source) and rel not in ALLOWED_IPC_IMPORTERS:
                    violations.append(
                        f"{rel}:{index} imports ipc client directly but is not in allowlist: {source}"
                    )

    if violations:
        print("Architecture boundary violations detected:")
        for violation in violations:
            print(f" - {violation}")
        return 1

    print("Architecture boundary check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
