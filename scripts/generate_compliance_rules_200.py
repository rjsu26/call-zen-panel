import json

BASE_FILE = 'data/compliance_base.json'
OUT_FILE = 'data/compliance_rules_2000.json'  # overwrite existing large file with smaller set
COUNT = 200

with open(BASE_FILE, 'r') as f:
    base = json.load(f)

modifiers = ['', ' - voice channel', ' - mobile app', ' - web portal', ' - third-party processor', ' - escalated case', ' - repeated occurrence', ' - seasonal spike', ' - high-value customer', ' - regulatory notice']

synonyms = {
    'unauthorized': ['unauthorised', 'not recognized', 'fraudulent', 'suspicious'],
    'payment failed': ['payment processing error', 'payment not processed', 'transaction failed']
}

rules = []
for i in range(COUNT):
    base_rule = base[i % len(base)]
    mod = modifiers[i % len(modifiers)]
    new_rule = {
        'id': f"{base_rule['id']}-{i+1}",
        'title': base_rule['title'] + mod,
        'category': base_rule.get('category', ''),
        'description': (base_rule.get('description','') + mod).strip(),
        'keywords': list(dict.fromkeys(base_rule.get('keywords', [])[:])),
        'severity': base_rule.get('severity', 'Medium'),
        'sample_violations': base_rule.get('sample_violations', [])[:]
    }
    # add synonyms where relevant
    new_keywords = []
    for kw in new_rule['keywords']:
        new_keywords.append(kw)
        if 'unauthor' in kw.lower():
            new_keywords.extend(synonyms.get('unauthorized', []))
        if 'payment' in kw.lower() or 'transaction' in kw.lower():
            new_keywords.extend(synonyms.get('payment failed', []))
    # dedupe keywords
    new_rule['keywords'] = list(dict.fromkeys([k for k in new_keywords if k]))
    rules.append(new_rule)

with open(OUT_FILE, 'w') as f:
    json.dump(rules, f, indent=2)

print(f"Wrote {len(rules)} rules to {OUT_FILE}")
