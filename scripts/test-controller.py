"""Run portable production policy tests before every build; never contacts HA."""
import json,pathlib,sys,time,unittest
from jinja2 import Environment,FileSystemLoader,StrictUndefined
ROOT=pathlib.Path(__file__).resolve().parents[1]
env=Environment(loader=FileSystemLoader(ROOT/'controller'),undefined=StrictUndefined)
env.filters.update(to_json=json.dumps,from_json=json.loads)
templates=sorted((ROOT/'controller').glob('*.jinja'))
assert templates,'No production controller templates'
for template in templates:env.get_template(template.name)
suite=unittest.defaultTestLoader.discover(str(ROOT/'tests/controller'),pattern='test_*.py')
start=time.monotonic()
result=unittest.TextTestRunner(verbosity=2).run(suite)
report={'templates_compiled':[p.name for p in templates],'test_methods':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),'elapsed_seconds':round(time.monotonic()-start,3),'production_source':'controller/*.jinja - identical files packaged for HA','scope':'Finite software scenarios, not physical fault injection or hardware effectiveness'}
cases=json.loads((ROOT/'tests/controller/climate-scenarios.json').read_text())
report['named_climate_scenarios']=[case['id'] for case in cases]
assert len(report['named_climate_scenarios'])==100 and len(set(report['named_climate_scenarios']))==100
(ROOT/'controller-test-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
if not result.wasSuccessful() or result.skipped or result.testsRun<40:sys.exit(1)
