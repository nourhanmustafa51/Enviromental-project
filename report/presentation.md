# Academic Presentation: CO₂ Uptake Prediction for MOFs Using Machine Learning

---

## Slide 1: Research Problem
- **Challenge:** Post-combustion flue gas contains dilute $\text{CO}_2$ (`~0.15 bar` at `298 K`), requiring selective solid adsorbents like Metal-Organic Frameworks (MOFs).
- **Bottleneck:** Synthesizing or running GCMC molecular simulations across thousands of candidate MOFs is slow and costly.
- **Research Question:** *Can we accurately predict the $\text{CO}_2$ adsorption capacity of porous MOFs using their structural/chemical properties and Machine Learning?*

---

## Slide 2: CO₂ Adsorption Background
- **Low-Pressure Regime (`0.15 bar, 298 K`):** Unlike high-pressure storage (`> 30 bar`), large pore volume alone does *not* drive uptake.
- **Key Physical Mechanisms:**
  - **Micropore Confinement:** Narrow channels near the kinetic diameter of $\text{CO}_2$ (`3.3 Å`) maximize overlapping van der Waals interactions.
  - **Electrostatic / Quadrupole Affinity:** Polar metal sites and functional linkers bind $\text{CO}_2$'s quadrupole moment.

---

## Slide 3: Project Objectives & Team Workflow
- Build a leak-free, reproducible regression system (`RANDOM_SEED = 42`):
  1. Clean & document dataset + fixed 70/15/15 split (**Member 1**).
  2. Perform training-only EDA & feature selection (`src/features.py`) (**Member 2**).
  3. Train & tune Classical ML models: Baseline, SVR, Random Forest, XGBoost (**Member 3**).
  4. Build PyTorch ANN & Option A GA-ANN Hybrid (**Member 4**).
  5. Fairly evaluate all models (`src/evaluate.py`) & run SHAP explainability (**Member 5**).

---

## Slide 4: Dataset Overview
- **Source:** `data/raw/train.csv` (`5,014` rows × `328` columns; `data/raw/test.csv` is unlabeled with `2,000` rows × `273` columns).
- **Target:** `CO2 uptake at 0.15 bar and 298K` (`0.000027` to `9.3182`, mean `1.799`).
- **Features:**
  - `14` geometric properties (`ASA`, `NASA`, `Df`, `Di`, `Dif`, `POAV`, `POAVF`, `PONAV`, `PONAVF`, `density`, totals).
  - `312` Revised Autocorrelation (RAC) chemical descriptors (`mc_CRY`, `lc`, `func`, `f-lig`).
  - `1` row identifier (`MOFname`).

---

## Slide 5: Data Cleaning & Preprocessing
- **Cleaning (`01_data_cleaning.ipynb`):**
  - Removed `14` exact duplicate rows (`5,014 -> 5,000` unique MOFs).
  - Dropped `1` row with missing `Df` (`FIRNAX01_clean`, `0.02%`) → **`4,999` clean rows**, zero NaNs/Infs.
  - Verified `0` physical violations; retained valid extreme MOFs identified by IQR.
- **Fixed Split (`70/15/15`):** Train = `3,499` | Validation = `750` | Test = `750`.
- **Scaling:** `StandardScaler` + median imputer inside `ColumnTransformer`, fitted **only** on `train.csv`.

---

## Slide 6: EDA Findings (`figures/eda_01` – `eda_08`)
- **Skewed Target (`eda_01`):** `skewness = 1.307` (`mean = 1.781`, `median = 1.377`).
- **Pore-Size Sweet Spot (`eda_07`):** Ultra-microporous MOFs (`Df = 3.3–5.0 Å`) lead with mean uptake `2.129`, vs. `1.103` for large pores (`Df > 7.0 Å`).
- **Low-Pressure Trade-Off (`eda_05`, `eda_06`):** Very high `ASA` and `POAV` yield *lower* uptake at `0.15 bar` due to weak confinement.
- **Collinearity (`eda_03`):** Exact algebraic redundancies (`total_SA_volumetric = ASA + NASA`) and modest linear correlations (`|r| <= 0.295`) motivate nonlinear ML models.

---

## Slide 7: Feature Engineering & Selection (`src/features.py`)
- **Engineered Features (leak-free):**
  - `ASA_gravimetric = ASA / density` ($r = -0.1655$ vs `-0.0826` for volumetric `ASA`).
  - `cage_window_diff = Di - Df` (cage-to-window constriction).
- **Pruning on `train.csv` Only:**
  - Dropped `54` constant RACs, `3` exact algebraic totals, and `77` collinear features (`|r| > 0.95`).
  - **Final Feature Space:** **`193` non-redundant numerical features**.

---

## Slide 8: Classical ML Models (`03a`–`03d`)
- **Baseline Dummy Mean:** Test $R^2 = -0.0007$, Test $\text{RMSE} = 1.4636$.
- **OLS Linear Regression:** Exploded on 193 correlated features (Val $R^2 = -122.69$).
- **SVR (RBF, `GridSearchCV`):** `C=10, eps=0.2, gamma=0.01` → Test $R^2 = 0.5011$, $\text{RMSE} = 1.0335$.
- **Random Forest (`RandomizedSearchCV`):** `500` trees, `max_depth=25` → Test $R^2 = 0.5835$, $\text{RMSE} = 0.9442$.
- **XGBoost (`Optuna`, 15 trials):** `450` trees, `max_depth=5, lr=0.0712` → Test $R^2 = 0.6510$, $\text{RMSE} = 0.8643$.

