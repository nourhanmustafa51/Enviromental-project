"""
Shared project configuration for CO2 Uptake Prediction (Adsorbents & MOFs).
Member 1 (Data Lead and Coordinator) maintains this file.
All team members must import shared constants and paths from src/config.py.
"""

from pathlib import Path

# ---------------------------------------------------------------------------
# Reproducibility & Target Configuration (Mandatory Shared Rules 1 & 2)
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
TARGET_COL = "CO2 uptake at 0.15 bar and 298K"
TARGET_UNIT_NOTE = (
    "Unit not explicitly printed in raw CSV header; assumed mmol/g (mol/kg) "
    "per standard CoRE MOF / CHE 1147 0.15 bar, 298 K simulation benchmark."
)

# Identifier columns (never use as ML model features)
ID_COL = "row_id"
RAW_NAME_COL = "MOFname"

# ---------------------------------------------------------------------------
# Team-Agreed Modeling & Splitting Defaults
# ---------------------------------------------------------------------------
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

CV_FOLDS = 5
DL_FRAMEWORK = "pytorch"       # Agreed DL library for Member 4 (Part A)
GA_HYBRID_OPTION = "Option A"  # Option A: GA optimizes ANN hyperparameters

# ---------------------------------------------------------------------------
# Project Directory Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

RAW_TRAIN_PATH = RAW_DATA_DIR / "train.csv"
RAW_TEST_PATH = RAW_DATA_DIR / "test.csv"

CLEAN_DATA_PATH = PROCESSED_DATA_DIR / "clean_data.csv"
TRAIN_PATH = PROCESSED_DATA_DIR / "train.csv"
VAL_PATH = PROCESSED_DATA_DIR / "val.csv"
TEST_PATH = PROCESSED_DATA_DIR / "test.csv"

DOCS_DIR = PROJECT_ROOT / "docs"
NOTEBOOKS_DIR = PROJECT_ROOT / "notebooks"
MODELS_DIR = PROJECT_ROOT / "models"
PREDICTIONS_DIR = PROJECT_ROOT / "predictions"
RESULTS_DIR = PROJECT_ROOT / "results"
FIGURES_DIR = PROJECT_ROOT / "figures"
REPORT_DIR = PROJECT_ROOT / "report"
