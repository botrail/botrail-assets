"""Tests for the audit's conservative joint-interface whitelist and failure gates."""
import copy
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('onrobot_motion',Path(__file__).with_name('onrobot-motion.py'))
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
P='rg2_v2_gripper'


class AuditValidationTest(unittest.TestCase):
    def report(self):
        return {'robot_name':'onrobot_rg2_reference','urdf_sha256':audit.FROZEN_CONTRACTS['onrobot_rg2_reference'][0],
            'motion':{'pad_travel_mm':101.1,'pad_minimum_gap_mm':0.,'pad_gap_closed_mm':0.,
                'pad_gap_monotonic_decreasing':True,'pad_max_normal_off_axis':0.,
                'parallelogram_max_pivot_error_mm':0.,'tcp_max_change_mm':0.,
                'connection_gaps':[],'pair_intersections':[]}}

    def test_clean_report_passes(self):
        self.assertTrue(audit.validate_refined(self.report())['passed'])

    def test_missing_support_fails(self):
        report=self.report()
        report['motion']['connection_gaps']=[{'links':['a','b'],'maximum_mm':0.051}]
        self.assertFalse(audit.validate_refined(report)['passed'])

    def test_changed_contract_fails(self):
        report=self.report();report['urdf_sha256']='changed'
        self.assertFalse(audit.validate_refined(report)['passed'])

    def test_guard_lower_axle_clash_fails(self):
        report=self.report()
        report['motion']['pair_intersections']=[{'representation':'visual',
            'links':[P+'_finger_1_finger_tip',P+'_finger_1_truss_arm'],'max_overlap_mm3':1.,
            'component_intersections_over_sweep':[{'objects':['carrier_lower_axle','safety_switch_cover_1'],
                'maximum_overlap_mm3':1.,'maximum_q_rad':1.3}]}]
        self.assertFalse(audit.validate_refined(report)['passed'])

    def test_correct_and_incorrect_pivot_interfaces(self):
        allowed=audit.allowed_joint_interface
        self.assertTrue(allowed(P+'_body',P+'_finger_1_truss_arm','truss_pivot_socket_1_1','pivot_axle_0_1'))
        self.assertFalse(allowed(P+'_body',P+'_finger_1_truss_arm','truss_pivot_socket_1_1','pivot_axle_1_1'))
        self.assertFalse(allowed(P+'_body',P+'_finger_1_moment_arm','sculpted_cover_1','sculpted_link_1'))
        self.assertTrue(allowed(P+'_finger_1_finger_tip',P+'_finger_1_moment_arm','carrier_lower_axle','sculpted_link_1'))
        self.assertFalse(allowed(P+'_finger_1_finger_tip',P+'_finger_1_truss_arm','carrier_lower_axle','sculpted_link_1'))
        self.assertFalse(allowed(P+'_finger_1_finger_tip',P+'_finger_2_moment_arm','carrier_lower_axle','sculpted_link_1'))


if __name__=='__main__':
    unittest.main()
