# CO₂ Uptake Prediction Using Machine Learning for Adsorbents and Metal-Organic Frameworks (MOFs)

**Project Team:** 5-Member University Engineering Team  
**Primary Reference:** *Direction 2 – Team Execution Manual: CO₂ Uptake Prediction (Adsorbents & MOFs)*  
**Target Property:** $\text{CO}_2$ Adsorption Uptake at `0.15 bar` and `298 K`

---

## 1. Title Page
- **Title:** CO₂ Uptake Prediction Using Machine Learning for Adsorbents and Metal-Organic Frameworks (MOFs)
- **Team Roles:**
  - **Member 1 (Data Lead & Coordinator):** Dataset audit, cleaning, data dictionary, fixed 70/15/15 splitting, repository & `src/config.py`.
  - **Member 2 (EDA & Feature Analyst):** Exploratory Data Analysis, 8 visualizations, feature engineering, multicollinearity pruning, `src/features.py`.
  - **Member 3 (Classical ML Engineer):** Baseline (`DummyRegressor`, `LinearRegression`), SVR, Random Forest, XGBoost tuning and evaluation.
  - **Member 4 (Deep Learning & Hybrid Engineer):** PyTorch ANN with Early Stopping and Option A Genetic Algorithm + ANN Hybrid.
  - **Member 5 (Evaluation & Explainability Lead):** Shared `src/evaluate.py`, fair model comparison, SHAP explainability, final report & presentation.

---

## 2. Abstract
Carbon capture from post-combustion flue gas (`~0.15 bar` $\text{CO}_2$ partial pressure, `298 K`) requires porous adsorbents with high low-pressure $\text{CO}_2$ affinity. Because experimental synthesis and molecular simulation of thousands of Metal-Organic Frameworks (MOFs) are computationally and labor-intensive, this project develops an end-to-end, leak-free Machine Learning regression pipeline on `4,999` unique MOFs described by geometric pore metrics and Revised Autocorrelation (RAC) chemical descriptors. Following strict training-only feature selection (pruning 54 constant columns, 3 algebraic identities, and 77 collinear features to retain `193` non-redundant features, including engineered `ASA_gravimetric` and `cage_window_diff`), we benchmarked seven models: Baseline Dummy Mean, OLS Linear Regression, Support Vector Regression (SVR), Random Forest, XGBoost, a PyTorch Artificial Neural Network (ANN), and a Genetic Algorithm–optimized ANN hybrid (Option A). Tuned **XGBoost** achieved the strongest validation (`R² = 0.7027`, `RMSE = 0.9152`, `MAE = 0.6130`) and unbiased test performance (`R² = 0.6510`, `RMSE = 0.8643`, `MAE = 0.5964`). SHAP explainability revealed that low-pressure $\text{CO}_2$ uptake predictions are jointly driven by metal-center electronegativity (`mc_CRY-chi-0-all`, `mc_CRY-chi-2-all`), an optimal microporous accessible pore volume (`POAV ≈ 0.25–0.65 cm³/g`), and narrow pore confinement (`Di`, `Df`), aligning closely with physical adsorption theory.

---

## 3. Introduction
Post-combustion $\text{CO}_2$ capture targets gas streams at near-ambient temperature (`298 K`) and low $\text{CO}_2$ partial pressure (`~0.15 bar`). Metal-Organic Frameworks (MOFs)—crystalline nanoporous materials built from metal nodes/clusters coordinated to organic linkers—offer unprecedented tunability in pore size, surface area, and surface chemistry. However, the combinatorial space of MOF structures makes exhaustive experimental testing or Grand Canonical Monte Carlo (GCMC) simulation expensive. Data-driven Quantitative Structure–Property Relationship (QSPR) models offer rapid screening by predicting adsorption capacity directly from geometric and chemical descriptors.

---

