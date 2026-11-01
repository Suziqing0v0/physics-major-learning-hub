from pathlib import Path
from urllib.parse import quote
from datetime import datetime
import hashlib
import json
import os

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "资料"
OUTPUT = ROOT / "materials-data.js"

GRADE_ORDER = ["大一 上", "大一 下", "大二 上", "大二 下", "大三 上", "大三 下", "大四 上", "大四 下"]
SUPPORTED = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".rar", ".7z", ".txt", ".md"}


def format_size(size):
    if size < 1024:
        return f"{size} B"
    if size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    return f"{size / (1024 * 1024):.1f} MB"


def grade_rank(grade):
    return GRADE_ORDER.index(grade) if grade in GRADE_ORDER else 999


def make_tags(name):
    tags = []
    if "答案" in name:
        tags.append("答案")
    elif "练习" in name:
        tags.append("练习")
    if "题库" in name:
        tags.append("题库")
    if any(key in name for key in ["考试", "样题", "考题", "真题"]):
        tags.append("真题")
    if any(key.lower() in name.lower() for key in ["课件", "ppt"]):
        tags.append("课件")
    if "笔记" in name:
        tags.append("笔记")
    if not tags:
        tags.append("资料")
    return list(dict.fromkeys(tags))


def make_description(tags):
    if "答案" in tags:
        return "练习答案"
    if "题库" in tags:
        return "课程题库"
    if "真题" in tags:
        return "考试真题"
    if "练习" in tags:
        return "课程练习"
    return "课程资料"


def main():
    if not SOURCE.exists():
        raise SystemExit(f"资料目录不存在：{SOURCE}")

    materials = []
    for path in sorted(SOURCE.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED:
            continue

        rel = path.relative_to(SOURCE)
        parts = rel.parts
        grade = parts[0] if len(parts) >= 2 else "未分类"
        subject = parts[1] if len(parts) >= 3 else "未分类"

        name = path.stem
        tags = make_tags(path.name)
        size = path.stat().st_size
        updated = datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d")
        rel_text = str(rel)
        material_id = "m-" + hashlib.md5(rel_text.encode("utf-8")).hexdigest()[:10]
        url = "/".join(["资料"] + [quote(part, safe="") for part in parts])

        materials.append({
            "id": material_id,
            "title": name,
            "fileName": path.name,
            "grade": grade,
            "subject": subject,
            "type": path.suffix.lstrip(".").upper(),
            "size": format_size(size),
            "sizeBytes": size,
            "updated": updated,
            "url": url,
            "tags": tags,
            "description": make_description(tags),
            "sample": False
        })

    materials.sort(key=lambda item: (grade_rank(item["grade"]), item["grade"], item["subject"], item["fileName"]))
    grades = []
    subjects = {}
    for item in materials:
        if item["grade"] not in grades:
            grades.append(item["grade"])
        subjects.setdefault(item["grade"], [])
        if item["subject"] not in subjects[item["grade"]]:
            subjects[item["grade"]].append(item["subject"])

    payload = {
        "generatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": "资料",
        "count": len(materials),
        "grades": grades,
        "subjects": subjects,
        "materials": materials
    }

    js = "/* 自动生成：运行 scripts/build-materials.py 重新扫描 资料/ 目录 */\n"
    js += "window.REAL_MATERIALS = " + json.dumps(materials, ensure_ascii=False, indent=2) + ";\n"
    js += "window.MATERIALS_META = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"
    js += "if (window.SITE_DATA) {\n"
    js += "  window.SITE_DATA.materials = window.REAL_MATERIALS;\n"
    js += "  window.SITE_DATA.site.notice = '课程资料来自“资料”目录，已按年级和学科分类；公开前请确认文件授权。';\n"
    js += "}\n"
    OUTPUT.write_text(js, encoding="utf-8")

    print(f"generated {OUTPUT}")
    print(f"materials: {len(materials)}")
    for grade in grades:
        print(f"- {grade}: {len(subjects[grade])} subjects")
        for subject in subjects[grade]:
            count = sum(1 for item in materials if item["grade"] == grade and item["subject"] == subject)
            print(f"  - {subject}: {count} files")


if __name__ == "__main__":
    main()
