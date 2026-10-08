"""Measured drive-pin locations for an inspection-only pose illustration.

This is not a URDF actuator or a simulation drive constraint. It contains no
manufacturer-calibrated barrel, rod, motor dimensions, force or travel limits.
"""
import math
import numpy as np

P=np.array([-.0134,0.,.632])
B=np.array([-.1919,0.,.274])
C_CLOSED=np.array([.2541,0.,.384])


def drive_endpoints(q):
    """Return the exact known base and jaw-eye coordinates at angle q radians."""
    c,s=math.cos(q),math.sin(q)
    r=np.array([[c,0,s],[0,1,0],[-s,0,c]])
    return B.copy(),P+r@(C_CLOSED-P)


def drive_length(q):
    a,b=drive_endpoints(q)
    return float(np.linalg.norm(b-a))