## 4. Background and Adsorption Theory
At **high pressure** (e.g., 30–35 bar), gas storage in porous media correlates strongly with total pore volume and gravimetric surface area. In contrast, at **low partial pressure (`0.15 bar`, `298 K`)**, adsorption operates near the Henry/low-coverage regime where large mesopores remain largely unoccupied. Uptake is instead governed by two physical mechanisms:
1. **Geometric Pore Confinement:** When pore diameters approach the kinetic diameter of $\text{CO}_2$ (`~3.3 Å`), overlapping van der Waals potentials from opposite pore walls significantly deepen the adsorption potential well.
2. **Electrostatic / Quadrupole Interactions:** Because $\text{CO}_2$ has a strong permanent electric quadrupole moment, framework polarity—arising from electropositive open metal sites and polar functional groups—strongly enhances low-pressure binding enthalpy.

---

## 5. Problem Definition and Objectives
- **Research Question:** *"Can we accurately predict the CO₂ adsorption capacity of porous adsorbent materials using their structural and physical properties and Machine Learning algorithms?"*
- **Objectives:**
  1. Clean, verify, and document the MOF dataset and establish fixed, reproducible splits (`RANDOM_SEED = 42`).
  2. Perform EDA on training data only and build a leak-free preprocessing pipeline (`src/features.py`).
  3. Train, tune, and fairly compare Classical ML models, an ANN, and a GA-ANN hybrid using a unified evaluation interface (`src/evaluate.py`).
  4. Interpret the best model using SHAP and relate findings to adsorption theory.

---

## 6. Dataset Description
- **Source Files:**
  - `data/raw/train.csv`: `5,014` rows × `328` columns (`13.45 MB`), containing `MOFname`, `14` geometric/structural descriptors, `312` Revised Autocorrelation (RAC) chemical descriptors, and the target `CO2 uptake at 0.15 bar and 298K`.
  - `data/raw/test.csv`: `2,000` rows × `273` columns (`4.95 MB`). Inspection confirmed it is an unlabeled external competition file lacking the target column (`CO2 uptake at 0.15 bar and 298K`) and omitting the `54` constant RAC columns. Therefore, supervised training, validation, and unbiased testing were conducted strictly on labeled `data/raw/train.csv`.
- **Target Variable & Unit Note:** `CO2 uptake at 0.15 bar and 298K` (`float64`, range `0.000027` to `9.3182`). Because the raw CSV header does not print an explicit unit string after `298K`, predictions are maintained in the original target unit (assumed `mmol/g` / `mol/kg` per standard CoRE MOF / CHE 1147 simulation convention).
- **Operating Conditions:** Pressure (`0.15 bar`) and temperature (`298 K`) are fixed across all rows rather than varying input columns.
- Full per-column metadata is documented in [docs/data_dictionary.md](../docs/data_dictionary.md).

---

## 7. Data Cleaning and Preprocessing
Executed in [notebooks/01_data_cleaning.ipynb](../notebooks/01_data_cleaning.ipynb):
1. **Column & Type Standardization:** Stripped whitespace from headers; verified `MOFname` (`str`) and `327` numeric columns (`float64`).
2. **Duplicate Removal:** Detected and removed `14` exact duplicate rows (`5,014 -> 5,000` unique MOFs).
3. **Missing-Value Handling:** Detected `1` missing value across the entire dataset (`Df` in row `FIRNAX01_clean`, `1/5,000 = 0.02%`). Dropped this single incomplete row before splitting to avoid pre-split imputation leakage, leaving **`4,999` clean rows** with `0` NaN and `0` Inf values.
4. **Physical Validity & IQR Outlier Audit:** Verified `0` physical violations (`ASA >= 0`, `Df/Di/Dif >= 0`, `density > 0`, `POAVF/PONAVF in [0, 1]`, `uptake >= 0`). Statistical IQR outliers were intentionally retained because they represent valid extreme MOF geometries.
5. **Splitting:** Added `row_id` (`0..4998`) and performed a reproducible `70% / 15% / 15%` split (`RANDOM_SEED = 42`):
   - `train.csv`: `3,499` rows (`70.0%`)
   - `val.csv`: `750` rows (`15.0%`)
   - `test.csv`: `750` rows (`15.0%`)
   - Verified zero `row_id` overlap and identical columns across all splits.

---

