# Classical Machine Learning Tuning Log
**Owner:** Member 3 (Classical Machine Learning Engineer)

All models were trained and tuned strictly on `data/processed/train.csv` ($N = 3{,}499$, 193 selected features) using 5-fold cross-validation (`RANDOM_SEED = 42`), evaluated on `val.csv` ($N = 750$) for model selection, and evaluated once on `test.csv` ($N = 750$) after finalization.

---

## Summary of Models, Hyperparameters, and Timings

| Model | Search Strategy | Best Hyperparameters | 5-Fold CV R² (mean ± std) | 5-Fold CV RMSE (mean ± std) | Search Time (s) | Final Fit Time (s) |
| :--- | :--- | :--- | :---: | :---: | ---: | ---: |
| **Baseline (Dummy Mean)** | None (`strategy="mean"`) | Default | `-0.0006 ± 0.0006` | `1.5313 ± 0.0338` | `0.00` | `0.13` |
| **Linear Regression** | None (OLS benchmark) | Default | `-16.2824 ± 32.4951` | `4.0522 ± 4.9993` | `0.00` | `0.15` |
| **SVR** | `GridSearchCV` (39 candidates, 195 fits) | `kernel="rbf"`, `C=10.0`, `epsilon=0.2`, `gamma=0.01` | `0.4826 ± 0.0285` | `1.1005 ± 0.0332` | `173.54` | `1.13` |
| **Random Forest** | `RandomizedSearchCV` (15 candidates, 75 fits) | `n_estimators=500`, `max_depth=25`, `max_features=0.5`, `min_samples_split=5`, `min_samples_leaf=1` | `0.5778 ± 0.0272` | `0.9942 ± 0.0400` | `164.07` | `6.09` |
| **XGBoost** | `Optuna` TPE (15 trials, 75 fits) | `n_estimators=450`, `max_depth=5`, `learning_rate=0.0712`, `subsample=0.8987`, `colsample_bytree=0.9863`, `reg_alpha=0.8196`, `reg_lambda=0.0562` | `0.6449 ± 0.0331` | `0.9112 ± 0.0466` | `287.80` | `4.88` |

---

## Validation & Test Performance (Original Target Unit)

| Model | Validation R² | Validation RMSE | Validation MAE | Test R² | Test RMSE | Test MAE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline (Dummy Mean)** | `-0.0089` | `1.6860` | `1.2883` | `-0.0007` | `1.4636` | `1.1681` |
| **Linear Regression** | `-122.6949` | `18.6684` | `1.7481` | `-0.0076` | `1.4686` | `0.9846` |
| **SVR (RBF)** | `0.5541` | `1.1209` | `0.7573` | `0.5011` | `1.0335` | `0.7100` |
| **Random Forest** | `0.6269` | `1.0252` | `0.6990` | `0.5835` | `0.9442` | `0.6583` |
| **XGBoost** | `0.7027` | `0.9152` | `0.6130` | `0.6510` | `0.8643` | `0.5964` |

---

## Key Observations
1. **Unregularized OLS Failure:** Ordinary `LinearRegression` suffers severe numerical instability on 193 correlated chemical RAC descriptors (Validation $R^2 = -122.69$, CV $\text{RMSE} = 4.05 \pm 5.00$), demonstrating why regularization or nonlinear learners are essential.
2. **Nonlinear Gain:** `SVR` (RBF kernel) captures nonlinear interactions and improves Test $R^2$ to `0.5011` ($\text{RMSE} = 1.0335$).
3. **Tree-Ensemble Advantage:** `Random Forest` improves Test $R^2$ to `0.5835` ($\text{RMSE} = 0.9442$), and gradient-boosted `XGBoost` achieves the strongest classical performance (`Validation R² = 0.7027`, `Validation RMSE = 0.9152`, `Test R² = 0.6510`, `Test RMSE = 0.8643`).
4. **Top Classical Feature Importances:** Both Random Forest and XGBoost prioritize metal-centered electronegativity and ionization RACs (`mc_CRY-chi-2-all`, `mc_CRY-chi-0-all`, `mc_CRY-I-1-all`) alongside pore/crystal descriptors (`Di`, `Df`, `density [g/cm^3]`, `POAV [cm^3/g]`).
