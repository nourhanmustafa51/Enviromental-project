"""
Shared evaluation, prediction saving, visualization, and comparison module.
Member 5 (Evaluation and Explainability Lead) maintains this file.
All modeling notebooks must use these functions for fair, consistent evaluation.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_validate

from src.config import FIGURES_DIR, PREDICTIONS_DIR, RANDOM_SEED, RESULTS_DIR, TARGET_COL


def compute_metrics(y_true, y_pred) -> dict[str, float]:
    """Compute R2, RMSE, and MAE on predictions in original target units."""
    y_true_arr = np.asarray(y_true, dtype=float)
    y_pred_arr = np.asarray(y_pred, dtype=float)

    if y_true_arr.shape != y_pred_arr.shape:
        raise ValueError(
            f"Shape mismatch: y_true {y_true_arr.shape} vs y_pred {y_pred_arr.shape}"
        )
    if np.isnan(y_true_arr).any() or np.isnan(y_pred_arr).any():
        raise ValueError("NaN values detected in y_true or y_pred.")
    if np.isinf(y_true_arr).any() or np.isinf(y_pred_arr).any():
        raise ValueError("Infinite values detected in y_true or y_pred.")

    rmse = float(np.sqrt(mean_squared_error(y_true_arr, y_pred_arr)))
    mae = float(mean_absolute_error(y_true_arr, y_pred_arr))
    r2 = float(r2_score(y_true_arr, y_pred_arr))
    return {"r2": r2, "rmse": rmse, "mae": mae}


def cross_validate_model(model, X, y, cv: int = 5) -> dict[str, float]:
    """Run K-Fold cross-validation on training data and report mean and std."""
    kfold = KFold(n_splits=cv, shuffle=True, random_state=RANDOM_SEED)
    scoring = {
        "r2": "r2",
        "neg_rmse": "neg_root_mean_squared_error",
        "neg_mae": "neg_mean_absolute_error",
    }
    cv_results = cross_validate(model, X, y, cv=kfold, scoring=scoring, n_jobs=-1)

    r2_scores = cv_results["test_r2"]
    rmse_scores = -cv_results["test_neg_rmse"]
    mae_scores = -cv_results["test_neg_mae"]

    return {
        "r2_mean": float(np.mean(r2_scores)),
        "r2_std": float(np.std(r2_scores)),
        "rmse_mean": float(np.mean(rmse_scores)),
        "rmse_std": float(np.std(rmse_scores)),
        "mae_mean": float(np.mean(mae_scores)),
        "mae_std": float(np.std(mae_scores)),
    }


def save_predictions(
    row_ids,
    y_true,
    y_pred,
    model_name: str,
    split: str,
    output_dir: Path | None = None,
) -> Path:
    """Save predictions in mandatory format: row_id, y_true, y_pred."""
    out_dir = Path(output_dir) if output_dir else PREDICTIONS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    row_ids_arr = np.asarray(row_ids)
    y_true_arr = np.asarray(y_true, dtype=float)
    y_pred_arr = np.asarray(y_pred, dtype=float)

    if not (len(row_ids_arr) == len(y_true_arr) == len(y_pred_arr)):
        raise ValueError("row_ids, y_true, and y_pred must have the same length.")
    if np.isnan(y_pred_arr).any() or np.isinf(y_pred_arr).any():
        raise ValueError("Predictions contain NaN or infinite values.")

    df_pred = pd.DataFrame(
        {
            "row_id": row_ids_arr,
            "y_true": y_true_arr,
            "y_pred": y_pred_arr,
        }
    )
    out_path = out_dir / f"{model_name}_{split}_predictions.csv"
    df_pred.to_csv(out_path, index=False)
    return out_path


def save_model_run_metadata(
    model_name: str,
    display_name: str,
    training_time_sec: float,
    search_time_sec: float = 0.0,
    cv_summary: dict[str, float] | None = None,
    extra: dict[str, Any] | None = None,
) -> Path:
    """Persist training/search timing and metadata for unified model comparison."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    payload: dict[str, Any] = {
        "model_name": model_name,
        "display_name": display_name,
        "training_time_sec": float(training_time_sec),
        "search_time_sec": float(search_time_sec),
        "cv_summary": cv_summary or {},
        "extra": extra or {},
    }
    meta_path = RESULTS_DIR / f"{model_name}_meta.json"
    meta_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return meta_path


def plot_parity(
    y_true,
    y_pred,
    model_name: str,
    split: str = "test",
    save_path: Path | None = None,
) -> Path:
    """Plot predicted vs. actual CO2 uptake with ideal y=x reference line."""
    metrics = compute_metrics(y_true, y_pred)
    y_true_arr = np.asarray(y_true, dtype=float)
    y_pred_arr = np.asarray(y_pred, dtype=float)

    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    out_path = save_path or (FIGURES_DIR / f"parity_{model_name}_{split}.png")

    fig, ax = plt.subplots(figsize=(6.5, 6.0))
    ax.scatter(y_true_arr, y_pred_arr, alpha=0.45, edgecolors="none", s=22)
    min_val = float(min(y_true_arr.min(), y_pred_arr.min()))
    max_val = float(max(y_true_arr.max(), y_pred_arr.max()))
    ax.plot([min_val, max_val], [min_val, max_val], "r--", lw=1.8, label="Ideal (y = x)")

    ax.set_title(f"Parity Plot: {model_name} ({split.capitalize()} Set)")
    ax.set_xlabel(f"Actual {TARGET_COL} (mmol/g assumed)")
    ax.set_ylabel(f"Predicted {TARGET_COL} (mmol/g assumed)")
    ax.legend(loc="upper left")
    ax.text(
        0.96,
        0.06,
        f"R² = {metrics['r2']:.4f}\nRMSE = {metrics['rmse']:.4f}\nMAE = {metrics['mae']:.4f}",
        transform=ax.transAxes,
        ha="right",
        va="bottom",
        bbox=dict(boxstyle="round", facecolor="white", alpha=0.85),
    )
    ax.grid(alpha=0.25)
    fig.tight_layout()
    fig.savefig(out_path, dpi=200)
    plt.close(fig)
    return out_path