## 8. Exploratory Data Analysis
Executed strictly on `train.csv` in [notebooks/02_eda.ipynb](../notebooks/02_eda.ipynb), producing 8 figures in `figures/` (`eda_01` through `eda_08`), summarized in [docs/feature_selection_note.md](../docs/feature_selection_note.md):
- **Target Distribution (`eda_01_target_distribution.png`):** Right-skewed (`skewness = 1.307`), mean `1.781`, median `1.377`, std `1.532`.
- **Pore-Size Regimes (`eda_07_uptake_by_pore_regime.png`):** Ultra-microporous MOFs (`Df` = `3.3–5.0 Å`, `n = 1,502`) achieved the highest mean uptake (`2.129`, median `1.822`), compared to `1.557` for `5.0–7.0 Å` (`n = 710`) and `1.103` for `> 7.0 Å` (`n = 494`).
- **Surface Area & Pore Volume Trade-Off (`eda_05`, `eda_06`):** Large `ASA` (`> 2,000 m²/cm³`) and large `POAV` (`> 2 cm³/g`) correlate negatively with uptake at `0.15 bar`, confirming low-pressure uptake is affinity-limited rather than capacity-limited.

---

## 9. Feature Selection & Preprocessing Pipeline
Implemented in [src/features.py](../src/features.py) strictly from `train.csv` statistics:
1. Excluded identifiers (`row_id`, `MOFname`) and `TARGET_COL`.
2. Engineered two domain-justified, leak-free features:
   - `ASA_gravimetric = ASA [m^2/cm^3] / density [g/cm^3]` ($r = -0.1655$ with target vs `-0.0826` for volumetric `ASA`).
   - `cage_window_diff = Di - Df` ($r = -0.1185$ with target).
3. Dropped `54` zero-variance RAC columns, `3` exact algebraic totals (`total_SA_volumetric = ASA + NASA`, `total_POV_volumetric = POAVF + PONAVF`, `total_POV_gravimetric = POAV + PONAV`; max error `< 1e-12`), and `77` collinear features (`|r| > 0.95` on `train.csv`), retaining **`193` non-redundant numerical features**.
4. Built an unfitted `ColumnTransformer` (`SimpleImputer(strategy="median")` + `StandardScaler`) fitted exclusively on `train.csv`.

---

## 10. Methodology
All models share identical inputs (`get_xy()`), fixed splits, `RANDOM_SEED = 42`, and evaluation functions ([src/evaluate.py](../src/evaluate.py)). Hyperparameter search used 5-fold cross-validation on `train.csv` (for Classical ML) or `val.csv` Early Stopping / GA fitness (for ANN / GA-ANN). **Test data (`test.csv`) was never used for feature selection, preprocessing fitting, or hyperparameter tuning.**

---

## 11. Classical Machine Learning Models
Implemented in `notebooks/03a`–`03d` and logged in [docs/tuning_log.md](../docs/tuning_log.md):
- **Baseline (`DummyRegressor(strategy="mean")`):** Establishes minimum floor (`Test R² = -0.0007`, `Test RMSE = 1.4636`).
- **Linear Regression (OLS benchmark):** Unstable on 193 correlated descriptors (`Val R² = -122.6949`, `5-fold CV RMSE = 4.0522 ± 4.9993`), proving regularization/nonlinearity is required.
- **SVR (`GridSearchCV`, 39 candidates):** Best `kernel="rbf", C=10.0, epsilon=0.2, gamma=0.01` (`search = 173.54 s`, `fit = 1.13 s`); `5-fold CV R² = 0.4826 ± 0.0285`.
- **Random Forest (`RandomizedSearchCV`, 15 candidates):** Best `n_estimators=500, max_depth=25, max_features=0.5, min_samples_split=5, min_samples_leaf=1` (`search = 164.07 s`, `fit = 6.09 s`); `5-fold CV R² = 0.5778 ± 0.0272`.
- **XGBoost (`Optuna` TPE, 15 trials):** Best `n_estimators=450, max_depth=5, learning_rate=0.0712, subsample=0.8987, colsample_bytree=0.9863, reg_alpha=0.8196, reg_lambda=0.0562` (`search = 287.80 s`, `fit = 4.88 s`); `5-fold CV R² = 0.6449 ± 0.0331`.

---

