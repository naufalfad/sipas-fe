#!/usr/bin/env python3
# agregator_react.py — Frontend React.js / TypeScript / Vite / Next.js
import os
import sys
import re
import argparse
import fnmatch
from pathlib import Path
from typing import Set, List, Tuple

# Set console output encoding to UTF-8
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# =========================================================================
# CONFIGURATION CLASS
# =========================================================================
class AggregatorConfig:
    DEFAULT_TARGET = str(Path(__file__).parent.resolve())
    DEFAULT_OUTPUT = f"{Path(__file__).parent.name}_frontend.txt"

    # 1. Folder Blacklist (Diabaikan secara mutlak)
    FORBIDDEN_DIRS = {
        "node_modules", ".git", "dist", "build", "out", "coverage",
        ".vscode", ".idea", ".next", ".swc", "recovered", "temp", "tmp",
        ".nuxt", ".cache", ".parcel-cache", ".vercel", "dist-ssr", ".expo", ".yarn",
        "storybook-static", "public/assets" # Opsional: abaikan aset besar
    }

    # 2. Berkas Blacklist
    FORBIDDEN_FILES = {
        "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb",
        ".DS_Store", "Thumbs.db", "*.pyc", "favicon.ico"
    }

    # 3. Whitelist Folder React/Frontend (Sangat penting untuk struktur React)
    ALLOWED_DIRS = {
        "src", "public", "components", "hooks", "context", "services",
        "utils", "styles", "pages", "app", "layouts", "features",
        "store", "redux", "types", "assets", "api", "hoc", "constants"
    }

    # 4. Ekstensi Berkas Frontend
    INCLUDE_EXTENSIONS = {
        ".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".sass", 
        ".html", ".json", ".svg", ".md", ".env.example", ".webmanifest"
    }

    # 5. Berkas Konfigurasi Wajib di Root (Vite, Tailwind, TS, etc.)
    ESSENTIAL_ROOT_FILES = {
        "package.json", "vite.config.ts", "vite.config.js", 
        "tailwind.config.js", "tailwind.config.ts", "postcss.config.js",
        "tsconfig.json", "jsconfig.json", "next.config.js", "next.config.mjs",
        ".eslintrc.js", ".eslintrc.json", ".prettierrc", ".env.example",
        "index.html", "components.json" # components.json biasanya untuk shadcn/ui
    }

    MAX_FILE_SIZE_BYTES = 1024 * 1024  # 1 MB

    SENSITIVE_REGEX = re.compile(
        r"(\.env.*|key.*\.pem|.*\.key|id_rsa.*|credentials.*)", 
        re.IGNORECASE
    )


# =========================================================================
# OPTIMIZER CLASS
# =========================================================================
class LLMContextOptimizer:
    @staticmethod
    def strip_js_ts_comments(text: str) -> str:
        pattern = re.compile(
            r'/\*.*?\*/|//.*?$|\'(?:\\.|[^\\\'])*\'|"(?:\\.|[^\\"])*"|`(?:\\.|[^\\`])*`',
            re.DOTALL | re.MULTILINE
        )
        def replacer(match):
            s = match.group(0)
            if s.startswith('/'):
                return ""
            return s
        return re.sub(pattern, replacer, text)

    @staticmethod
    def strip_html_comments(text: str) -> str:
        return re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)

    @classmethod
    def compress_code(cls, content: str, suffix: str = "", strip_comments: bool = True) -> str:
        if strip_comments:
            if suffix in (".js", ".jsx", ".ts", ".tsx", ".css", ".scss"):
                content = cls.strip_js_ts_comments(content)
            elif suffix == ".html":
                content = cls.strip_html_comments(content)

        lines = content.splitlines()
        optimized_lines = []
        previous_empty = False
        
        for line in lines:
            stripped = line.rstrip()
            is_empty = len(stripped) == 0
            if is_empty and previous_empty:
                continue
            optimized_lines.append(stripped)
            previous_empty = is_empty
            
        return "\n".join(optimized_lines)

    @staticmethod
    def is_binary(file_path: Path) -> bool:
        try:
            with open(file_path, 'rb') as f:
                return b'\x00' in f.read(512)
        except Exception:
            return True


