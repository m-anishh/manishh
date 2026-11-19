import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def main():
    if DIST.exists():
        shutil.rmtree(DIST)

    shutil.copytree(ROOT / "frontend", DIST)
    shutil.copytree(ROOT / "assets", DIST / "assets")
    shutil.copytree(ROOT / "content", DIST / "content")
    shutil.copy2(ROOT / "robots.txt", DIST / "robots.txt")
    shutil.copy2(ROOT / "sitemap.xml", DIST / "sitemap.xml")
    print("Built static site in dist/")


if __name__ == "__main__":
    main()
