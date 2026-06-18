import re


def normalize_phone(value: str) -> str:
    cleaned = re.sub(r"[\s\-\(\)]", "", value).lstrip("+")
    if cleaned.startswith("998") and len(cleaned) == 12:
        cleaned = cleaned[3:]
    return cleaned