import json
import os

EN_PATH = "/Users/sejalsaraf/Documents/Libra/frontend/src/i18n/translations/en.json"
with open(EN_PATH, "r", encoding="utf-8") as f:
    en_dict = json.load(f)

en_keys = set(en_dict.keys())
print(f"Total reference English keys: {len(en_keys)}")
