import json
import os


def load_rules():
    rules = []
    base_path = os.path.join(os.path.dirname(__file__), "rules")

    for file in os.listdir(base_path):
        if file.endswith(".json"):
            with open(os.path.join(base_path, file)) as f:
                rules.append(json.load(f))

    # sort by priority
    rules.sort(key=lambda x: x.get("priority", 999))
    return rules
