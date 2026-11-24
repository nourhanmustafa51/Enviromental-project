# Feature Selection & Exploratory Data Analysis Note
**Owner:** Member 2 (EDA and Feature Analyst)

All EDA visualizations, correlation statistics, and feature pruning decisions were computed **strictly on the training split** (`data/processed/train.csv`, $N = 3{,}499$ MOFs) to avoid any validation or test leakage.

---

## 1. Feature Engineering & Selection Pipeline (`src/features.py`)

1. **Identifier & Target Exclusion**: `row_id`, `MOFname`, and `CO2 uptake at 0.15 bar and 298K` are excluded from `SELECTED_FEATURES`.
2. **Scientifically Justified Feature Engineering** (row-wise, zero leakage):
   - `ASA_gravimetric = ASA [m^2/cm^3] / density [g/cm^3]`: Converts volumetric accessible surface area into gravimetric units ($\text{m}^2/\text{g}$) to align directly with gravimetric $\text{CO}_2$ uptake. On the training set, `ASA_gravimetric` correlates more strongly with uptake ($r = -0.1655$) than volumetric `ASA` ($r = -0.0826$).
   - `cage_window_diff = Di - Df`: Quantifies pore cage-to-window constriction (cavity diameter minus limiting aperture diameter, $r = -0.1185$ with target).
3. **Zero-Variance Removal**: 54 constant RAC descriptors (zero standard deviation on `train.csv`) were removed.
4. **Exact Algebraic Identity Removal**: Three exact redundant totals observed in `train.csv` (maximum discrepancy $< 10^{-12}$) were removed so primary geometric components remain interpretable:
   - `total_SA_volumetric = ASA [m^2/cm^3] + NASA [m^2/cm^3]`
   - `total_POV_volumetric = POAVF + PONAVF`
   - `total_POV_gravimetric = POAV [cm^3/g] + PONAV [cm^3/g]`
5. **Multicollinearity Pruning (`|r| > 0.95`)**: 77 additional highly collinear features (including `Dif` vs `Di` with $r = 0.991$, `POAVF` vs `ASA` with $r = 0.964$, `PONAVF` vs `PONAV` with $r = 0.957$, and `total_SA_gravimetric`) were pruned using training-set Pearson correlation while prioritizing primary physical descriptors first.
6. **Final Feature Set**: **193 non-redundant numerical features** (`NUMERIC_FEATURES = 193`, `CATEGORICAL_FEATURES = 0`). `build_preprocessor()` applies median imputation + `StandardScaler` inside an unfitted `ColumnTransformer` fitted exclusively on `train.csv`.

---

## 2. Scientific Interpretation of EDA Figures

### Figure 1 (`eda_01_target_distribution.png`) – Target Distribution
- $\text{CO}_2$ uptake at 0.15 bar and 298 K is strongly right-skewed (`skewness = 1.307`), ranging from `0.000027` to `9.318` (mean `1.781`, median `1.377`, std `1.532`).
- Most MOFs exhibit modest low-pressure capture (`< 2.5`), while a smaller high-performing tail exceeds `5.0`, indicating that only specific structural/chemical combinations yield strong low-pressure $\text{CO}_2$ affinity.

### Figure 2 (`eda_02_numerical_distributions.png`) – Key Structural Properties
- Geometric properties (`ASA`, `ASA_gravimetric`, `Df`, `Di`, `POAV`) are right-skewed, whereas crystal density spans roughly `0.06` to `4.47 g/cm³` with a central peak around `1.0–1.5 g/cm³`.
- A noticeable spike near zero in `ASA` and `POAV` corresponds to ultra-narrow frameworks (`Df < 3.3 Å`) inaccessible to larger probe spheres.

### Figure 3 (`eda_03_correlation_heatmap.png`) – Correlation Heatmap
- Linear Pearson correlations with target are moderate (`|r| <= 0.295`), led by metal-centered electronegativity RAC `mc_CRY-chi-0-all` ($r = +0.295$) and cavity diameter `Di` ($r = -0.182$).
- Strong correlations among geometric properties confirm severe multicollinearity prior to pruning, while modest linear correlations with the target indicate **nonlinear** structure–property interactions requiring nonlinear ML models (SVR, Random Forest, XGBoost, ANN).

### Figure 4 (`eda_04_uptake_vs_pore_size.png`) – CO₂ Uptake vs. Pore Size (`Df`, `Di`)
- High $\text{CO}_2$ uptake concentrates sharply at narrow pore limiting diameters (`Df` around `3.3–5.0 Å`) and small cavities (`Di < 10 Å`).
- Very wide channels (`Df > 10 Å` or `Di > 15 Å`) rarely achieve high uptake at 0.15 bar because gas–framework van der Waals overlap weakens in large voids.

### Figure 5 (`eda_05_uptake_vs_surface_area.png`) – CO₂ Uptake vs. Surface Area
- Unlike high-pressure storage (where uptake scales linearly with surface area), at 0.15 bar high surface area (`ASA > 2000 m²/cm³` or `ASA_gravimetric > 3000 m²/g`) often yields *lower* uptake because high-SA MOFs tend to have large pores and low density.
- Peak low-pressure uptake occurs at moderate surface areas paired with small pore cavities (`Di`) and moderate crystal density.

### Figure 6 (`eda_06_uptake_vs_pore_volume_and_density.png`) – Pore Volume & Density (Fixed 0.15 bar, 298 K)
- Pressure (`0.15 bar`) and temperature (`298 K`) are fixed across every sample in this dataset (not varying columns).
- At 0.15 bar, high `POAV [cm^3/g]` (`> 2 cm^3/g`) shows systematically low $\text{CO}_2$ uptake, confirming that total void volume does not govern Henry-regime/low-pressure adsorption; intermediate densities (`~0.8–1.8 g/cm³`) support higher volumetric framework interactions.

### Figure 7 (`eda_07_uptake_by_pore_regime.png`) – Uptake by Pore-Size Regime
- Grouping MOFs by `Df` relative to the kinetic diameter of $\text{CO}_2$ (`3.3 Å`) shows a clear maximum in the **Ultra-microporous (`3.3–5.0 Å`)** regime (`mean = 2.129`, `median = 1.822`, `n = 1,502`).
- Uptake declines monotonically as pores widen to **Microporous (`5.0–7.0 Å`)** (`mean = 1.557`, `median = 0.936`) and **Large Pore (`> 7.0 Å`)** (`mean = 1.103`, `median = 0.675`), consistent with micropore-confinement adsorption theory.

### Figure 8 (`eda_08_pairplot_key_features.png`) – Multivariate Pair Plot
- Joint scatter patterns reveal non-linear trade-offs: low-density/high-pore-size MOFs cluster in the low-uptake region, whereas dense ultra-microporous MOFs with higher metal electronegativity (`mc_CRY-chi-0-all`) occupy the high-uptake region.
