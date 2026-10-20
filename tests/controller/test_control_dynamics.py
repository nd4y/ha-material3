"""Exact critical dwell/release and PI regression with independent equations."""

import itertools
import json
import math
from pathlib import Path
import unittest

from jinja2 import Environment, FileSystemLoader, StrictUndefined


ROOT=Path(__file__).resolve().parents[2]
ENV=Environment(loader=FileSystemLoader(str(ROOT/'controller')),undefined=StrictUndefined)
MODULE=ENV.get_template('control-dynamics.jinja').module
CRITICAL={'above':False,'valid':True,'clear':False,'pending':'off','active':'off',
          'clear_pending':'off','elapsed':0,'clear_elapsed':0,'dwell':120,'release_dwell':300}
PI={'force':False,'reset':False,'measured':24,'desired':24,'old_i':0,'elapsed':120,'current':15}


def critical(**changes):
    return json.loads(str(MODULE.critical_hysteresis(CRITICAL|changes)))


def pi(**changes):
    return json.loads(str(MODULE.supply_pi(PI|changes)))


class CriticalHysteresisTests(unittest.TestCase):
    def test_all_known_unknown_helper_and_deadline_combinations(self):
        count=0
        for above,valid,clear,pending,active,clear_pending,elapsed,clear_elapsed in itertools.product(
            [False,True],[False,True],[False,True],['on','off','unknown'],
            ['on','off','unknown'],['on','off','unknown'],[-1,119,120,121],[-1,299,300,301]
        ):
            out=critical(above=above,valid=valid,clear=clear,pending=pending,active=active,
                         clear_pending=clear_pending,elapsed=elapsed,clear_elapsed=clear_elapsed)
            self.assertTrue(out['valid'])
            self.assertEqual(out['activate'],above and pending=='on' and elapsed>=120 and active!='on')
            self.assertEqual(out['release'],(not valid or clear and clear_pending=='on' and clear_elapsed>=300) and active!='off')
            self.assertEqual(out['start_pending'],above and pending!='on')
            self.assertEqual(out['cancel_pending'],not above and pending!='off')
            self.assertEqual(out['start_clear'],valid and clear and clear_pending!='on')
            self.assertEqual(out['cancel_clear'],not clear and clear_pending!='off')
            count+=1
        self.assertEqual(count,3456)

    def test_actual_critical_transition_sequence(self):
        out=critical(above=True)
        self.assertTrue(out['start_pending']);self.assertFalse(out['activate'])
        self.assertFalse(critical(above=True,pending='on',elapsed=119)['activate'])
        self.assertTrue(critical(above=True,pending='on',elapsed=120)['activate'])
        self.assertFalse(critical(above=True,pending='on',active='on',elapsed=121)['activate'])
        self.assertTrue(critical(above=False,active='on',pending='on')['cancel_pending'])
        self.assertTrue(critical(active='on',clear=True)['start_clear'])
        self.assertFalse(critical(active='on',clear=True,clear_pending='on',clear_elapsed=299)['release'])
        self.assertTrue(critical(active='on',clear=True,clear_pending='on',clear_elapsed=300)['release'])
        self.assertTrue(critical(active='on',valid=False)['release'])
        self.assertTrue(critical(clear_pending='on',clear=False)['cancel_clear'])

    def test_parameters_are_configurable_not_household_constants(self):
        self.assertFalse(critical(above=True,pending='on',elapsed=9,dwell=10)['activate'])
        self.assertTrue(critical(above=True,pending='on',elapsed=10,dwell=10)['activate'])
        self.assertTrue(critical(active='on',clear=True,clear_pending='on',clear_elapsed=20,release_dwell=20)['release'])

    def test_invalid_input_submits_no_state_changes(self):
        for key in CRITICAL:
            values=CRITICAL.copy();del values[key]
            result=json.loads(str(MODULE.critical_hysteresis(values)))
            self.assertFalse(result['valid'],key)
            self.assertFalse(any(value for name,value in result.items() if name!='valid'))
        for key in ['above','valid','clear']:
            for value in ['on',None,1]:
                self.assertFalse(critical(**{key:value})['valid'])
        for key in ['elapsed','clear_elapsed','dwell','release_dwell']:
            for value in [None,'0',True,float('nan'),float('inf'),1000000000001]:
                self.assertFalse(critical(**{key:value})['valid'])
        for key in ['dwell','release_dwell']:
            self.assertFalse(critical(**{key:0})['valid'])
        for key in ['pending','active','clear_pending']:
            self.assertFalse(critical(**{key:'unavailable'})['valid'])


