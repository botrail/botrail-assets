# Zimmer HRC-03 — robot-specific variants

Four distinct part numbers are generated: HRC-03-118505 (older UR wrist), HRC-03-118506 (female UR wrist), HRC-03-116787 (FANUC CRX), HRC-03-126895 (Doosan). [Manufacturer HRC-03 series](https://www.zimmer-group.com/en-us/products/components/handling-technology/hrc-gripper/hrc-03) and individual two-page datasheets (replace the final SKU): [118505 drawing](https://www.zimmer-group.com/fileadmin/pim/MER/GD/PG/MER_GD_PG_HRC-03-118505__SEN__APD__V1.pdf), [126895 drawing](https://www.zimmer-group.com/fileadmin/pim/MER/GD/PG/MER_GD_PG_HRC-03-126895__SEN__APD__V1.pdf).

Nominal dimensions retained: 70 mm housing diameter, 91.9 mm jaw datum, 135.4 mm depicted universal-jaw tip, 12.8..32.8 mm jaw gap (10 mm travel per jaw). The 102 mm overall top footprint and waist are reference approximations. `jaw_joint=0` closes; `0.01` opens. `tcp` marks the universal-jaw tip; the two contact frames move with the jaws. The separate variant mesh paths prevent Doosan sensor geometry being substituted into the other variants. Curves, fastener heads, cable routing, connector geometry, tolerances and collision clearances are approximate or omitted. The cable is BOM-only, not a verified collision envelope.

The model stops at the universal jaws depicted by the drawing. Application fingers and workpiece qualification remain a separate choice. Catalog `order.requires` retains fingers and mounting screws as procurement requirements. Product datasheet masses are 0.68 kg (118505/118506/116787) and 0.71 kg (126895); installed application fingers and cables may add mass. No link mass distribution or inertial tensor is invented. Velocity 0.03 m/s and effort 50 are simulation settings. Connector gender and NPN/PNP pin assignments are in catalog profiles, sourced from DDOC01810/dEN/2026-03-15, rather than inferred from shape.

## Rebuild and inspect

Geometry is independently authored in Node.js/Three.js using the shared `authoring` tools. No vendor CAD or mesh is read or redistributed. Generated geometry and source are CC0-1.0.

```sh
npm ci --prefix authoring
node zimmer-hrc-03/authoring/export.mjs
node zimmer-hrc-03/authoring/export.mjs --check
python -m http.server 8765
```

Open `/zimmer-hrc-03/authoring/` in a browser. Check the reference against product documentation before using dimensions for a real installation.
