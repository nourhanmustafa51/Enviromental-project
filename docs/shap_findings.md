# Model Explainability & SHAP Scientific Findings
**Owner:** Member 5 (Evaluation and Explainability Lead)  
**Target Model Explained:** Tuned **XGBoost Regressor** (selected as best model by Validation RMSE = `0.9152`, Validation $R^2 = 0.7027$; Test $R^2 = 0.6510$, Test RMSE = `0.8643`).

> **Scientific Caution:** SHAP (SHapley Additive exPlanations) quantifies how the trained XGBoost model attributes predictions to input features on `test.csv` ($N = 750$). It reveals learned associations within this model and dataset; it does **not** independently prove physical causation.

---

## Top Features by Mean |SHAP|

| Rank | Feature | Mean \|SHAP\| | Corr(Feature, SHAP) | Learned Impact on Predicted CO₂ Uptake |
| ---: | :--- | ---: | ---: | :--- |
| 1 | `mc_CRY-chi-0-all` | `0.2823` | `-0.812` | Lower values (< ~2.5) strongly increase predicted uptake |
| 2 | `mc_CRY-chi-2-all` | `0.2086` | `-0.539` | Lower values (< ~20) increase predicted uptake |
| 3 | `POAV [cm^3/g]` | `0.1786` | `+0.224` | Non-monotonic peak at `0.25–0.65 cm³/g`; negative at 0 or > 1.2 |
| 4 | `Di` | `0.1669` | `-0.751` | Smaller cavity diameters increase predicted uptake |
| 5 | `Df` | `0.1561` | `-0.645` | Narrower pore apertures (ultra-microporous) increase uptake |
| 6 | `mc_CRY-S-1-all` | `0.1172` | `-0.707` | Lower covalent-radius depth-1 RAC increases uptake |
| 7 | `PONAV [cm^3/g]` | `0.1062` | `+0.790` | Higher non-accessible pore volume associates with higher uptake |
| 8 | `mc_CRY-S-0-all` | `0.0975` | `+0.410` | Higher metal covalent-radius depth-0 RAC increases uptake |
| 9 | `f-lig-Z-1` | `0.0931` | `+0.237` | Moderate-to-high linker nuclear-charge RAC increases uptake |
| 10 | `density [g/cm^3]` | `0.0850` | `-0.135` | Non-monotonic: intermediate densities favored over extremes |

---

## 7 Key Scientific Findings

1. **Metal-Center Electronegativity Dominates Low-Pressure Predictions (`mc_CRY-chi-0-all`, `mc_CRY-chi-2-all`):**  
   The two highest-ranked features overall are metal-centered Pauling electronegativity RACs (`mean |SHAP| = 0.2823` and `0.2086`). Lower `mc_CRY-chi-0-all` values (`0.67–1.72`) yield strongly positive SHAP contributions (mean `+0.368`), whereas high values (`> 2.85`) shift predictions downward (mean `-0.290` to `-0.506`). Chemically, this aligns with electrostatic adsorption theory: more electropositive metal nodes (lower $\chi$) carry stronger partial positive charge, strengthening quadrupole interactions with $\text{CO}_2$.

2. **Non-Monotonic Pore Volume Optimum (`POAV [cm^3/g]`):**  
   The SHAP dependence plot (`figures/shap_dependence_top3.png`) shows a clear volcano-shaped curve for accessible pore volume (`mean |SHAP| = 0.1786`). Non-porous frameworks (`POAV ≈ 0`) receive negative contributions (`-0.25` to `-0.30`), uptake peaks sharply in the microporous sweet spot (`POAV ≈ 0.25–0.65 cm³/g`, SHAP `+0.30` to `+0.45`), and large-pore MOFs (`POAV > 1.2 cm³/g`) drop back below zero.

3. **Pore Confinement Drives 0.15 bar Uptake (`Di`, `Df`):**  
   Both Largest Cavity Diameter (`Di`, `mean |SHAP| = 0.1669`, `r(val, SHAP) = -0.751`) and Pore Limiting Diameter (`Df`, `mean |SHAP| = 0.1561`, `r(val, SHAP) = -0.645`) exhibit strong negative SHAP slopes. Smaller cavities and ultra-microporous channels maximize overlapping van der Waals dispersion potentials with $\text{CO}_2$ (kinetic diameter `3.3 Å`) at low partial pressure (`0.15 bar`, `298 K`).

4. **Agreement Between EDA and SHAP:**  
   SHAP confirms the Stage 2 EDA finding (`eda_07_uptake_by_pore_regime.png`), where ultra-microporous MOFs (`Df` = `3.3–5.0 Å`) achieved the highest mean uptake (`2.129`), while large-pore MOFs (`Df > 7.0 Å`) dropped to `1.103`.

5. **Synergy Between Structural Geometry and Framework Chemistry:**  
   Neither geometry alone nor chemistry alone explains low-pressure $\text{CO}_2$ uptake: the top 10 SHAP features combine 6 metal/ligand RAC descriptors (`mc_CRY-*`, `f-lig-Z-1`) with 4 geometric descriptors (`POAV`, `Di`, `Df`, `PONAV`, plus `density` at #10).

6. **Role of Non-Accessible Pockets (`PONAV [cm^3/g]`):**  
   `PONAV` shows a positive SHAP trend (`mean |SHAP| = 0.1062`, `r = +0.790`). Physically, `PONAV` is calculated with a standard larger N₂-sized geometric probe (`~3.64 Å`), meaning cavities counted as "non-accessible" to N₂ can still accommodate smaller/linear $\text{CO}_2$ molecules (`3.3 Å`) or reflect dense, narrow-pore topologies with strong binding energy.

7. **Consistency Across Tree-Based Models:**  
   Both Random Forest (`mc_CRY-chi-2-all`, `mc_CRY-chi-0-all`, `density`, `Di`, `Df`) and XGBoost SHAP identify the same core chemical and pore-size drivers, strengthening confidence that these patterns reflect robust structure–property relationships in the dataset rather than single-model artifacts.
