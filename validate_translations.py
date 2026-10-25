import json
import os
import sys

BASE_DIR = "/Users/sejalsaraf/Documents/Libra/frontend/src/i18n/translations"
LANGUAGES = ["en", "hi", "bn", "ta", "mr", "te"]

dicts = {}
for lang in LANGUAGES:
    file_path = os.path.join(BASE_DIR, f"{lang}.json")
    if not os.path.exists(file_path):
        print(f"ERROR: Missing file for {lang}")
        sys.exit(1)
    with open(file_path, "r", encoding="utf-8") as f:
        dicts[lang] = json.load(f)

ref_keys = set(dicts["en"].keys())
print(f"Reference English keys: {len(ref_keys)}")

all_ok = True

for lang in LANGUAGES:
    d = dicts[lang]
    keys = set(d.keys())
    missing = ref_keys - keys
    extra = keys - ref_keys
    
    if missing:
        print(f"FAILED: {lang} is missing {len(missing)} keys: {missing}")
        all_ok = False
    if extra:
        print(f"FAILED: {lang} has {len(extra)} extra keys: {extra}")
        all_ok = False
        
    # Check empty values
    empty_keys = [k for k, v in d.items() if not v or not str(v).strip()]
    if empty_keys:
        print(f"FAILED: {lang} has empty values for keys: {empty_keys}")
        all_ok = False

    # Check brand.name
    if d.get("brand.name") != "VIDHIVRAKSH":
        print(f"FAILED: {lang} brand.name is '{d.get('brand.name')}', must be 'VIDHIVRAKSH'")
        all_ok = False

    # Check Part C: USER ALREADY EXISTS exact invariance
    if d.get("auth.errorUserAlreadyExists") != "USER ALREADY EXISTS":
        print(f"FAILED: {lang} auth.errorUserAlreadyExists is '{d.get('auth.errorUserAlreadyExists')}', must be exactly 'USER ALREADY EXISTS'")
        all_ok = False

    # Check no obsolete product brand LIBRA remains
    for k, v in d.items():
        if "LIBRA" in v:
            print(f"FAILED: Obsolete brand 'LIBRA' found in {lang}[{k}]: {v}")
            all_ok = False

    # Check no transliterations of VIDHIVRAKSH
    forbidden_transliterations = ["विधिपक्ष", "विधिब्रक्ष", "विधिवृक्ष", "বিধিবৃক্ষ", "விதிவ்ரக்ஷ்", "విధివ్రక్ష్"]
    for k, v in d.items():
        for bad in forbidden_transliterations:
            if bad in v:
                print(f"FAILED: {lang}[{k}] contains forbidden transliteration '{bad}'! v={v}")
                all_ok = False

if all_ok:
    print(f"SUCCESS: All {len(LANGUAGES)} translation dictionaries have 100% key parity ({len(ref_keys)} keys each), no empty values, and strict VIDHIVRAKSH brand compliance!")
    sys.exit(0)
else:
    sys.exit(1)
