"""All partitions of the declared three-source thermal input model."""
import itertools,json,math,unittest
from test_legacy_policy import ENV,thermal

MODULE=ENV.get_template('thermal-environment.jinja').module
def source(value=23,**kw):
    return dict(value=value,available=True,confirmed=True,age=10,ttl=900)|kw
BASE=dict(primary=source(),secondary=source(24),outdoor=source(3),
          fallback_enabled=False,airflow_confirmed=True,desired=25)
def evaluate(**kw):
    return json.loads(str(MODULE.thermal_environment(BASE|kw)))
def usable(s,lo,hi):
    return (s['available'] and s['confirmed'] and isinstance(s['value'],(int,float))
            and not isinstance(s['value'],bool) and math.isfinite(s['value'])
            and lo<=s['value']<=hi and 0<=s['age']<=s['ttl'] and 0<s['ttl']<=86400)

class ThermalEnvironmentTests(unittest.TestCase):
    def test_passive_window_complete_transition_matrix(self):
        count=0
        for eligible,severe,reset,pending,elapsed in itertools.product(
            [False,True],[False,True],[False,True],['on','off','unknown'],[0,299,300,301]):
            out=json.loads(str(MODULE.passive_window(dict(eligible=eligible,severe=severe,
                reset=reset,pending=pending,elapsed=elapsed,timeout=300))))
            effective=eligible and not severe
            self.assertTrue(out['valid'])
            self.assertEqual(out['start_pending'],effective and (pending!='on' or reset))
            self.assertEqual(out['cancel_pending'],not effective and pending!='off')
            self.assertEqual(out['wait'],effective and (pending!='on' or reset or elapsed<300))
            count+=1
        self.assertEqual(count,96)
        for invalid in [None,{},dict(eligible=True,severe=False,reset=False,pending='on',elapsed=-1,timeout=300)]:
            out=json.loads(str(MODULE.passive_window(invalid)))
            self.assertFalse(out['valid']);self.assertFalse(out['wait'])

    def test_complete_source_partition_matrix(self):
        room=[source(),source(28),source(available=False),source(confirmed=False),
              source(age=901),source('unknown'),source(0)]
        outside=[source(3),source(29),source(available=False),source(confirmed=False),
                 source(age=901),source('unknown'),source(61)]
        count=0
        for a,b,o,fallback,flow,target in itertools.product(room,room,outside,[False,True],[False,True],[16,25,30]):
            out=evaluate(primary=a,secondary=b,outdoor=o,fallback_enabled=fallback,airflow_confirmed=flow,desired=target)
            av,bv,ov=usable(a,5,40),usable(b,5,40),usable(o,-50,60)
            selected='primary' if av else 'secondary' if bv and fallback else 'none'
            value=a['value'] if av else b['value'] if selected=='secondary' else None
            self.assertTrue(out['valid'])
            self.assertEqual(out['source'],selected)
            self.assertEqual(out['room'],value)
            self.assertEqual(out['room_ok'],value is not None)
            self.assertEqual(out['outdoor_qualified'],ov and flow)
            self.assertEqual(out['heater_unhelpful'],value is not None and ov and flow and o['value']>=target)
            self.assertEqual(out['strong_heating_demand'],value is not None and ov and flow and value<=target-1.5 and o['value']<value)
            self.assertEqual(out['passive_cooling'],value is not None and ov and flow and value>target+.2 and o['value']<=value-1.5 and o['value']<=target-.3)
            self.assertEqual(out['disagreement'],av and bv and abs(a['value']-b['value'])>=2)
            count+=1
        self.assertEqual(count,4116)

    def test_ttl_boundaries_future_nan_and_measurement_confirmation(self):
        for key in ['primary','secondary','outdoor']:
            for value in [None,True,'23',float('nan'),float('inf'),float('-inf')]:
                self.assertFalse(evaluate(**{key:source(value)})[key+'_ok'])
            for age,expected in [(-1,False),(0,True),(899,True),(900,True),(901,False),(float('nan'),False),(float('inf'),False)]:
                self.assertEqual(evaluate(**{key:source(age=age)})[key+'_ok'],expected)
        for value in [5,40]:self.assertTrue(evaluate(primary=source(value))['primary_ok'])
        for value in [-50,60]:self.assertTrue(evaluate(outdoor=source(value))['outdoor_ok'])
        for key in ['fallback_enabled','airflow_confirmed']:
            for invalid in [None,1,'on',{},[]]:
                out=evaluate(**{key:invalid})
                self.assertFalse(out['valid']);self.assertFalse(out['room_ok'])
        for target in [None,True,15.9,30.1,float('nan'),float('inf')]:
            self.assertFalse(evaluate(desired=target)['valid'])

    def test_optional_fallback_never_averages_or_uses_outdoor_as_room(self):
        self.assertEqual(evaluate(primary=source(22),secondary=source(30))['room'],22)
        self.assertTrue(evaluate(primary=source(22),secondary=source(30))['disagreement'])
        missing=source(available=False)
        self.assertIsNone(evaluate(primary=missing)['room'])
        self.assertEqual(evaluate(primary=missing,fallback_enabled=True)['room'],24)
        self.assertIsNone(evaluate(primary=missing,secondary=missing,fallback_enabled=True)['room'])

    def test_source_restart_expiry_recovery_and_no_replayed_value(self):
        seq=[source(confirmed=False),source(22),source(22,age=901),source(23)]
        self.assertEqual([evaluate(primary=s)['source'] for s in seq],['none','primary','none','primary'])
        self.assertEqual([evaluate(primary=s)['room'] for s in seq],[None,22,None,23])
        self.assertFalse(evaluate(airflow_confirmed=False)['outdoor_qualified'])
        self.assertFalse(evaluate(airflow_confirmed=False)['heater_unhelpful'])

    def test_generic_tuning_and_invalid_configuration(self):
        self.assertTrue(evaluate(primary=source(22),secondary=source(23),tuning={'disagreement':1})['disagreement'])
        for tuning in [None,[],{'room_min':40},{'room_max':5},{'deadband':-1},{'disagreement':0},{'cooling_gap':0},{'target_gap':-1},{'outdoor_min':60},{'deadband':float('nan')},{'heat_assist_gap':0}]:
            out=evaluate(tuning=tuning)
            self.assertFalse(out['valid']);self.assertIsNone(out['room'])

    def test_strong_heat_cold_intake_boundaries_and_compressor_protection(self):
        for measured in [23.4,23.5,23.6]:
            for outside,flow,delay in itertools.product([0,23.5,30],[False,True],[299,300]):
                env=evaluate(primary=source(measured),outdoor=source(outside),airflow_confirmed=flow)
                strong=measured<=23.5 and flow and outside<measured
                self.assertEqual(env['strong_heating_demand'],strong)
                out=thermal(ac_mode='fan_only',thermal_authorized=True,measured=measured,desired=25,
                    breather_at_limit=strong,heating_ready=strong,since_change=delay)
                self.assertEqual(out['plan']['action']=='start',strong and delay>=300)
        self.assertIn('Бризер',thermal(measured=23,breather_at_limit=False)['plan']['reason'])

    def test_passive_cooling_never_overrides_existing_guards_or_heating(self):
        for enabled,valid,fault,owned,mode,error,delay,passive in itertools.product(
            [False,True],[False,True],[False,True],[False,True],
            ['off','fan_only','cool','heat','dry','unavailable'],[-1,0,1],[299,300],[False,True]):
            out=thermal(auto_enabled=enabled,room_ok=valid,device_fault=fault,owned=owned,
                        ac_mode=mode,measured=24+error,since_change=delay,
                        thermal_authorized=True,passive_cooling_wait=passive)
            baseline=thermal(auto_enabled=enabled,room_ok=valid,device_fault=fault,owned=owned,
                        ac_mode=mode,measured=24+error,since_change=delay,thermal_authorized=True)
            if baseline['plan']['action']=='start' and baseline['plan']['mode']=='cool' and passive:
                self.assertEqual(out['plan']['action'],'wait')
                self.assertFalse(out['adjustment']['send'])
            else:self.assertEqual(out,baseline)

if __name__=='__main__':unittest.main()