---

## Slide 9: Artificial Neural Network (`04a_ann.ipynb`)
- **Architecture:** PyTorch MLP (`193 -> 128 -> 64 -> 32 -> 1`, ReLU + Dropout `0.1`, linear output).
- **Training:** Adam (`lr = 5e-4`), MSE loss, L2 `weight_decay = 5e-4`, `batch_size = 32`, Early Stopping (`patience = 20`, best epoch `70/90`).
- **Performance:** Validation $R^2 = 0.6098$ ($\text{RMSE} = 1.0486$), Test $R^2 = 0.5343$ ($\text{RMSE} = 0.9985$).
- **Figure:** `figures/ann_loss_curve.png`.

---

## Slide 10: Genetic Algorithm Hybrid – Option A (`04b_ga_hybrid.ipynb`)
- **Design:** GA evolves ANN chromosomes (`n_layers, width, lr, dropout, batch_size, weight_decay`) minimizing **Validation RMSE** (`pop_size = 8`, `6 generations`, tournament selection, uniform crossover, mutation, 2 elites).
- **Convergence (`figures/ga_convergence.png`):** Best Val RMSE improved from `1.0973` (Gen 1) to `1.0922` (Gen 6).
- **Result:** Discovered `[192, 96]` with `dropout = 0.3, lr = 3e-4`, achieving stronger unseen **Test generalization** than the manual ANN (`Test RMSE = 0.9781` vs `0.9985`, `Test R² = 0.5531` vs `0.5343`).

---

## Slide 11: Model Comparison (`figures/model_comparison_metrics.png`)

| Model | Val R² | Val RMSE | Test R² | Test RMSE | Test MAE | Fit Time |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **XGBoost** | **0.7027** | **0.9152** | **0.6510** | **0.8643** | **0.5964** | 4.88 s |
| Random Forest | 0.6269 | 1.0252 | 0.5835 | 0.9442 | 0.6583 | 6.09 s |
| ANN (PyTorch) | 0.6098 | 1.0486 | 0.5343 | 0.9985 | 0.6918 | 16.82 s |
| GA-ANN Hybrid | 0.5766 | 1.0922 | 0.5531 | 0.9781 | 0.6879 | 12.13 s |
| SVR | 0.5541 | 1.1209 | 0.5011 | 1.0335 | 0.7100 | 1.13 s |
| Baseline Dummy | -0.0089 | 1.6860 | -0.0007 | 1.4636 | 1.1681 | 0.13 s |

---

## Slide 12: SHAP Explainability Findings (`figures/shap_*.png`)
- Applied `TreeExplainer` to the best model (**XGBoost**):
  1. **`mc_CRY-chi-0-all` (`0.2823`) & `mc_CRY-chi-2-all` (`0.2086`):** Lower metal electronegativity strongly increases predicted uptake (electropositive metal centers enhance electrostatic $\text{CO}_2$ binding).
  2. **`POAV [cm³/g]` (`0.1786`):** Non-monotonic volcano curve peaking at **`0.25–0.65 cm³/g`**.
  3. **`Di` (`0.1669`) & `Df` (`0.1561`):** Narrower cavities and ultra-micropores increase uptake via confinement.
- *Caution:* SHAP describes model feature attributions, not standalone physical causation.

---

## Slide 13: Best-Performing Model
- **Winner:** **XGBoost Regressor** (best on Validation `RMSE = 0.9152`, `R² = 0.7027`, and Test `RMSE = 0.8643`, `R² = 0.6510`).
- **Why XGBoost Won:**
  - Captures sharp nonlinear thresholds (micropore cutoffs, volcano pore-volume optimum) and metal–geometry interactions.
  - Fast training (`4.88 s`) and robust regularization (`reg_alpha`, `reg_lambda`, `subsample`) on 193 features.
  - Diagnostic plots (`parity_xgboost_test.png`, `residuals_xgboost_test.png`) show strong alignment around $y = x$.

---

## Slide 14: Limitations
- Fixed thermodynamic condition (`0.15 bar`, `298 K`); cannot extrapolate across pressure/temperature.
- Target unit string omitted from raw CSV header (assumed `mmol/g`).
- Idealized crystal simulation data without moisture/defect/kinetics effects.
- External `data/raw/test.csv` lacked labels, requiring internal 70/15/15 split evaluation.
- Modest GA population/generations (`8 × 6`) due to compute budget.

---

## Slide 15: Conclusion and Future Work
- **Conclusion:** Machine Learning—especially gradient-boosted **XGBoost** (`Test R² = 0.6510`, `40.9%` RMSE reduction over baseline)—accurately screens MOF $\text{CO}_2$ uptake from geometric and RAC descriptors while reproducing known adsorption physics via SHAP.
- **Future Work:** Multi-condition ($P, T$) modeling, structure-grouped CV (by MOF topology), and GA Option B inverse material design constrained by synthetic feasibility.
