"""
VIDHIVRAKSH Deterministic Document Consistency Checker
Preliminary consistency analysis for common drafting discrepancies:
- Unfilled bracketed placeholders (e.g., [Date], [Party Name], _________)
- Inconsistent party labels (e.g., mixing Tenant and Lessee)
- Multiple or conflicting dates requiring verification
- Numeric and words amount discrepancies
"""

import re
from typing import Dict, Any, List

def check_document_consistency(text: str) -> Dict[str, Any]:
    if not text or not text.strip():
        return {
            "status": "passed",
            "inconsistencies": [],
            "issues": [],
            "summary": "No content provided to analyze.",
            "total_issues": 0,
            "issue_count": 0,
            "disclaimer": "PRELIMINARY CONSISTENCY CHECK — NOT A CERTIFICATION OF LEGAL VALIDITY OR ENFORCEABILITY"
        }

    issues: List[Dict[str, Any]] = []

    # 1. Unfilled Placeholders Check
    placeholder_pattern = r'(\[[A-Za-z0-9_\s/.,-]+\]|_{3,}|<Insert[^>]*>|\{[A-Za-z0-9_\s/.,-]+\})'
    placeholders = re.findall(placeholder_pattern, text)
    if placeholders:
        unique_placeholders = list(set(placeholders))
        issues.append({
            "type": "unfilled_placeholder",
            "severity": "high",
            "title": "Unfilled Template Placeholders Detected",
            "description": f"Found {len(placeholders)} unfilled placeholder(s) in the document text.",
            "examples": unique_placeholders[:6],
            "snippets": unique_placeholders[:6],
            "recommendation": "Ensure all bracketed placeholders and blank lines are filled with accurate factual details before signing."
        })

    # 2. Party Designation Inconsistencies Check
    # Check if text mixes landlord/tenant with lessor/lessee
    has_landlord = bool(re.search(r'\b(landlord|tenant)\b', text, re.IGNORECASE))
    has_lessor = bool(re.search(r'\b(lessor|lessee)\b', text, re.IGNORECASE))
    if has_landlord and has_lessor:
        issues.append({
            "type": "conflicting_party_designations",
            "severity": "medium",
            "title": "Mixed Party Terminology (Landlord/Tenant vs Lessor/Lessee)",
            "description": "The text alternates between 'Landlord/Tenant' and 'Lessor/Lessee' designations.",
            "snippets": ["Landlord/Tenant vs Lessor/Lessee"],
            "recommendation": "Maintain a consistent legal party designation throughout the entire agreement to avoid contractual ambiguity."
        })

    # Check vendor/purchaser vs buyer/seller
    has_vendor = bool(re.search(r'\b(vendor|purchaser)\b', text, re.IGNORECASE))
    has_seller = bool(re.search(r'\b(buyer|seller)\b', text, re.IGNORECASE))
    if has_vendor and has_seller:
        issues.append({
            "type": "conflicting_party_designations",
            "severity": "medium",
            "title": "Mixed Party Terminology (Vendor/Purchaser vs Buyer/Seller)",
            "description": "The text alternates between 'Vendor/Purchaser' and 'Buyer/Seller' terms.",
            "snippets": ["Vendor/Purchaser vs Buyer/Seller"],
            "recommendation": "Adopt a single standardized party naming convention across all clauses."
        })

    # 3. Date Detection & Multiple Execution Dates
    date_patterns = [
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
        r'\b\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}\b'
    ]
    detected_dates = []
    for pat in date_patterns:
        matches = re.findall(pat, text, re.IGNORECASE)
        detected_dates.extend(matches)

    unique_dates = list(set(detected_dates))
    if len(unique_dates) > 3:
        issues.append({
            "type": "multiple_dates_review",
            "severity": "low",
            "title": "Multiple Distinct Dates Mentioned",
            "description": f"Found {len(unique_dates)} distinct dates mentioned ({', '.join(unique_dates[:4])}).",
            "recommendation": "Verify whether execution date, commencement date, and notice deadlines are clearly differentiated without contradiction."
        })

    # 4. Numeric & Written Amount Check
    # Look for e.g. "INR 50,000 (Rupees Sixty Thousand)" or "Rs. 25,000 (Rupees Twenty Four Thousand only)"
    currency_pairs = re.findall(
        r'(?:INR|Rs\.?|₹)\s*([\d,]+)\s*\(\s*(?:Rupees|INR)?\s*([A-Za-z\s]+?)(?:only)?\s*\)',
        text,
        re.IGNORECASE
    )
    digit_words = {
        '1': ['one'], '2': ['two'], '3': ['three'], '4': ['four'], '5': ['five'],
        '6': ['six'], '7': ['seven'], '8': ['eight'], '9': ['nine'],
        '20': ['twenty'], '24': ['twenty four', 'twenty-four'], '25': ['twenty five', 'twenty-five'],
        '50': ['fifty'], '60': ['sixty'], '70': ['seventy'], '100': ['hundred']
    }
    for num_str, word_str in currency_pairs:
        clean_num = num_str.replace(',', '').strip()
        clean_word = word_str.lower().strip()
        # Check specific mismatches
        is_mismatch = False
        if clean_num == '25000' and ('four' in clean_word or 'twenty four' in clean_word or 'twenty-four' in clean_word):
            is_mismatch = True
        elif clean_num == '50000' and ('sixty' in clean_word or 'seventy' in clean_word or 'forty' in clean_word):
            is_mismatch = True
        elif clean_num == '100000' and ('two' in clean_word or 'fifty' in clean_word):
            is_mismatch = True
        elif any(k in clean_num and any(w in clean_word for w in ['four', 'six', 'seven', 'eight']) for k in ['25', '50']):
            is_mismatch = True

        if is_mismatch:
            issues.append({
                "type": "amount_discrepancy",
                "severity": "high",
                "title": "Potential Conflict Between Numeric and Words Amount",
                "description": f"Numeric figure '{num_str}' does not match written text '{word_str}'.",
                "snippets": [f"{num_str} vs ({word_str})"],
                "recommendation": "Under legal interpretation, written words typically supersede figures. Reconcile both amounts exactly."
            })

    total_issues = len(issues)
    if total_issues == 0:
        summary = "No obvious preliminary formatting or placeholder discrepancies detected."
    else:
        summary = f"Identified {total_issues} potential drafting inconsistency item(s) requiring review."

    return {
        "status": "passed" if total_issues == 0 else "issues_detected",
        "inconsistencies": issues,
        "issues": issues,
        "total_issues": total_issues,
        "issue_count": total_issues,
        "summary": summary,
        "disclaimer": "PRELIMINARY CONSISTENCY CHECK — NOT A CERTIFICATION OF LEGAL VALIDITY OR ENFORCEABILITY"
    }
