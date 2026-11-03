from decimal import Decimal
import re
from datetime import datetime

def extract_fields(sms, rule):
    extracted = {}

    for field, pattern in rule.get("fields", {}).items():
        match = re.search(pattern, sms, re.IGNORECASE)

        if not match:
            extracted[field] = None
            continue

        #Date handling
        if field == "date":
            try:
                day, mon, year = match.groups()
                extracted[field] = datetime.strptime(
                    f"{day} {mon} {year}", "%d %b %y"
                ).date()
            except ValueError:
                extracted[field] = None

        # AMOUNT cleanup
        elif field == "amount":
            extracted[field] = Decimal(
                match.group(1).replace(",", "")
            )

        # TYPE normalization
        elif field == "type":
            val = match.group(1).lower()
            extracted[field] = (
                "expense" if val == "debited" else "income"
            )

        # MERCHANT cleanup
        elif field == "merchant":
            extracted[field] = match.group(1).strip()

        else:
            extracted[field] = match.group(1).strip()

    return extracted