## 12. Artificial Neural Network (ANN)
Implemented in PyTorch ([notebooks/04a_ann.ipynb](../notebooks/04a_ann.ipynb)) with Adam optimizer, MSE loss, ReLU hidden layers, Dropout, L2 weight decay, and Early Stopping (`patience = 20`), logged in [docs/ann_tuning_log.md](../docs/ann_tuning_log.md):
- Six candidate architectures were evaluated on `val.csv`.
- **Best ANN:** `hidden_dims=[128, 64, 32]`, `lr=0.0005`, `dropout=0.1`, `batch_size=32`, `weight_decay=0.0005` (stopped at epoch `90`, best epoch `70`, `fit = 16.82 s`).
- Validation: `R² = 0.6098`, `RMSE = 1.0486`, `MAE = 0.6975` | Test: `R² = 0.5343`, `RMSE = 0.9985`, `MAE = 0.6918`.

---

## 13. Genetic Algorithm Hybrid (Option A)
Implemented in [notebooks/04b_ga_hybrid.ipynb](../notebooks/04b_ga_hybrid.ipynb) using modular functions (`create_individual`, `create_population`, `fitness`, `selection`, `crossover`, `mutation`, `elitism`, `run_genetic_algorithm`):
- **Option Selected:** **Option A** — GA optimizes ANN hyperparameters (`n_layers`, `width`, `lr`, `dropout`, `batch_size`, `weight_decay`) using **Validation RMSE** as fitness.
- **Evolution (`pop_size = 8`, `6 generations`, `n_elites = 2`):** Best validation RMSE improved from `1.0973` (Gen 1) to `1.0922` (Gen 6) over `173.18 s`, discovering `[192, 96]` (`lr=0.0003`, `dropout=0.3`, `batch_size=64`, `weight_decay=0.0001`).
- **Comparison vs. Manual ANN:** While the manual 3-layer `[128, 64, 32]` grid scored lower on Validation (`1.0486` vs `1.0922`) because `48` GA evaluations explored only part of the larger `4-layer/width` space, the GA-discovered `[192, 96]` network with stronger regularization (`dropout = 0.3`) generalized better on the unseen Test set (`Test RMSE = 0.9781` vs `0.9985`, `Test R² = 0.5531` vs `0.5343`).

---

## 14. Evaluation Metrics
All models were evaluated in original target units using [src/evaluate.py](../src/evaluate.py):
- **Coefficient of Determination ($R^2$):** Variance explained relative to the mean baseline.
- **Root Mean Squared Error ($\text{RMSE}$):** Penalizes large errors strongly; primary validation selection metric.
- **Mean Absolute Error ($\text{MAE}$):** Average absolute prediction error in original target units.

---

## 15. Model Comparison
Results exported to [results/model_comparison.csv](../results/model_comparison.csv) and plotted in `figures/model_comparison_metrics.png`:

| Model | Validation R² | Validation RMSE | Validation MAE | Test R² | Test RMSE | Test MAE | Training Time (s) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **XGBoost** | **0.7027** | **0.9152** | **0.6130** | **0.6510** | **0.8643** | **0.5964** | 4.88 |
| **Random Forest** | 0.6269 | 1.0252 | 0.6990 | 0.5835 | 0.9442 | 0.6583 | 6.09 |
| **ANN (PyTorch)** | 0.6098 | 1.0486 | 0.6975 | 0.5343 | 0.9985 | 0.6918 | 16.82 |
| **GA-ANN Hybrid** | 0.5766 | 1.0922 | 0.7545 | 0.5531 | 0.9781 | 0.6879 | 12.13 |
| **SVR** | 0.5541 | 1.1209 | 0.7573 | 0.5011 | 1.0335 | 0.7100 | 1.13 |
| **Baseline (Dummy Mean)** | -0.0089 | 1.6860 | 1.2883 | -0.0007 | 1.4636 | 1.1681 | 0.13 |
| **Linear Regression** | -122.6949 | 18.6684 | 1.7481 | -0.0076 | 1.4686 | 0.9846 | 0.15 |

**Winner Selection:** **XGBoost** ranks #1 on every validation and test metric, reducing Test RMSE by `40.9%` relative to the Dummy baseline (`0.8643` vs `1.4636`).

---