class SupplyPITests(unittest.TestCase):
    def test_all_control_boundaries_against_original_equations(self):
        count=0
        for force,reset,measured,desired,old_i,elapsed,current in itertools.product(
            [False,True],[False,True],[16,23.79,24,24.21,30],[16,24,30],
            [-20,0,5],[0,119,120,300,600],[5,15,25]
        ):
            out=pi(force=force,reset=reset,measured=measured,desired=desired,
                   old_i=old_i,elapsed=elapsed,current=current)
            base_i=0 if reset else old_i
            dt=0 if force else min(5,elapsed/60)
            error=desired-measured
            candidate=min(5,max(-20,base_i+(0.15*error*dt if abs(error)>0.2 else 0)))
            candidate_raw=desired+4*error+candidate
            integral=base_i if (candidate_raw>25 and error>0) or (candidate_raw<5 and error<0) else candidate
            requested=int(round(min(25,max(5,desired+4*error+integral))))
            command=requested if force else int(round(min(current+2,max(current-2,requested))))
            self.assertTrue(out['valid'])
            self.assertEqual(out['command'],command)
            self.assertEqual(out['requested'],requested)
            self.assertAlmostEqual(out['new_i'],integral)
            self.assertGreaterEqual(out['command'],5)
            self.assertLessEqual(out['command'],25)
            if not force:
                self.assertLessEqual(abs(out['command']-current),2)
            count+=1
        self.assertEqual(count,2700)

    def test_integral_deadband_antiwindup_and_forced_reset(self):
        self.assertEqual(pi(measured=24,desired=24,old_i=-3)['new_i'],-3)
        self.assertEqual(pi(measured=16,desired=30,old_i=0)['new_i'],0)
        self.assertEqual(pi(measured=30,desired=16,old_i=-5)['new_i'],-5)
        self.assertEqual(pi(measured=24,desired=24,old_i=-3,reset=True)['old_i'],0)
        self.assertEqual(pi(force=True)['dt'],0)
        self.assertEqual(pi(elapsed=-1)['dt'],0)
        self.assertEqual(pi(elapsed=10000)['dt'],5)

    def test_tuning_and_hardware_supply_range_are_configurable(self):
        out=pi(measured=20,desired=22,current=20,tuning={'kp':1,'ki':0,'supply_min':10,'supply_max':40,'max_step':1})
        self.assertEqual(out['requested'],24)
        self.assertEqual(out['command'],21)
        out=pi(force=True,measured=20,desired=22,current=20,tuning={'kp':1,'ki':0,'supply_min':10,'supply_max':40})
        self.assertEqual(out['command'],24)

    def test_invalid_input_never_becomes_a_physical_setpoint(self):
        for key in PI:
            values=PI.copy();del values[key]
            out=json.loads(str(MODULE.supply_pi(values)))
            self.assertFalse(out['valid'],key);self.assertIsNone(out['command'])
        for key in ['measured','desired','old_i','elapsed','current']:
            for value in [None,'unknown','0',False,float('nan'),float('inf'),1000001]:
                self.assertFalse(pi(**{key:value})['valid'])
        for key in ['force','reset']:
            self.assertFalse(pi(**{key:'off'})['valid'])
        for value in [4,26,15.1]:
            self.assertFalse(pi(current=value)['valid'])
        for tuning in [None,{'kp':-1},{'ki':-1},{'deadband':-1},{'max_step':-1},
                       {'max_dt_minutes':-1},{'supply_min':25,'supply_max':5},
                       {'integral_min':5,'integral_max':-20},{'kp':None},
                       {'supply_min':5.1},{'supply_max':25.5},{'max_step':1.5}]:
            self.assertFalse(pi(tuning=tuning)['valid'])


if __name__=='__main__':
    unittest.main()
