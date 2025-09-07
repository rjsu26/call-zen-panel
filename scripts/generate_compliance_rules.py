import json
import uuid

BASE_FILE = 'data/compliance_base.json'
OUT_FILE = 'data/compliance_rules_2000.json'

with open(BASE_FILE, 'r') as f:
    base = json.load(f)

rules = []

# Expand each base rule into variations by adding modifiers, synonyms, and context
modifiers = [
    '',
    ' - voice channel',
    ' - mobile app',
    ' - web portal',
    ' - third-party processor',
    ' - escalated case',
    ' - repeated occurrence',
    ' - seasonal spike',
    ' - high-value customer',
    ' - regulatory notice'
]

synonyms = {
    'unauthorized': ['unauthorised', 'not recognized', 'not recognized', 'fraudulent', 'suspicious'],
    'payment failed': ['payment processing error', 'payment not processed', 'transaction failed']
}

count = 0
for i in range(2000):
    base_rule = base[i % len(base)]
    mod = modifiers[i % len(modifiers)]
    new_rule = {
        'id': f"{base_rule['id']}-{i+1}",
        'title': base_rule['title'] + mod,
        'category': base_rule['category'],
        'description': base_rule['description'] + mod,
        'keywords': base_rule['keywords'][:],
        'severity': base_rule['severity'],
        'sample_violations': base_rule['sample_violations'][:]
    }
    # add slight keyword variations
    if 'unauthorized' in new_rule['keywords'][0]:
        new_rule['keywords'].extend(synonyms.get('unauthorized', []))
    if 'payment failed' in ' '.join(new_rule['keywords']):
        new_rule['keywords'].extend(synonyms.get('payment failed', []))

    rules.append(new_rule)

with open(OUT_FILE, 'w') as f:
    json.dump(rules, f, indent=2)

print(f"Generated {len(rules)} compliance rules -> {OUT_FILE}")
