"""100 named acceptance scenarios, executing the shipped controller macros.

The broad exhaustive partition suites remain mandatory in addition to these
readable acceptance cases. No live devices, service calls or household IDs.
"""
import json,unittest
from pathlib import Path
from test_legacy_policy import thermal
from test_air_goals import evaluate as air
from test_thermal_environment import evaluate as environment,source,MODULE

CASES=json.loads((Path(__file__).parent/'climate-scenarios.json').read_text())
assert len(CASES)==100 and len({c['id'] for c in CASES})==100
assert {c['suite'] for c in CASES}=={'thermal','air','environment','passive'}

def check(case):
    def method(self):
        p=case['input']
        if case['suite']=='thermal':out=thermal(**p)
        elif case['suite']=='air':out=air(**p)
        elif case['suite']=='environment':
            p={k:source(**v) if k in ['primary','secondary','outdoor'] else v for k,v in p.items()}
            out=environment(**p)
        else:out=json.loads(str(MODULE.passive_window(p)))
        for path,expected in case['expected'].items():
            actual=out
            for part in path.split('.'):actual=actual[part]
            self.assertEqual(actual,expected,f"{case['id']}: {path}")
    return method

class ClimateAcceptanceScenarios(unittest.TestCase):pass
for case in CASES:setattr(ClimateAcceptanceScenarios,'test_'+case['id'],check(case))
