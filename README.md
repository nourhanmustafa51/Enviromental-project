# CO₂ Uptake Prediction Using Machine Learning (Adsorbents & MOFs)

A complete, reproducible Machine Learning regression pipeline predicting the $\text{CO}_2$ adsorption capacity of Metal-Organic Frameworks (MOFs) at 0.15 bar and 298 K from geometric and Revised Autocorrelation (RAC) chemical descriptors.

## Team Structure

| Member | Role | Primary Deliverables |
| :--- | :--- | :--- |
| **Member 1** | Data Lead & Coordinator | `01_data_cleaning.ipynb`, `clean_data.csv`, `train/val/test.csv`, `data_dictionary.md`, `src/config.py`, `README.md`, `requirements.txt` |
| **Member 2** | EDA & Feature Analyst | `02_eda.ipynb`, 6–8 EDA figures, `src/features.py`, `docs/feature_selection_note.md` |
| **Member 3** | Classical ML Engineer | `03a_baseline.ipynb`, `03b_svm.ipynb`, `03c_random_forest.ipynb`, `03d_xgboost.ipynb`, saved models, predictions, `docs/tuning_log.md` |
| **Member 4** | Deep Learning & Hybrid Engineer | `04a_ann.ipynb`, `04b_ga_hybrid.ipynb` (Option A: GA optimizes ANN hyperparameters), loss & convergence curves, `docs/ann_tuning_log.md` |
| **Member 5** | Evaluation & Explainability Lead | `src/evaluate.py`, `results/model_comparison.csv`, comparison plots, `05_shap_analysis.ipynb`, final report & presentation |

## Agreed Project Defaults & Assumptions

Because certain team choices were not pre-specified in the raw dataset folder, the following reproducible engineering defaults are configured in `src/config.py`:

1. **Supervised Dataset Source**: `data/raw/train.csv` (5,014 rows, 328 columns) contains the labeled target `CO2 uptake at 0.15 bar and 298K`. `data/raw/test.csv` (2,000 rows, 273 columns) lacks the target column (`y_true`) and 54 constant descriptor columns, so it is preserved in `data/raw/` as an unlabeled external competition file and is not used for supervised evaluation.
2. **Train / Validation / Test Split**: **70% / 15% / 15%** (`random_state = 42`) created from the cleaned, deduplicated dataset.
3. **Target Unit Note**: The raw CSV header does not explicitly print the unit after `298K`. Following standard CoRE MOF / CHE 1147 0.15 bar, 298 K benchmarks, values (`~0.0` to `9.32`) are treated as original target units (likely `mmol/g` / `mol/kg`). No rescaling is applied to stored predictions.
4. **Deep Learning Framework**: **PyTorch** (`DL_FRAMEWORK = "pytorch"`).
5. **GA Hybrid Option**: **Option A** — Genetic Algorithm optimizes ANN hyperparameters using validation RMSE as fitness.

## Folder Structure

```text
mof-co2-uptake-prediction/
├── README.md
├── requirements.txt
├── data/
│   ├── raw/
│   └── processed/
├── docs/
├── notebooks/
├── src/
│   ├── config.py
│   ├── features.py
│   └── evaluate.py
├── models/
├── predictions/
├── results/
├── figures/
└── report/
```

## Mandatory Shared Rules

- `RANDOM_SEED = 42` across all splits, preprocessing, models, and notebooks.
- `TARGET_COL` is defined only once in `src/config.py`.
- All feature selection, scaling, encoding, and hyperparameter tuning are fit **strictly on training data** (`data/processed/train.csv`).
- All prediction files follow the exact schema: `row_id,y_true,y_pred`.