# =========================================================================
# AGGREGATOR CONTROLLER
# =========================================================================
class CodebaseAggregator:
    def __init__(self, target_dir: str, output_name: str, strip_comments: bool = True, exclude_tests: bool = False):
        self.config = AggregatorConfig()
        self.optimizer = LLMContextOptimizer()
        self.strip_comments = strip_comments
        self.exclude_tests = exclude_tests
        
        self.target_path = Path(target_dir).resolve()
        if not self.target_path.is_dir():
            self.target_path = Path(__file__).parent.resolve()

        self.output_file = self.target_path / output_name
        self.config.FORBIDDEN_FILES.add(output_name)
        self.config.FORBIDDEN_FILES.add(Path(__file__).name)
        self.gitignore_patterns = self._parse_gitignore()

    def _parse_gitignore(self) -> List[str]:
        patterns = []
        gitignore_path = self.target_path / ".gitignore"
        if gitignore_path.exists():
            try:
                for line in gitignore_path.read_text("utf-8").splitlines():
                    line = line.strip()
                    if line and not line.startswith("#"):
                        patterns.append(line)
            except Exception:
                pass
        return patterns

    def should_ignore(self, path: Path, is_dir: bool = False) -> bool:
        try:
            rel_path = path.relative_to(self.target_path)
        except ValueError:
            rel_path = path
            
        parts = rel_path.parts
        if not parts:
            return False

        for part in parts:
            if part in self.config.FORBIDDEN_DIRS:
                return True

        if not is_dir:
            if path.name in self.config.FORBIDDEN_FILES:
                return True
            if self.config.SENSITIVE_REGEX.match(path.name):
                return True
                
            if self.exclude_tests:
                lower_name = path.name.lower()
                if any(x in lower_name for x in ["test", "spec", "cy", "stories"]):
                    if path.suffix in (".ts", ".tsx", ".js", ".jsx"):
                        return True

        if self.exclude_tests and is_dir:
            if path.name in ("tests", "__tests__", "cypress", "playwright", "__stories__"):
                return True

        rel_path_str = rel_path.as_posix()
        for pattern in self.gitignore_patterns:
            clean_pattern = pattern.lstrip('/')
            is_pattern_dir = pattern.endswith('/')
            match_pattern = clean_pattern.rstrip('/')
            
            if is_pattern_dir and not is_dir:
                continue
                
            if '/' in match_pattern:
                if fnmatch.fnmatch(rel_path_str, match_pattern) or fnmatch.fnmatch(rel_path_str, f"{match_pattern}/*"):
                    return True
            else:
                if any(fnmatch.fnmatch(part, match_pattern) for part in parts):
                    return True
        return False

    def execute(self):
        print(f"🔍 Memulai penggabungan kode FRONTEND: {self.target_path}")
            
        file_count = 0
        original_total_size = 0
        compressed_total_size = 0
        processed_files_stats = []

        try:
            with open(self.output_file, "w", encoding="utf-8") as out_file:
                out_file.write("=== FRONTEND REACT CODEBASE STRUCTURE ===\n\n")

                for root, dirs, files in os.walk(self.target_path):
                    root_path = Path(root)
                    relative_root = root_path.relative_to(self.target_path)
                    is_root_level = len(relative_root.parts) == 0

                    # Filter folder
                    dirs[:] = [d for d in dirs if not self.should_ignore(root_path / d, is_dir=True)]

                    # Hanya izinkan folder yang ada di whitelist jika berada di root
                    if is_root_level:
                        dirs[:] = [d for d in dirs if d in self.config.ALLOWED_DIRS]

                    for file_name in files:
                        file_path = root_path / file_name
                        relative_file_path = file_path.relative_to(self.target_path)
                        is_root_file = len(relative_file_path.parts) == 1

                        if self.should_ignore(file_path, is_dir=False):
                            continue

                        # Filter file root non-esensial
                        if is_root_file and file_name not in self.config.ESSENTIAL_ROOT_FILES:
                            continue

                        # Filter ekstensi (kecuali file root wajib)
                        if not is_root_file and file_path.suffix not in self.config.INCLUDE_EXTENSIONS:
                            continue

                        if self.optimizer.is_binary(file_path):
                            continue

                        try:
                            file_size = file_path.stat().st_size
                            if file_size > self.config.MAX_FILE_SIZE_BYTES:
                                continue

                            content = file_path.read_text("utf-8", errors="ignore")
                            compressed_content = self.optimizer.compress_code(
                                content, 
                                suffix=file_path.suffix, 
                                strip_comments=self.strip_comments
                            )

                            out_file.write(f"\n--- FILE: {relative_file_path} ---\n")
                            out_file.write(compressed_content)
                            out_file.write("\n")

                            file_count += 1
                            comp_size = len(compressed_content.encode('utf-8'))
                            original_total_size += file_size
                            compressed_total_size += comp_size
                            processed_files_stats.append((str(relative_file_path), comp_size))
                            print(f"-> OK: {relative_file_path}")

                        except Exception as e:
                            print(f"-> Skip {relative_file_path}: {e}")

            print(f"\n✅ Selesai! {file_count} Berkas diringkas.")
            print(f"📊 Penghematan: {((original_total_size - compressed_total_size) / original_total_size * 100):.1f}%")

        except Exception as e:
            print(f"Critical Error: {e}")

if __name__ == "__main__":
    config_default = AggregatorConfig()
    parser = argparse.ArgumentParser(description="Aggregator Kode React.js untuk LLM Context")
    parser.add_argument("--dir", type=str, default=config_default.DEFAULT_TARGET, help="Direktori target")
    parser.add_argument("--out", type=str, default=config_default.DEFAULT_OUTPUT, help="Nama output")
    parser.add_argument("--keep-comments", action="store_true", help="Jangan hapus komentar")
    parser.add_argument("--exclude-tests", action="store_true", help="Abaikan file testing & stories")
    
    args = parser.parse_args()
    aggregator = CodebaseAggregator(
        target_dir=args.dir, 
        output_name=args.out,
        strip_comments=not args.keep_comments,
        exclude_tests=args.exclude_tests
    )
    aggregator.execute()