# Data Dictionary – MOF CO₂ Uptake Prediction

- **Primary Labeled Dataset:** `data/raw/train.csv` (5,014 raw rows → 4,999 cleaned rows, 328 columns)
- **Unlabeled External File:** `data/raw/test.csv` (2,000 rows, 273 columns; excludes target and 54 constant RACs)
- **Target Column:** `CO2 uptake at 0.15 bar and 298K` — Unit not explicitly printed in raw CSV header; assumed mmol/g (mol/kg) per standard CoRE MOF / CHE 1147 0.15 bar, 298 K simulation benchmark.

| Column Name | Meaning | Data Type | Unit | Observed Range | Raw Missing | Notes |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- |
| `MOFname` | Crystal / MOF identifier | `str` | N/A | Unique refcode string | 0 | Identifier only; excluded from ML features. |
| `ASA [m^2/cm^3]` | Accessible Surface Area (volumetric) | `float64` | m^2/cm^3 | 0 to 3270 | 0 | Geometric accessible surface area per unit volume. |
| `Df` | Largest Free Sphere diameter (Pore Limiting Diameter, PLD) | `float64` | Angstrom (assumed) | 0 to 71.5 | 1 | 1 missing row in raw data (FIRNAX01_clean) dropped. |
| `Di` | Largest Included Sphere diameter (Largest Cavity Diameter, LCD) | `float64` | Angstrom (assumed) | 0 to 71.64 | 0 | Maximum spherical cavity diameter. |
| `Dif` | Largest Included Sphere along Free Sphere path | `float64` | Angstrom (assumed) | 0 to 71.64 | 0 | Characteristic channel diameter along diffusion path. |
| `NASA [m^2/cm^3]` | Non-Accessible Surface Area (volumetric) | `float64` | m^2/cm^3 | 0 to 1594 | 0 | Internal surface area unreachable by probe sphere. |
| `POAV [cm^3/g]` | Probe-Occupiable Accessible Pore Volume (gravimetric) | `float64` | cm^3/g | 0 to 15.1 | 0 | Gravimetric accessible void volume. |
| `POAVF` | Probe-Occupiable Accessible Volume Fraction | `float64` | dimensionless | 0 to 0.9611 | 0 | Volumetric fraction of accessible pores. |
| `PONAV [cm^3/g]` | Probe-Occupiable Non-Accessible Pore Volume (gravimetric) | `float64` | cm^3/g | 0 to 0.9656 | 0 | Gravimetric non-accessible void volume. |
| `PONAVF` | Probe-Occupiable Non-Accessible Volume Fraction | `float64` | dimensionless | 0 to 0.5818 | 0 | Volumetric fraction of non-accessible pores. |
| `density [g/cm^3]` | Crystal framework mass density | `float64` | g/cm^3 | 0.06365 to 4.471 | 0 | Bulk crystal density of the MOF. |
| `total_SA_volumetric` | Total volumetric surface area | `float64` | m^2/cm^3 (assumed) | 1.07 to 3270 | 0 | Check collinearity with ASA + NASA in EDA. |
| `total_SA_gravimetric` | Total gravimetric surface area | `float64` | m^2/g (assumed) | 0.5875 to 8307 | 0 | Volumetric SA divided by density. |
| `total_POV_volumetric` | Total volumetric probe-occupiable volume fraction | `float64` | dimensionless | 0 to 0.9611 | 0 | Check collinearity with POAVF + PONAVF in EDA. |
| `total_POV_gravimetric` | Total gravimetric probe-occupiable pore volume | `float64` | cm^3/g (assumed) | 0 to 15.1 | 0 | Check collinearity with POAV + PONAV in EDA. |
| `mc_CRY-chi-0-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-chi-0-all) | `float64` | dimensionless | 0.6241 to 6.452 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-chi-1-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-chi-1-all) | `float64` | dimensionless | 5.642 to 123.3 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-chi-2-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-chi-2-all) | `float64` | dimensionless | 4.921 to 132.3 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-chi-3-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-chi-3-all) | `float64` | dimensionless | 0 to 161 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-Z-0-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-Z-0-all) | `float64` | dimensionless | 9 to 8464 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-Z-1-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-Z-1-all) | `float64` | dimensionless | 78 to 4.269e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-Z-2-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-Z-2-all) | `float64` | dimensionless | 63 to 2.799e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-Z-3-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-Z-3-all) | `float64` | dimensionless | 0 to 2.564e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-I-0-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-I-0-all) | `float64` | dimensionless | 1 to 1 | 0 | Zero-variance (constant) in train data. |
| `mc_CRY-I-1-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-I-1-all) | `float64` | dimensionless | 1 to 24 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-I-2-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-I-2-all) | `float64` | dimensionless | 1 to 29.67 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-I-3-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-I-3-all) | `float64` | dimensionless | 0 to 36.67 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-T-0-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-T-0-all) | `float64` | dimensionless | 1 to 576 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-T-1-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-T-1-all) | `float64` | dimensionless | 2 to 2880 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-T-2-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-T-2-all) | `float64` | dimensionless | 2 to 1547 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-T-3-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-T-3-all) | `float64` | dimensionless | 0 to 986.7 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-S-0-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-S-0-all) | `float64` | dimensionless | 1.04 to 5.382 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-S-1-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-S-1-all) | `float64` | dimensionless | 0.9344 to 26.64 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-S-2-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-S-2-all) | `float64` | dimensionless | 0.9856 to 549.5 | 0 | Chemical graph autocorrelation descriptor. |
| `mc_CRY-S-3-all` | Metal-centered crystal RAC (product descriptor: mc_CRY-S-3-all) | `float64` | dimensionless | 0 to 57.49 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-chi-0-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-chi-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_mc_CRY-chi-1-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-chi-1-all) | `float64` | dimensionless | -32.4 to -0.5775 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-chi-2-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-chi-2-all) | `float64` | dimensionless | -54.9 to 0.64 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-chi-3-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-chi-3-all) | `float64` | dimensionless | -67.52 to 9.77e-16 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-Z-0-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-Z-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_mc_CRY-Z-1-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-Z-1-all) | `float64` | dimensionless | -54.5 to 1008 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-Z-2-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-Z-2-all) | `float64` | dimensionless | -4142 to 2417 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-Z-3-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-Z-3-all) | `float64` | dimensionless | -49.14 to 1854 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-I-0-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-I-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_mc_CRY-I-1-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-I-1-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_mc_CRY-I-2-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-I-2-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_mc_CRY-I-3-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-I-3-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_mc_CRY-T-0-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-T-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_mc_CRY-T-1-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-T-1-all) | `float64` | dimensionless | -6 to 456 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-T-2-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-T-2-all) | `float64` | dimensionless | -15 to 378 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-T-3-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-T-3-all) | `float64` | dimensionless | -51 to 240 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-S-0-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-S-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_mc_CRY-S-1-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-S-1-all) | `float64` | dimensionless | -1.77 to 19.3 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-S-2-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-S-2-all) | `float64` | dimensionless | -294.3 to 27.62 | 0 | Chemical graph autocorrelation descriptor. |
| `D_mc_CRY-S-3-all` | Metal-centered crystal RAC (difference descriptor: D_mc_CRY-S-3-all) | `float64` | dimensionless | -7.772e-17 to 60.29 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-chi-0-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-chi-0-all) | `float64` | dimensionless | 0.8649 to 889.6 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-chi-1-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-chi-1-all) | `float64` | dimensionless | 10.03 to 6829 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-chi-2-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-chi-2-all) | `float64` | dimensionless | 9.18 to 4853 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-chi-3-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-chi-3-all) | `float64` | dimensionless | 0 to 2.184e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-Z-0-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-Z-0-all) | `float64` | dimensionless | 18 to 8.074e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-Z-1-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-Z-1-all) | `float64` | dimensionless | 252 to 6.547e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-Z-2-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-Z-2-all) | `float64` | dimensionless | 216 to 1.12e+07 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-Z-3-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-Z-3-all) | `float64` | dimensionless | 0 to 1.625e+06 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-I-0-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-I-0-all) | `float64` | dimensionless | 1 to 192 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-I-1-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-I-1-all) | `float64` | dimensionless | 2 to 864 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-I-2-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-I-2-all) | `float64` | dimensionless | 2 to 1184 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-I-3-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-I-3-all) | `float64` | dimensionless | 0 to 2832 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-T-0-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-T-0-all) | `float64` | dimensionless | 2 to 4512 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-T-1-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-T-1-all) | `float64` | dimensionless | 4 to 2.01e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-T-2-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-T-2-all) | `float64` | dimensionless | 6 to 2.478e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-T-3-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-T-3-all) | `float64` | dimensionless | 0 to 3.562e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-S-0-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-S-0-all) | `float64` | dimensionless | 1.464 to 356.6 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-S-1-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-S-1-all) | `float64` | dimensionless | 1.869 to 1289 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-S-2-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-S-2-all) | `float64` | dimensionless | 1.971 to 2.198e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-mc_CRY-S-3-all` | Metal-centered crystal RAC (sum descriptor: sum-mc_CRY-S-3-all) | `float64` | dimensionless | 0 to 3543 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-chi-0-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-chi-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_mc_CRY-chi-1-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-chi-1-all) | `float64` | dimensionless | -1123 to -2.78 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-chi-2-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-chi-2-all) | `float64` | dimensionless | -687.4 to 6.12 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-chi-3-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-chi-3-all) | `float64` | dimensionless | -3729 to 3.908e-14 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-Z-0-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-Z-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_mc_CRY-Z-1-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-Z-1-all) | `float64` | dimensionless | -6800 to 5.266e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-Z-2-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-Z-2-all) | `float64` | dimensionless | -1.657e+05 to 3.11e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-Z-3-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-Z-3-all) | `float64` | dimensionless | -1152 to 1.68e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-I-0-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-I-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_mc_CRY-I-1-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-I-1-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_mc_CRY-I-2-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-I-2-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_mc_CRY-I-3-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-I-3-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_mc_CRY-T-0-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-T-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_mc_CRY-T-1-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-T-1-all) | `float64` | dimensionless | -128 to 2544 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-T-2-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-T-2-all) | `float64` | dimensionless | -264 to 4536 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-T-3-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-T-3-all) | `float64` | dimensionless | -408 to 8160 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-S-0-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-S-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_mc_CRY-S-1-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-S-1-all) | `float64` | dimensionless | -183.6 to 605.8 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-S-2-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-S-2-all) | `float64` | dimensionless | -1.177e+04 to 476.2 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_mc_CRY-S-3-all` | Metal-centered crystal RAC (difference descriptor: sum-D_mc_CRY-S-3-all) | `float64` | dimensionless | -3.109e-15 to 1988 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-chi-0-all` | Linker-centered RAC (product descriptor: lc-chi-0-all) | `float64` | dimensionless | 6.218 to 11.83 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-chi-1-all` | Linker-centered RAC (product descriptor: lc-chi-1-all) | `float64` | dimensionless | 6.502 to 69.77 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-chi-2-all` | Linker-centered RAC (product descriptor: lc-chi-2-all) | `float64` | dimensionless | 0 to 69.77 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-chi-3-all` | Linker-centered RAC (product descriptor: lc-chi-3-all) | `float64` | dimensionless | 0 to 73.51 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-Z-0-all` | Linker-centered RAC (product descriptor: lc-Z-0-all) | `float64` | dimensionless | 36 to 509 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-Z-1-all` | Linker-centered RAC (product descriptor: lc-Z-1-all) | `float64` | dimensionless | 36 to 3610 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-Z-2-all` | Linker-centered RAC (product descriptor: lc-Z-2-all) | `float64` | dimensionless | 0 to 544 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-Z-3-all` | Linker-centered RAC (product descriptor: lc-Z-3-all) | `float64` | dimensionless | 0 to 6209 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-I-0-all` | Linker-centered RAC (product descriptor: lc-I-0-all) | `float64` | dimensionless | 1 to 1 | 0 | Zero-variance (constant) in train data. |
| `lc-I-1-all` | Linker-centered RAC (product descriptor: lc-I-1-all) | `float64` | dimensionless | 1 to 9 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-I-2-all` | Linker-centered RAC (product descriptor: lc-I-2-all) | `float64` | dimensionless | 0 to 9 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-I-3-all` | Linker-centered RAC (product descriptor: lc-I-3-all) | `float64` | dimensionless | 0 to 9.5 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-T-0-all` | Linker-centered RAC (product descriptor: lc-T-0-all) | `float64` | dimensionless | 1 to 81 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-T-1-all` | Linker-centered RAC (product descriptor: lc-T-1-all) | `float64` | dimensionless | 1 to 459 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-T-2-all` | Linker-centered RAC (product descriptor: lc-T-2-all) | `float64` | dimensionless | 0 to 459 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-T-3-all` | Linker-centered RAC (product descriptor: lc-T-3-all) | `float64` | dimensionless | 0 to 88 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-S-0-all` | Linker-centered RAC (product descriptor: lc-S-0-all) | `float64` | dimensionless | 0.5329 to 1.162 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-S-1-all` | Linker-centered RAC (product descriptor: lc-S-1-all) | `float64` | dimensionless | 0.5426 to 22.3 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-S-2-all` | Linker-centered RAC (product descriptor: lc-S-2-all) | `float64` | dimensionless | 0 to 5.197 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-S-3-all` | Linker-centered RAC (product descriptor: lc-S-3-all) | `float64` | dimensionless | 0 to 38.66 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-alpha-0-all` | Linker-centered RAC (product descriptor: lc-alpha-0-all) | `float64` | dimensionless | 28.09 to 434.9 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-alpha-1-all` | Linker-centered RAC (product descriptor: lc-alpha-1-all) | `float64` | dimensionless | 38.2 to 752.6 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-alpha-2-all` | Linker-centered RAC (product descriptor: lc-alpha-2-all) | `float64` | dimensionless | 0 to 1208 | 0 | Chemical graph autocorrelation descriptor. |
| `lc-alpha-3-all` | Linker-centered RAC (product descriptor: lc-alpha-3-all) | `float64` | dimensionless | 0 to 1630 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-chi-0-all` | Linker-centered RAC (difference descriptor: D_lc-chi-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_lc-chi-1-all` | Linker-centered RAC (difference descriptor: D_lc-chi-1-all) | `float64` | dimensionless | -0.49 to 4.41 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-chi-2-all` | Linker-centered RAC (difference descriptor: D_lc-chi-2-all) | `float64` | dimensionless | -1.08 to 6.51 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-chi-3-all` | Linker-centered RAC (difference descriptor: D_lc-chi-3-all) | `float64` | dimensionless | -2.674 to 7 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-Z-0-all` | Linker-centered RAC (difference descriptor: D_lc-Z-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_lc-Z-1-all` | Linker-centered RAC (difference descriptor: D_lc-Z-1-all) | `float64` | dimensionless | -440.9 to 20 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-Z-2-all` | Linker-centered RAC (difference descriptor: D_lc-Z-2-all) | `float64` | dimensionless | -19 to 80 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-Z-3-all` | Linker-centered RAC (difference descriptor: D_lc-Z-3-all) | `float64` | dimensionless | -744.2 to 96.33 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-I-0-all` | Linker-centered RAC (difference descriptor: D_lc-I-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_lc-I-1-all` | Linker-centered RAC (difference descriptor: D_lc-I-1-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_lc-I-2-all` | Linker-centered RAC (difference descriptor: D_lc-I-2-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_lc-I-3-all` | Linker-centered RAC (difference descriptor: D_lc-I-3-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_lc-T-0-all` | Linker-centered RAC (difference descriptor: D_lc-T-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_lc-T-1-all` | Linker-centered RAC (difference descriptor: D_lc-T-1-all) | `float64` | dimensionless | -5.333 to 30 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-T-2-all` | Linker-centered RAC (difference descriptor: D_lc-T-2-all) | `float64` | dimensionless | -7 to 30 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-T-3-all` | Linker-centered RAC (difference descriptor: D_lc-T-3-all) | `float64` | dimensionless | -16 to 13.33 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-S-0-all` | Linker-centered RAC (difference descriptor: D_lc-S-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_lc-S-1-all` | Linker-centered RAC (difference descriptor: D_lc-S-1-all) | `float64` | dimensionless | -29.6 to 0.8 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-S-2-all` | Linker-centered RAC (difference descriptor: D_lc-S-2-all) | `float64` | dimensionless | -0.31 to 3.25 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-S-3-all` | Linker-centered RAC (difference descriptor: D_lc-S-3-all) | `float64` | dimensionless | -50.04 to 4.167 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-alpha-0-all` | Linker-centered RAC (difference descriptor: D_lc-alpha-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_lc-alpha-1-all` | Linker-centered RAC (difference descriptor: D_lc-alpha-1-all) | `float64` | dimensionless | -35.1 to 24.8 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-alpha-2-all` | Linker-centered RAC (difference descriptor: D_lc-alpha-2-all) | `float64` | dimensionless | -35.1 to 75.8 | 0 | Chemical graph autocorrelation descriptor. |
| `D_lc-alpha-3-all` | Linker-centered RAC (difference descriptor: D_lc-alpha-3-all) | `float64` | dimensionless | -109.3 to 137.4 | 0 | Chemical graph autocorrelation descriptor. |
| `func-chi-0-all` | Functional-group RAC (product descriptor: func-chi-0-all) | `float64` | dimensionless | 0 to 15.84 | 0 | Chemical graph autocorrelation descriptor. |
| `func-chi-1-all` | Functional-group RAC (product descriptor: func-chi-1-all) | `float64` | dimensionless | 0 to 73.93 | 0 | Chemical graph autocorrelation descriptor. |
| `func-chi-2-all` | Functional-group RAC (product descriptor: func-chi-2-all) | `float64` | dimensionless | 0 to 67.85 | 0 | Chemical graph autocorrelation descriptor. |
| `func-chi-3-all` | Functional-group RAC (product descriptor: func-chi-3-all) | `float64` | dimensionless | 0 to 102.1 | 0 | Chemical graph autocorrelation descriptor. |
| `func-Z-0-all` | Functional-group RAC (product descriptor: func-Z-0-all) | `float64` | dimensionless | 0 to 1.7e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `func-Z-1-all` | Functional-group RAC (product descriptor: func-Z-1-all) | `float64` | dimensionless | 0 to 9152 | 0 | Chemical graph autocorrelation descriptor. |
| `func-Z-2-all` | Functional-group RAC (product descriptor: func-Z-2-all) | `float64` | dimensionless | 0 to 5.098e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `func-Z-3-all` | Functional-group RAC (product descriptor: func-Z-3-all) | `float64` | dimensionless | 0 to 1.614e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `func-I-0-all` | Functional-group RAC (product descriptor: func-I-0-all) | `float64` | dimensionless | 0 to 1 | 0 | Chemical graph autocorrelation descriptor. |
| `func-I-1-all` | Functional-group RAC (product descriptor: func-I-1-all) | `float64` | dimensionless | 0 to 8 | 0 | Chemical graph autocorrelation descriptor. |
| `func-I-2-all` | Functional-group RAC (product descriptor: func-I-2-all) | `float64` | dimensionless | 0 to 11 | 0 | Chemical graph autocorrelation descriptor. |
| `func-I-3-all` | Functional-group RAC (product descriptor: func-I-3-all) | `float64` | dimensionless | 0 to 16 | 0 | Chemical graph autocorrelation descriptor. |
| `func-T-0-all` | Functional-group RAC (product descriptor: func-T-0-all) | `float64` | dimensionless | 0 to 64 | 0 | Chemical graph autocorrelation descriptor. |
| `func-T-1-all` | Functional-group RAC (product descriptor: func-T-1-all) | `float64` | dimensionless | 0 to 256 | 0 | Chemical graph autocorrelation descriptor. |
| `func-T-2-all` | Functional-group RAC (product descriptor: func-T-2-all) | `float64` | dimensionless | 0 to 138.7 | 0 | Chemical graph autocorrelation descriptor. |
| `func-T-3-all` | Functional-group RAC (product descriptor: func-T-3-all) | `float64` | dimensionless | 0 to 160 | 0 | Chemical graph autocorrelation descriptor. |
| `func-S-0-all` | Functional-group RAC (product descriptor: func-S-0-all) | `float64` | dimensionless | 0 to 765.5 | 0 | Chemical graph autocorrelation descriptor. |
| `func-S-1-all` | Functional-group RAC (product descriptor: func-S-1-all) | `float64` | dimensionless | 0 to 56.22 | 0 | Chemical graph autocorrelation descriptor. |
| `func-S-2-all` | Functional-group RAC (product descriptor: func-S-2-all) | `float64` | dimensionless | 0 to 2296 | 0 | Chemical graph autocorrelation descriptor. |
| `func-S-3-all` | Functional-group RAC (product descriptor: func-S-3-all) | `float64` | dimensionless | 0 to 105.8 | 0 | Chemical graph autocorrelation descriptor. |
| `func-alpha-0-all` | Functional-group RAC (product descriptor: func-alpha-0-all) | `float64` | dimensionless | 0 to 1391 | 0 | Chemical graph autocorrelation descriptor. |
| `func-alpha-1-all` | Functional-group RAC (product descriptor: func-alpha-1-all) | `float64` | dimensionless | 0 to 1863 | 0 | Chemical graph autocorrelation descriptor. |
| `func-alpha-2-all` | Functional-group RAC (product descriptor: func-alpha-2-all) | `float64` | dimensionless | 0 to 4496 | 0 | Chemical graph autocorrelation descriptor. |
| `func-alpha-3-all` | Functional-group RAC (product descriptor: func-alpha-3-all) | `float64` | dimensionless | 0 to 5391 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-chi-0-all` | Functional-group RAC (difference descriptor: D_func-chi-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_func-chi-1-all` | Functional-group RAC (difference descriptor: D_func-chi-1-all) | `float64` | dimensionless | -5.635 to 2.67 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-chi-2-all` | Functional-group RAC (difference descriptor: D_func-chi-2-all) | `float64` | dimensionless | -6.933 to 7.09 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-chi-3-all` | Functional-group RAC (difference descriptor: D_func-chi-3-all) | `float64` | dimensionless | -8.533 to 11 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-Z-0-all` | Functional-group RAC (difference descriptor: D_func-Z-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_func-Z-1-all` | Functional-group RAC (difference descriptor: D_func-Z-1-all) | `float64` | dimensionless | -15 to 669.2 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-Z-2-all` | Functional-group RAC (difference descriptor: D_func-Z-2-all) | `float64` | dimensionless | -6 to 680.2 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-Z-3-all` | Functional-group RAC (difference descriptor: D_func-Z-3-all) | `float64` | dimensionless | -12 to 1200 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-I-0-all` | Functional-group RAC (difference descriptor: D_func-I-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_func-I-1-all` | Functional-group RAC (difference descriptor: D_func-I-1-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_func-I-2-all` | Functional-group RAC (difference descriptor: D_func-I-2-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_func-I-3-all` | Functional-group RAC (difference descriptor: D_func-I-3-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_func-T-0-all` | Functional-group RAC (difference descriptor: D_func-T-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_func-T-1-all` | Functional-group RAC (difference descriptor: D_func-T-1-all) | `float64` | dimensionless | -4.19 to 32 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-T-2-all` | Functional-group RAC (difference descriptor: D_func-T-2-all) | `float64` | dimensionless | -16 to 26 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-T-3-all` | Functional-group RAC (difference descriptor: D_func-T-3-all) | `float64` | dimensionless | -22 to 32 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-S-0-all` | Functional-group RAC (difference descriptor: D_func-S-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_func-S-1-all` | Functional-group RAC (difference descriptor: D_func-S-1-all) | `float64` | dimensionless | -0.64 to 44.45 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-S-2-all` | Functional-group RAC (difference descriptor: D_func-S-2-all) | `float64` | dimensionless | -0.24 to 45.12 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-S-3-all` | Functional-group RAC (difference descriptor: D_func-S-3-all) | `float64` | dimensionless | -0.26 to 79.87 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-alpha-0-all` | Functional-group RAC (difference descriptor: D_func-alpha-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `D_func-alpha-1-all` | Functional-group RAC (difference descriptor: D_func-alpha-1-all) | `float64` | dimensionless | -39.1 to 109.2 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-alpha-2-all` | Functional-group RAC (difference descriptor: D_func-alpha-2-all) | `float64` | dimensionless | -36 to 340.4 | 0 | Chemical graph autocorrelation descriptor. |
| `D_func-alpha-3-all` | Functional-group RAC (difference descriptor: D_func-alpha-3-all) | `float64` | dimensionless | -39.32 to 470.4 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-chi-0` | Full-ligand RAC (product descriptor: f-lig-chi-0) | `float64` | dimensionless | 13 to 2781 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-chi-1` | Full-ligand RAC (product descriptor: f-lig-chi-1) | `float64` | dimensionless | 13 to 7132 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-chi-2` | Full-ligand RAC (product descriptor: f-lig-chi-2) | `float64` | dimensionless | 0 to 1.197e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-chi-3` | Full-ligand RAC (product descriptor: f-lig-chi-3) | `float64` | dimensionless | 0 to 1.707e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-Z-0` | Full-ligand RAC (product descriptor: f-lig-Z-0) | `float64` | dimensionless | 72 to 2.039e+06 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-Z-1` | Full-ligand RAC (product descriptor: f-lig-Z-1) | `float64` | dimensionless | 72 to 1.484e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-Z-2` | Full-ligand RAC (product descriptor: f-lig-Z-2) | `float64` | dimensionless | 0 to 6.118e+06 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-Z-3` | Full-ligand RAC (product descriptor: f-lig-Z-3) | `float64` | dimensionless | 0 to 2.923e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-I-0` | Full-ligand RAC (product descriptor: f-lig-I-0) | `float64` | dimensionless | 2 to 408 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-I-1` | Full-ligand RAC (product descriptor: f-lig-I-1) | `float64` | dimensionless | 2 to 1080 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-I-2` | Full-ligand RAC (product descriptor: f-lig-I-2) | `float64` | dimensionless | 0 to 1824 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-I-3` | Full-ligand RAC (product descriptor: f-lig-I-3) | `float64` | dimensionless | 0 to 2592 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-T-0` | Full-ligand RAC (product descriptor: f-lig-T-0) | `float64` | dimensionless | 2 to 3240 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-T-1` | Full-ligand RAC (product descriptor: f-lig-T-1) | `float64` | dimensionless | 2 to 9936 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-T-2` | Full-ligand RAC (product descriptor: f-lig-T-2) | `float64` | dimensionless | 0 to 1.56e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-T-3` | Full-ligand RAC (product descriptor: f-lig-T-3) | `float64` | dimensionless | 0 to 2.184e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-S-0` | Full-ligand RAC (product descriptor: f-lig-S-0) | `float64` | dimensionless | 1.155 to 9188 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-S-1` | Full-ligand RAC (product descriptor: f-lig-S-1) | `float64` | dimensionless | 1.155 to 927.8 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-S-2` | Full-ligand RAC (product descriptor: f-lig-S-2) | `float64` | dimensionless | 0 to 2.757e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `f-lig-S-3` | Full-ligand RAC (product descriptor: f-lig-S-3) | `float64` | dimensionless | 0 to 1977 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-chi-0-all` | Linker-centered RAC (sum descriptor: sum-lc-chi-0-all) | `float64` | dimensionless | 9.242 to 1577 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-chi-1-all` | Linker-centered RAC (sum descriptor: sum-lc-chi-1-all) | `float64` | dimensionless | 6.536 to 2233 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-chi-2-all` | Linker-centered RAC (sum descriptor: sum-lc-chi-2-all) | `float64` | dimensionless | 0 to 4310 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-chi-3-all` | Linker-centered RAC (sum descriptor: sum-lc-chi-3-all) | `float64` | dimensionless | 0 to 4726 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-Z-0-all` | Linker-centered RAC (sum descriptor: sum-lc-Z-0-all) | `float64` | dimensionless | 49 to 3.891e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-Z-1-all` | Linker-centered RAC (sum descriptor: sum-lc-Z-1-all) | `float64` | dimensionless | 48 to 1.228e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-Z-2-all` | Linker-centered RAC (sum descriptor: sum-lc-Z-2-all) | `float64` | dimensionless | 0 to 2.918e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-Z-3-all` | Linker-centered RAC (sum descriptor: sum-lc-Z-3-all) | `float64` | dimensionless | 0 to 2.069e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-I-0-all` | Linker-centered RAC (sum descriptor: sum-lc-I-0-all) | `float64` | dimensionless | 1 to 192 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-I-1-all` | Linker-centered RAC (sum descriptor: sum-lc-I-1-all) | `float64` | dimensionless | 1 to 288 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-I-2-all` | Linker-centered RAC (sum descriptor: sum-lc-I-2-all) | `float64` | dimensionless | 0 to 612 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-I-3-all` | Linker-centered RAC (sum descriptor: sum-lc-I-3-all) | `float64` | dimensionless | 0 to 664 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-T-0-all` | Linker-centered RAC (sum descriptor: sum-lc-T-0-all) | `float64` | dimensionless | 1 to 612 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-T-1-all` | Linker-centered RAC (sum descriptor: sum-lc-T-1-all) | `float64` | dimensionless | 2 to 2760 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-T-2-all` | Linker-centered RAC (sum descriptor: sum-lc-T-2-all) | `float64` | dimensionless | 0 to 3672 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-T-3-all` | Linker-centered RAC (sum descriptor: sum-lc-T-3-all) | `float64` | dimensionless | 0 to 1836 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-S-0-all` | Linker-centered RAC (sum descriptor: sum-lc-S-0-all) | `float64` | dimensionless | 0.5329 to 158.1 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-S-1-all` | Linker-centered RAC (sum descriptor: sum-lc-S-1-all) | `float64` | dimensionless | 0.5621 to 758.1 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-S-2-all` | Linker-centered RAC (sum descriptor: sum-lc-S-2-all) | `float64` | dimensionless | 0 to 238.8 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-S-3-all` | Linker-centered RAC (sum descriptor: sum-lc-S-3-all) | `float64` | dimensionless | 0 to 1272 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-alpha-0-all` | Linker-centered RAC (sum descriptor: sum-lc-alpha-0-all) | `float64` | dimensionless | 28.09 to 5.721e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-alpha-1-all` | Linker-centered RAC (sum descriptor: sum-lc-alpha-1-all) | `float64` | dimensionless | 59.89 to 3.332e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-alpha-2-all` | Linker-centered RAC (sum descriptor: sum-lc-alpha-2-all) | `float64` | dimensionless | 0 to 6.664e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-lc-alpha-3-all` | Linker-centered RAC (sum descriptor: sum-lc-alpha-3-all) | `float64` | dimensionless | 0 to 6.489e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-chi-0-all` | Linker-centered RAC (difference descriptor: sum-D_lc-chi-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_lc-chi-1-all` | Linker-centered RAC (difference descriptor: sum-D_lc-chi-1-all) | `float64` | dimensionless | -13.72 to 121.5 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-chi-2-all` | Linker-centered RAC (difference descriptor: sum-D_lc-chi-2-all) | `float64` | dimensionless | -12.96 to 442.7 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-chi-3-all` | Linker-centered RAC (difference descriptor: sum-D_lc-chi-3-all) | `float64` | dimensionless | -37.43 to 342.7 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-Z-0-all` | Linker-centered RAC (difference descriptor: sum-D_lc-Z-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_lc-Z-1-all` | Linker-centered RAC (difference descriptor: sum-D_lc-Z-1-all) | `float64` | dimensionless | -1.499e+04 to 1520 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-Z-2-all` | Linker-centered RAC (difference descriptor: sum-D_lc-Z-2-all) | `float64` | dimensionless | -304 to 3040 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-Z-3-all` | Linker-centered RAC (difference descriptor: sum-D_lc-Z-3-all) | `float64` | dimensionless | -2.521e+04 to 5308 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-I-0-all` | Linker-centered RAC (difference descriptor: sum-D_lc-I-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_lc-I-1-all` | Linker-centered RAC (difference descriptor: sum-D_lc-I-1-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_lc-I-2-all` | Linker-centered RAC (difference descriptor: sum-D_lc-I-2-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_lc-I-3-all` | Linker-centered RAC (difference descriptor: sum-D_lc-I-3-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_lc-T-0-all` | Linker-centered RAC (difference descriptor: sum-D_lc-T-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_lc-T-1-all` | Linker-centered RAC (difference descriptor: sum-D_lc-T-1-all) | `float64` | dimensionless | -304 to 144 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-T-2-all` | Linker-centered RAC (difference descriptor: sum-D_lc-T-2-all) | `float64` | dimensionless | -664 to 612 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-T-3-all` | Linker-centered RAC (difference descriptor: sum-D_lc-T-3-all) | `float64` | dimensionless | -384 to 816 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-S-0-all` | Linker-centered RAC (difference descriptor: sum-D_lc-S-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_lc-S-1-all` | Linker-centered RAC (difference descriptor: sum-D_lc-S-1-all) | `float64` | dimensionless | -1006 to 38.4 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-S-2-all` | Linker-centered RAC (difference descriptor: sum-D_lc-S-2-all) | `float64` | dimensionless | -4.96 to 151 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-S-3-all` | Linker-centered RAC (difference descriptor: sum-D_lc-S-3-all) | `float64` | dimensionless | -1684 to 222.2 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-alpha-0-all` | Linker-centered RAC (difference descriptor: sum-D_lc-alpha-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_lc-alpha-1-all` | Linker-centered RAC (difference descriptor: sum-D_lc-alpha-1-all) | `float64` | dimensionless | -1576 to 1231 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-alpha-2-all` | Linker-centered RAC (difference descriptor: sum-D_lc-alpha-2-all) | `float64` | dimensionless | -967.2 to 2462 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_lc-alpha-3-all` | Linker-centered RAC (difference descriptor: sum-D_lc-alpha-3-all) | `float64` | dimensionless | -3040 to 4748 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-chi-0-all` | Functional-group RAC (sum descriptor: sum-func-chi-0-all) | `float64` | dimensionless | 0 to 1136 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-chi-1-all` | Functional-group RAC (sum descriptor: sum-func-chi-1-all) | `float64` | dimensionless | 0 to 2376 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-chi-2-all` | Functional-group RAC (sum descriptor: sum-func-chi-2-all) | `float64` | dimensionless | 0 to 4547 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-chi-3-all` | Functional-group RAC (sum descriptor: sum-func-chi-3-all) | `float64` | dimensionless | 0 to 3058 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-Z-0-all` | Functional-group RAC (sum descriptor: sum-func-Z-0-all) | `float64` | dimensionless | 0 to 5.779e+06 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-Z-1-all` | Functional-group RAC (sum descriptor: sum-func-Z-1-all) | `float64` | dimensionless | 0 to 1.847e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-Z-2-all` | Functional-group RAC (sum descriptor: sum-func-Z-2-all) | `float64` | dimensionless | 0 to 1.733e+07 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-Z-3-all` | Functional-group RAC (sum descriptor: sum-func-Z-3-all) | `float64` | dimensionless | 0 to 3.112e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-I-0-all` | Functional-group RAC (sum descriptor: sum-func-I-0-all) | `float64` | dimensionless | 0 to 112 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-I-1-all` | Functional-group RAC (sum descriptor: sum-func-I-1-all) | `float64` | dimensionless | 0 to 320 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-I-2-all` | Functional-group RAC (sum descriptor: sum-func-I-2-all) | `float64` | dimensionless | 0 to 576 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-I-3-all` | Functional-group RAC (sum descriptor: sum-func-I-3-all) | `float64` | dimensionless | 0 to 384 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-T-0-all` | Functional-group RAC (sum descriptor: sum-func-T-0-all) | `float64` | dimensionless | 0 to 1280 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-T-1-all` | Functional-group RAC (sum descriptor: sum-func-T-1-all) | `float64` | dimensionless | 0 to 2592 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-T-2-all` | Functional-group RAC (sum descriptor: sum-func-T-2-all) | `float64` | dimensionless | 0 to 3456 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-T-3-all` | Functional-group RAC (sum descriptor: sum-func-T-3-all) | `float64` | dimensionless | 0 to 3024 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-S-0-all` | Functional-group RAC (sum descriptor: sum-func-S-0-all) | `float64` | dimensionless | 0 to 2.603e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-S-1-all` | Functional-group RAC (sum descriptor: sum-func-S-1-all) | `float64` | dimensionless | 0 to 1138 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-S-2-all` | Functional-group RAC (sum descriptor: sum-func-S-2-all) | `float64` | dimensionless | 0 to 7.807e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-S-3-all` | Functional-group RAC (sum descriptor: sum-func-S-3-all) | `float64` | dimensionless | 0 to 1912 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-alpha-0-all` | Functional-group RAC (sum descriptor: sum-func-alpha-0-all) | `float64` | dimensionless | 0 to 6.678e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-alpha-1-all` | Functional-group RAC (sum descriptor: sum-func-alpha-1-all) | `float64` | dimensionless | 0 to 6.069e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-alpha-2-all` | Functional-group RAC (sum descriptor: sum-func-alpha-2-all) | `float64` | dimensionless | 0 to 8.88e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-func-alpha-3-all` | Functional-group RAC (sum descriptor: sum-func-alpha-3-all) | `float64` | dimensionless | 0 to 6.672e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-chi-0-all` | Functional-group RAC (difference descriptor: sum-D_func-chi-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_func-chi-1-all` | Functional-group RAC (difference descriptor: sum-D_func-chi-1-all) | `float64` | dimensionless | -300.8 to 94.08 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-chi-2-all` | Functional-group RAC (difference descriptor: sum-D_func-chi-2-all) | `float64` | dimensionless | -148.8 to 255.4 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-chi-3-all` | Functional-group RAC (difference descriptor: sum-D_func-chi-3-all) | `float64` | dimensionless | -146.9 to 242.9 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-Z-0-all` | Functional-group RAC (difference descriptor: sum-D_func-Z-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_func-Z-1-all` | Functional-group RAC (difference descriptor: sum-D_func-Z-1-all) | `float64` | dimensionless | -180 to 2.275e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-Z-2-all` | Functional-group RAC (difference descriptor: sum-D_func-Z-2-all) | `float64` | dimensionless | -144 to 4512 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-Z-3-all` | Functional-group RAC (difference descriptor: sum-D_func-Z-3-all) | `float64` | dimensionless | -288 to 3.8e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-I-0-all` | Functional-group RAC (difference descriptor: sum-D_func-I-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_func-I-1-all` | Functional-group RAC (difference descriptor: sum-D_func-I-1-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_func-I-2-all` | Functional-group RAC (difference descriptor: sum-D_func-I-2-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_func-I-3-all` | Functional-group RAC (difference descriptor: sum-D_func-I-3-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_func-T-0-all` | Functional-group RAC (difference descriptor: sum-D_func-T-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_func-T-1-all` | Functional-group RAC (difference descriptor: sum-D_func-T-1-all) | `float64` | dimensionless | -224 to 960 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-T-2-all` | Functional-group RAC (difference descriptor: sum-D_func-T-2-all) | `float64` | dimensionless | -288 to 576 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-T-3-all` | Functional-group RAC (difference descriptor: sum-D_func-T-3-all) | `float64` | dimensionless | -336 to 576 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-S-0-all` | Functional-group RAC (difference descriptor: sum-D_func-S-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_func-S-1-all` | Functional-group RAC (difference descriptor: sum-D_func-S-1-all) | `float64` | dimensionless | -7.68 to 1511 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-S-2-all` | Functional-group RAC (difference descriptor: sum-D_func-S-2-all) | `float64` | dimensionless | -6.72 to 265 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-S-3-all` | Functional-group RAC (difference descriptor: sum-D_func-S-3-all) | `float64` | dimensionless | -5.76 to 2528 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-alpha-0-all` | Functional-group RAC (difference descriptor: sum-D_func-alpha-0-all) | `float64` | dimensionless | 0 to 0 | 0 | Zero-variance (constant) in train data. |
| `sum-D_func-alpha-1-all` | Functional-group RAC (difference descriptor: sum-D_func-alpha-1-all) | `float64` | dimensionless | -748.8 to 6368 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-alpha-2-all` | Functional-group RAC (difference descriptor: sum-D_func-alpha-2-all) | `float64` | dimensionless | -1008 to 1.194e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-D_func-alpha-3-all` | Functional-group RAC (difference descriptor: sum-D_func-alpha-3-all) | `float64` | dimensionless | -777.6 to 6229 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-chi-0` | Full-ligand RAC (sum descriptor: sum-f-lig-chi-0) | `float64` | dimensionless | 43.95 to 1.237e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-chi-1` | Full-ligand RAC (sum descriptor: sum-f-lig-chi-1) | `float64` | dimensionless | 52.02 to 2.441e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-chi-2` | Full-ligand RAC (sum descriptor: sum-f-lig-chi-2) | `float64` | dimensionless | 0 to 4.023e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-chi-3` | Full-ligand RAC (sum descriptor: sum-f-lig-chi-3) | `float64` | dimensionless | 0 to 5.193e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-Z-0` | Full-ligand RAC (sum descriptor: sum-f-lig-Z-0) | `float64` | dimensionless | 288 to 6.934e+07 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-Z-1` | Full-ligand RAC (sum descriptor: sum-f-lig-Z-1) | `float64` | dimensionless | 288 to 4.405e+06 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-Z-2` | Full-ligand RAC (sum descriptor: sum-f-lig-Z-2) | `float64` | dimensionless | 0 to 2.08e+08 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-Z-3` | Full-ligand RAC (sum descriptor: sum-f-lig-Z-3) | `float64` | dimensionless | 0 to 7.339e+06 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-I-0` | Full-ligand RAC (sum descriptor: sum-f-lig-I-0) | `float64` | dimensionless | 5 to 1776 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-I-1` | Full-ligand RAC (sum descriptor: sum-f-lig-I-1) | `float64` | dimensionless | 8 to 3708 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-I-2` | Full-ligand RAC (sum descriptor: sum-f-lig-I-2) | `float64` | dimensionless | 0 to 6480 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-I-3` | Full-ligand RAC (sum descriptor: sum-f-lig-I-3) | `float64` | dimensionless | 0 to 8064 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-T-0` | Full-ligand RAC (sum descriptor: sum-f-lig-T-0) | `float64` | dimensionless | 8 to 1.069e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-T-1` | Full-ligand RAC (sum descriptor: sum-f-lig-T-1) | `float64` | dimensionless | 8 to 6.227e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-T-2` | Full-ligand RAC (sum descriptor: sum-f-lig-T-2) | `float64` | dimensionless | 0 to 7.236e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-T-3` | Full-ligand RAC (sum descriptor: sum-f-lig-T-3) | `float64` | dimensionless | 0 to 4.978e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-S-0` | Full-ligand RAC (sum descriptor: sum-f-lig-S-0) | `float64` | dimensionless | 3.081 to 3.124e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-S-1` | Full-ligand RAC (sum descriptor: sum-f-lig-S-1) | `float64` | dimensionless | 4.62 to 2.716e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-S-2` | Full-ligand RAC (sum descriptor: sum-f-lig-S-2) | `float64` | dimensionless | 0 to 9.373e+05 | 0 | Chemical graph autocorrelation descriptor. |
| `sum-f-lig-S-3` | Full-ligand RAC (sum descriptor: sum-f-lig-S-3) | `float64` | dimensionless | 0 to 4.514e+04 | 0 | Chemical graph autocorrelation descriptor. |
| `CO2 uptake at 0.15 bar and 298K` | CO2 adsorption uptake at 0.15 bar and 298 K (Target) | `float64` | mmol/g (assumed) | 2.734e-05 to 9.318 | 0 | Unit not explicitly printed in raw CSV header; assumed mmol/g (mol/kg) per standard CoRE MOF / CHE 1147 0.15 bar, 298 K simulation benchmark. |
