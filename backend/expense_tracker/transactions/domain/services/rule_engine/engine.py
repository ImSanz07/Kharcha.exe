from .rule_loader import load_rules
from .extractor import extract_fields


class SmsParserRuleEngine:

    def __init__(self):
        self.rules = load_rules()

  
    def match_rule(self, sms: str):
        for rule in self.rules:
            conditions = rule.get("match",{})

            #contains match
            if 'contains' in conditions:
                if all(word.lower() in sms.lower() for word in conditions["contains"]):
                    return rule
                
        return None   

    def process_sms(self, sms: str):
        rule = self.match_rule(sms)

        
        if not rule:
            return{
                "bank":"UNKNOWN",
                "raw_sms":sms
            }
        extracted = extract_fields(sms,rule)
        return {
            "bank": rule.get("bank"),
            **extracted
        }
    
    def process_sms_list(self, sms_list):
        results = []

        for sms_obj in sms_list:
            sms = sms_obj.get("sms_body", "")

            if not isinstance(sms, str) or not sms.startswith("Dear"):
                continue

            parsed = self.process_sms(sms)
            results.append(parsed)

        #Need to save to db after validation
        #print nicely
        # for result in results:
        #     print(f"Bank: {result.get('bank')}, Amount: {result.get('amount')}, Merchant: {result.get('merchant')}, Type: {result.get('type')}, Date: {result.get('date')}")

        return results