def plot_residuals(
    y_true,
    y_pred,
    model_name: str,
    split: str = "test",
    save_path: Path | None = None,
) -> Path:
    """Plot residuals (y_true - y_pred) vs. predicted values and error histogram."""
    y_true_arr = np.asarray(y_true, dtype=float)
    y_pred_arr = np.asarray(y_pred, dtype=float)
    residuals = y_true_arr - y_pred_arr

    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    out_path = save_path or (FIGURES_DIR / f"residuals_{model_name}_{split}.png")

    fig, axes = plt.subplots(1, 2, figsize=(11.5, 4.8))

    axes[0].scatter(y_pred_arr, residuals, alpha=0.45, s=20, edgecolors="none")
    axes[0].axhline(0.0, color="red", linestyle="--", linewidth=1.6)
    axes[0].set_title(f"Residuals vs Predicted: {model_name} ({split.capitalize()})")
    axes[0].set_xlabel(f"Predicted {TARGET_COL} (mmol/g assumed)")
    axes[0].set_ylabel("Residual (Actual - Predicted)")
    axes[0].grid(alpha=0.25)

    axes[1].hist(residuals, bins=35, edgecolor="black", alpha=0.75)
    axes[1].axvline(0.0, color="red", linestyle="--", linewidth=1.6)
    axes[1].set_title(f"Residual Distribution: {model_name} ({split.capitalize()})")
    axes[1].set_xlabel("Residual (Actual - Predicted)")
    axes[1].set_ylabel("Count")
    axes[1].grid(alpha=0.25)

    fig.tight_layout()
    fig.savefig(out_path, dpi=200)
    plt.close(fig)
    return out_path


def compare_models(
    model_order: list[str] | None = None,
    predictions_dir: Path | None = None,
    results_dir: Path | None = None,
) -> pd.DataFrame:
    """
    Aggregate validation/test metrics and training times across all models.
    Saves results/model_comparison.csv and comparison bar charts in figures/.
    """
    pred_dir = Path(predictions_dir) if predictions_dir else PREDICTIONS_DIR
    res_dir = Path(results_dir) if results_dir else RESULTS_DIR
    res_dir.mkdir(parents=True, exist_ok=True)
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)

    if model_order is None:
        val_files = sorted(pred_dir.glob("*_val_predictions.csv"))
        model_order = [p.name.replace("_val_predictions.csv", "") for p in val_files]

    rows = []
    for model_name in model_order:
        val_path = pred_dir / f"{model_name}_val_predictions.csv"
        test_path = pred_dir / f"{model_name}_test_predictions.csv"
        meta_path = res_dir / f"{model_name}_meta.json"

        if not val_path.exists() or not test_path.exists():
            continue

        val_df = pd.read_csv(val_path)
        test_df = pd.read_csv(test_path)
        val_m = compute_metrics(val_df["y_true"], val_df["y_pred"])
        test_m = compute_metrics(test_df["y_true"], test_df["y_pred"])

        display_name = model_name
        train_time = np.nan
        if meta_path.exists():
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            display_name = meta.get("display_name", model_name)
            train_time = meta.get("training_time_sec", np.nan)

        rows.append(
            {
                "Model": display_name,
                "model_key": model_name,
                "Validation R2": round(val_m["r2"], 4),
                "Validation RMSE": round(val_m["rmse"], 4),
                "Validation MAE": round(val_m["mae"], 4),
                "Test R2": round(test_m["r2"], 4),
                "Test RMSE": round(test_m["rmse"], 4),
                "Test MAE": round(test_m["mae"], 4),
                "Training Time (s)": round(float(train_time), 2)
                if not pd.isna(train_time)
                else np.nan,
            }
        )

    df_comp = pd.DataFrame(rows)
    if not df_comp.empty:
        df_comp = df_comp.sort_values(by="Validation RMSE", ascending=True).reset_index(drop=True)
        out_csv = res_dir / "model_comparison.csv"
        df_comp.drop(columns=["model_key"]).to_csv(out_csv, index=False)

        # Save comparison plot (Validation vs Test R2 and RMSE)
        fig, axes = plt.subplots(1, 2, figsize=(13, 5))
        x = np.arange(len(df_comp))
        width = 0.36

        axes[0].bar(x - width / 2, df_comp["Validation R2"], width, label="Validation")
        axes[0].bar(x + width / 2, df_comp["Test R2"], width, label="Test")
        axes[0].set_xticks(x)
        axes[0].set_xticklabels(df_comp["Model"], rotation=25, ha="right")
        axes[0].set_ylabel("R² Score (higher is better)")
        axes[0].set_title("Model Comparison: R² Score")
        axes[0].legend()
        axes[0].grid(axis="y", alpha=0.25)

        axes[1].bar(x - width / 2, df_comp["Validation RMSE"], width, label="Validation")
        axes[1].bar(x + width / 2, df_comp["Test RMSE"], width, label="Test")
        axes[1].set_xticks(x)
        axes[1].set_xticklabels(df_comp["Model"], rotation=25, ha="right")
        axes[1].set_ylabel("RMSE (lower is better)")
        axes[1].set_title("Model Comparison: RMSE")
        axes[1].legend()
        axes[1].grid(axis="y", alpha=0.25)

        fig.tight_layout()
        fig.savefig(FIGURES_DIR / "model_comparison_metrics.png", dpi=200)
        plt.close(fig)

    return df_comp
