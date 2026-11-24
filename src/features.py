"""
Shared feature selection and preprocessing pipeline for CO2 Uptake Prediction.
Member 2 (EDA and Feature Analyst) maintains this file.

Rules enforced:
- No target leakage (TARGET_COL, ID_COL, and RAW_NAME_COL are never in X).
- build_preprocessor() returns an UNFITTED ColumnTransformer.
- Preprocessing transformations must be fitted strictly on training data.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.config import (
    CLEAN_DATA_PATH,
    ID_COL,
    RAW_NAME_COL,
    TARGET_COL,
    TEST_PATH,
    TRAIN_PATH,
    VAL_PATH,
)

# 193 non-redundant numeric features selected strictly on train.csv
# (excludes 54 zero-variance RACs, 3 exact algebraic totals, and |r| > 0.95 collinear pairs)
NUMERIC_FEATURES: list[str] = [
    "ASA [m^2/cm^3]",
    "ASA_gravimetric",
    "Df",
    "Di",
    "cage_window_diff",
    "NASA [m^2/cm^3]",
    "POAV [cm^3/g]",
    "PONAV [cm^3/g]",
    "density [g/cm^3]",
    "mc_CRY-chi-0-all",
    "mc_CRY-chi-1-all",
    "mc_CRY-chi-2-all",
    "mc_CRY-chi-3-all",
    "mc_CRY-Z-0-all",
    "mc_CRY-Z-1-all",
    "mc_CRY-Z-2-all",
    "mc_CRY-Z-3-all",
    "mc_CRY-I-1-all",
    "mc_CRY-I-2-all",
    "mc_CRY-I-3-all",
    "mc_CRY-T-0-all",
    "mc_CRY-T-1-all",
    "mc_CRY-T-2-all",
    "mc_CRY-T-3-all",
    "mc_CRY-S-0-all",
    "mc_CRY-S-1-all",
    "mc_CRY-S-2-all",
    "mc_CRY-S-3-all",
    "D_mc_CRY-chi-1-all",
    "D_mc_CRY-chi-2-all",
    "D_mc_CRY-chi-3-all",
    "D_mc_CRY-Z-1-all",
    "D_mc_CRY-Z-2-all",
    "D_mc_CRY-Z-3-all",
    "D_mc_CRY-T-2-all",
    "D_mc_CRY-T-3-all",
    "D_mc_CRY-S-1-all",
    "D_mc_CRY-S-2-all",
    "D_mc_CRY-S-3-all",
    "sum-mc_CRY-chi-0-all",
    "sum-mc_CRY-chi-1-all",
    "sum-mc_CRY-chi-2-all",
    "sum-mc_CRY-Z-0-all",
    "sum-mc_CRY-Z-1-all",
    "sum-mc_CRY-Z-2-all",
    "sum-mc_CRY-Z-3-all",
    "sum-mc_CRY-I-3-all",
    "sum-mc_CRY-T-0-all",
    "sum-mc_CRY-T-1-all",
    "sum-mc_CRY-T-2-all",
    "sum-mc_CRY-S-0-all",
    "sum-mc_CRY-S-1-all",
    "sum-mc_CRY-S-2-all",
    "sum-D_mc_CRY-chi-1-all",
    "sum-D_mc_CRY-chi-2-all",
    "sum-D_mc_CRY-chi-3-all",
    "sum-D_mc_CRY-Z-1-all",
    "sum-D_mc_CRY-Z-2-all",
    "sum-D_mc_CRY-Z-3-all",
    "sum-D_mc_CRY-T-2-all",
    "sum-D_mc_CRY-T-3-all",
    "sum-D_mc_CRY-S-1-all",
    "sum-D_mc_CRY-S-2-all",
    "lc-chi-0-all",
    "lc-chi-1-all",
    "lc-chi-2-all",
    "lc-chi-3-all",
    "lc-Z-0-all",
    "lc-Z-1-all",
    "lc-Z-2-all",
    "lc-Z-3-all",
    "lc-I-2-all",
    "lc-T-0-all",
    "lc-T-1-all",
    "lc-T-3-all",
    "lc-S-0-all",
    "lc-S-1-all",
    "lc-S-3-all",
    "lc-alpha-0-all",
    "lc-alpha-1-all",
    "lc-alpha-2-all",
    "lc-alpha-3-all",
    "D_lc-chi-1-all",
    "D_lc-chi-2-all",
    "D_lc-chi-3-all",
    "D_lc-Z-1-all",
    "D_lc-Z-2-all",
    "D_lc-Z-3-all",
    "D_lc-T-1-all",
    "D_lc-T-2-all",
    "D_lc-T-3-all",
    "D_lc-alpha-1-all",
    "D_lc-alpha-2-all",
    "D_lc-alpha-3-all",
    "func-chi-0-all",
    "func-chi-1-all",
    "func-chi-2-all",
    "func-chi-3-all",
    "func-Z-0-all",
    "func-Z-1-all",
    "func-Z-2-all",
    "func-Z-3-all",
    "func-I-0-all",
    "func-T-0-all",
    "func-T-1-all",
    "func-T-2-all",
    "func-T-3-all",
    "func-S-3-all",
    "func-alpha-0-all",
    "func-alpha-1-all",
    "func-alpha-2-all",
    "D_func-chi-1-all",
    "D_func-chi-2-all",
    "D_func-chi-3-all",
    "D_func-Z-1-all",
    "D_func-Z-2-all",
    "D_func-Z-3-all",
    "D_func-T-1-all",
    "D_func-T-2-all",
    "D_func-T-3-all",
    "D_func-alpha-1-all",
    "D_func-alpha-2-all",
    "D_func-alpha-3-all",
    "f-lig-chi-0",
    "f-lig-Z-1",
    "f-lig-T-1",
    "f-lig-S-1",
    "sum-lc-chi-0-all",
    "sum-lc-chi-1-all",
    "sum-lc-chi-2-all",
    "sum-lc-chi-3-all",
    "sum-lc-Z-0-all",
    "sum-lc-Z-1-all",
    "sum-lc-Z-2-all",
    "sum-lc-Z-3-all",
    "sum-lc-T-0-all",
    "sum-lc-T-1-all",
    "sum-lc-T-3-all",
    "sum-lc-S-0-all",
    "sum-lc-S-3-all",
    "sum-lc-alpha-0-all",
    "sum-lc-alpha-1-all",
    "sum-lc-alpha-2-all",
    "sum-lc-alpha-3-all",
    "sum-D_lc-chi-1-all",
    "sum-D_lc-chi-2-all",
    "sum-D_lc-chi-3-all",
    "sum-D_lc-Z-1-all",
    "sum-D_lc-Z-2-all",
    "sum-D_lc-Z-3-all",
    "sum-D_lc-T-1-all",
    "sum-D_lc-T-2-all",
    "sum-D_lc-T-3-all",
    "sum-D_lc-S-1-all",
    "sum-D_lc-S-2-all",
    "sum-D_lc-S-3-all",
    "sum-D_lc-alpha-1-all",
    "sum-D_lc-alpha-2-all",
    "sum-D_lc-alpha-3-all",
    "sum-func-chi-0-all",
    "sum-func-chi-1-all",
    "sum-func-chi-2-all",
    "sum-func-chi-3-all",
    "sum-func-Z-1-all",
    "sum-func-Z-3-all",
    "sum-func-T-0-all",
    "sum-func-T-1-all",
    "sum-func-T-2-all",
    "sum-func-T-3-all",
    "sum-func-S-3-all",
    "sum-func-alpha-0-all",
    "sum-func-alpha-1-all",
    "sum-func-alpha-2-all",
    "sum-func-alpha-3-all",
    "sum-D_func-chi-1-all",
    "sum-D_func-chi-2-all",
    "sum-D_func-chi-3-all",
    "sum-D_func-Z-1-all",
    "sum-D_func-Z-2-all",
    "sum-D_func-Z-3-all",
    "sum-D_func-T-1-all",
    "sum-D_func-T-2-all",
    "sum-D_func-T-3-all",
    "sum-D_func-S-2-all",
    "sum-D_func-S-3-all",
    "sum-D_func-alpha-1-all",
    "sum-D_func-alpha-2-all",
    "sum-D_func-alpha-3-all",
    "sum-f-lig-chi-0",
    "sum-f-lig-Z-1",
    "sum-f-lig-I-3",
    "sum-f-lig-T-1",
    "sum-f-lig-S-1",
]

# No categorical features exist in this dataset (MOFname is a unique row identifier)
CATEGORICAL_FEATURES: list[str] = []

SELECTED_FEATURES: list[str] = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute scientifically justified row-wise structural features without leakage:
    - ASA_gravimetric: Accessible surface area per unit mass (m^2/g), matching gravimetric uptake.
    - cage_window_diff: Difference between cavity (Di) and limiting aperture (Df) diameters.
    """
    out = df.copy()
    engineered = pd.DataFrame(
        {
            "ASA_gravimetric": out["ASA [m^2/cm^3]"] / out["density [g/cm^3]"],
            "cage_window_diff": out["Di"] - out["Df"],
        },
        index=out.index,
    )
    return pd.concat([out, engineered], axis=1)


