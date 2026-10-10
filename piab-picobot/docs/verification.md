# piCOBOT visual refinement verification — 2026-10-10

## Scope and baseline

Original air-driven UR piCOBOT, not L/Electric. Main c945d9e was fetched through the repository connector. Complete hydrated checkout git tree matched b0bf6a6ee575585417e50194322d39ed22ee7117 before editing. Only piab-picobot is changed. No push, PR, catalog update, or publication.

The final URDF is byte-identical to that baseline: same link names, five fixed joints, mount, cup holders Z112mm, contacts/TCP Z134mm, and all collision primitives. No new inertia or fictional vacuum actuator. Manual spacing/tilt is not simulated, so a motion sweep is not applicable.

## Source and pixel audit

Inspected actual pixels in Piab studio assembly render, real box-lifting and twin-cup tablet-lifting photographs, bare0212848 gripper image and published component drawings. The operational real photograph takes priority over accessory placement in the studio view: detached blue adjustment pin omitted. Corrected front-view handedness: green controls left, air elbow right; opposite-side vacuum hoses. Independent review also corrected buried LED lens, seated overlays, and holder/rail connections.

No source photos, drawings, datasheets, branded graphics or OEM CAD are inside this repository. The product is not an exact dimensioned OEM twin: legacyØ40×22 cups differ from pictured B35XPØ37, and small housing/HMI/fitting dimensions are estimates. Detailed mass/inertia and flange fit are unverified.

## Automated checks

- Six target Node tests: exact kinematic/collision contract, deterministic export, cup planes, unique/finite parts and opposite hoses, lossless OBJ corner/normal/UV/material equivalence, blob size budget
- 39 shared authoring tests passed; shared source and dependencies unchanged
- Deterministic export --check passes (OBJ/MTL/URDF/material properties)
- Independent OBJ welded-edge topology audit: no degenerate triangles, open/non-manifold edges, inconsistent winding or negative volume for all 141 components
- Same original URDF compared with cmp: byte-identical
- Analytic vertex-to-primitive audit in clearance.json: maximum17.17mm outside old collision at air push-fit collar; cup upper bellows approximately1mm outside. This is intentionally disclosed, not treated as a full collision pass

The collision proxies are coarse and unsafe for narrow-clearance or safety validation. Flexible vacuum tubes have no independent collision. Support connections were reviewed geometrically and from multiple views; this is not a pressure, seal, fastener-fit or load test.

## Rendering and viewer

Comparison and multi-angle render images use Blender4.3.2, identical fixed cameras/lighting before and after, exported material colors and source metalness/roughness. Images are offline render QA, not browser screenshots. Underside verifies cup openings; front/side/rear/top and detail crops cover the assembly.

Supported cloud-browser QA was attempted at the local HTTP viewer URL. Browser reported net::ERR_CONNECTION_REFUSED; no browser interactions are claimed verified, and no alternate socket or security bypass was used. Static import-map paths and dependency files are checked in the portable bundle. Current locked Three0.185.1 and three-usd-robot0.11.0 runtime reused; no new packages installed.

## Reproduction

See README commands. verify_obj.py and verify_clearance.mjs emit complete JSON measurements. render_review.py reads the exported URDF/OBJ and never edits geometry. For example:

    blender -b -t6 --python piab-picobot/authoring/render_review.py -- piab-picobot/urdf/piab-picobot.urdf front.png --view front --materials piab-picobot/docs/materials.json

OBJ compaction only reuses exactly equal attribute strings per object, preserving every face and normal; no rounding or decimation. New geometry must be published under a new catalog revision if later authorized.