## 16. Explainability and SHAP Analysis
Executed on the winning **XGBoost** model in [notebooks/05_shap_analysis.ipynb](../notebooks/05_shap_analysis.ipynb) (outputs in `figures/shap_*.png` and [docs/shap_findings.md](../docs/shap_findings.md)):
- **Top 5 Drivers (`mean |SHAP|`):** `mc_CRY-chi-0-all` (`0.2823`), `mc_CRY-chi-2-all` (`0.2086`), `POAV [cm^3/g]` (`0.1786`), `Di` (`0.1669`), and `Df` (`0.1561`).
- **Directionality:** Lower metal-center electronegativity (`mc_CRY-chi-0-all`), narrower pore cavities (`Di`, `Df`), and an intermediate microporous void volume (`POAV ≈ 0.25–0.65 cm³/g`) drive the highest predicted $\text{CO}_2$ uptake.

---

## 17. Discussion
Tree-based ensembles (XGBoost and Random Forest) outperformed kernel SVR and feedforward ANNs on this tabular `3,499`-sample, `193`-feature MOF dataset. Gradient boosting naturally captures sharp threshold interactions—such as the microporous volcano optimum in `POAV` and pore-size cutoffs around `Df ≈ 3.3–5.0 Å`—without over-parameterizing on correlated RAC descriptors. Meanwhile, the slight validation-to-test gap in XGBoost (`Val R² = 0.7027` vs `Test R² = 0.6510`) and ANN (`0.6098` vs `0.5343`) reflects natural variance across 750-sample splits in a chemically diverse MOF library.

---

## 18. Limitations
1. **Single Thermodynamic State:** All labels correspond to `0.15 bar` and `298 K`; the trained models cannot generalize across varying pressures or temperatures.
2. **Unconfirmed Raw Unit Label:** The raw CSV header omits an explicit unit string; predictions assume consistency with the dataset's native unit (`mmol/g` assumed).
3. **Simulation vs. Experiment:** CoRE MOF / CHE 1147 uptake values typically derive from idealized rigid-crystal GCMC simulations and omit real-world synthesis defects, solvent occlusion, or moisture competition.
4. **Unlabeled Competition Test File:** `data/raw/test.csv` lacked target labels, requiring evaluation on a `15%` holdout from `data/raw/train.csv`.
5. **Compute Budget for GA:** The GA search used `8` individuals × `6` generations (`48` candidate evaluations), limiting exploration compared to larger evolutionary runs.
6. **SHAP Associative Scope:** SHAP explains model behavior on observed features and does not prove physical causation.

---

## 19. Conclusion and Future Work
We successfully built a reproducible, leak-free ML regression pipeline predicting MOF $\text{CO}_2$ uptake at `0.15 bar` and `298 K`. Tuned **XGBoost** achieved the best accuracy (`Test R² = 0.6510`, `Test RMSE = 0.8643`, `Test MAE = 0.5964`), and SHAP analysis confirmed physically coherent dependence on metal electronegativity, microporous void volume, and pore confinement.  
**Future Work:** (1) Incorporate multi-pressure/temperature isotherm datasets; (2) test LightGBM/CatBoost and regularized Ridge/ElasticNet baselines; (3) apply GroupKFold by MOF topology/metal cluster to evaluate out-of-distribution generalization; (4) run Option B GA material inverse design constrained by synthetic accessibility.

---

## 20. References
1. Moosavi, S. M., Nandy, A., Jablonka, K. M., et al. (2020). *Understanding the diversity of the metal-organic framework ecosystem*. Nature Communications, 11, 4068. *(Origin of MOF geometric + RAC descriptor framework).*
2. Janet, J. P., & Kulik, H. J. (2017). *Resolving transition metal chemical space: Feature selection for machine learning and structure–property relationships*. Journal of Physical Chemistry A, 121(46), 8939–8954. *(Revised Autocorrelation, RAC, descriptors).*
3. Chen, T., & Guestrin, C. (2016). *XGBoost: A scalable tree boosting system*. Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining.
4. Lundberg, S. M., & Lee, S.-I. (2017). *A unified approach to interpreting model predictions (SHAP)*. Advances in Neural Information Processing Systems (NeurIPS 30).
5. Chung, Y. G., Haldoupis, E., Bucior, B. J., et al. (2019). *Advances, updates, and analytics for the Computation-Ready, Experimental Metal-Organic Framework database: CoRE MOF 2019*. Journal of Chemical & Engineering Data, 64(12), 5985–5998.