def build_preprocessor() -> ColumnTransformer:
    """
    Return an UNFITTED ColumnTransformer combining numerical scaling and categorical encoding.
    Fit only on training data!
    """
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    transformers = [("num", numeric_pipeline, NUMERIC_FEATURES)]
    if CATEGORICAL_FEATURES:
        transformers.append(("cat", categorical_pipeline, CATEGORICAL_FEATURES))

    return ColumnTransformer(transformers=transformers, remainder="drop")


def get_xy(split: str) -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Load a processed dataset split ('train', 'val', 'test', or 'clean') and return (X, y, row_ids).
    Verifies zero target leakage, zero ID inclusion, and no NaN/Inf values.
    """
    split_map = {
        "train": TRAIN_PATH,
        "val": VAL_PATH,
        "test": TEST_PATH,
        "clean": CLEAN_DATA_PATH,
    }
    key = split.lower().strip()
    if key not in split_map:
        raise ValueError(f"Unknown split '{split}'. Expected one of {list(split_map.keys())}.")

    df = pd.read_csv(split_map[key])
    df = add_engineered_features(df)

    # Leakage & integrity guards
    assert ID_COL not in SELECTED_FEATURES
    assert RAW_NAME_COL not in SELECTED_FEATURES
    assert TARGET_COL not in SELECTED_FEATURES

    X = df[SELECTED_FEATURES].copy()
    y = df[TARGET_COL].astype(float).copy()
    row_ids = df[ID_COL].astype(int).copy()

    if X.isna().any().any() or y.isna().any():
        raise ValueError(f"Unexpected NaN detected in split '{split}'.")
    if np.isinf(X.select_dtypes(include=[np.number]).to_numpy()).any():
        raise ValueError(f"Infinite value detected in features of split '{split}'.")

    return X, y, row_ids
