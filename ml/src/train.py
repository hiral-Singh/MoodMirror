from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from iterstrat.ml_stratifiers import MultilabelStratifiedShuffleSplit
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.svm import LinearSVC

from evaluate import (
    EMOTION_COLUMNS,
    EMOTIONS,
    evaluate_thresholds,
    make_json_safe,
    multilabel_metrics,
    per_label_metrics,
    predictions_from_probabilities,
    rare_label_macro_f1,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "data.csv"
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"
RESULTS_PATH = REPORTS_DIR / "phase2_results.json"
REPORT_PATH = REPORTS_DIR / "phase2_report.md"
MODEL_PATH = MODELS_DIR / "phase2_best_model.joblib"
RANDOM_SEED = 42
TEST_SIZE = 0.2
THRESHOLDS = [0.30, 0.40, 0.50, 0.60, 0.70]
RARE_LABELS = ["jealous", "awkward", "ashamed", "afraid", "disgusted"]

TFIDF_CONFIG = {
    "lowercase": True,
    "ngram_range": (1, 2),
    "min_df": 2,
    "max_features": 20000,
    "stop_words": None,
    "sublinear_tf": True,
}


def load_dataset() -> tuple[pd.Series, np.ndarray, pd.DataFrame]:
    df = pd.read_csv(DATA_PATH)
    missing_columns = [column for column in ["Answer", *EMOTION_COLUMNS] if column not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    x = df["Answer"].fillna("").astype(str)
    y = df[EMOTION_COLUMNS].replace({"TRUE": 1, "FALSE": 0, True: 1, False: 0}).astype(int).to_numpy()
    return x, y, df


def multilabel_split(x: pd.Series, y: np.ndarray) -> tuple[np.ndarray, np.ndarray, str]:
    splitter = MultilabelStratifiedShuffleSplit(
        n_splits=1,
        test_size=TEST_SIZE,
        random_state=RANDOM_SEED,
    )
    train_index, test_index = next(splitter.split(x.to_numpy(), y))
    return train_index, test_index, "MultilabelStratifiedShuffleSplit(iterative stratification)"


def build_vectorizer() -> TfidfVectorizer:
    return TfidfVectorizer(**TFIDF_CONFIG)


def train_logistic(class_weight: str | None) -> OneVsRestClassifier:
    estimator = LogisticRegression(
        solver="liblinear",
        max_iter=2000,
        class_weight=class_weight,
        random_state=RANDOM_SEED,
    )
    return OneVsRestClassifier(estimator, n_jobs=-1)


def train_linear_svm() -> OneVsRestClassifier:
    estimator = LinearSVC(
        random_state=RANDOM_SEED,
        class_weight=None,
        dual="auto",
        max_iter=5000,
    )
    return OneVsRestClassifier(estimator, n_jobs=-1)


def evaluate_logistic_model(
    name: str,
    model: OneVsRestClassifier,
    y_test: np.ndarray,
    thresholds: list[float],
) -> dict[str, Any]:
    probabilities = model.predict_proba
    y_prob = probabilities_cache = probabilities(X_TEST_TFIDF)
    threshold_rows = evaluate_thresholds(y_test, y_prob, thresholds)
    best_threshold_row = sorted(
        threshold_rows,
        key=lambda row: (row["macro_f1"], row["micro_f1"], row["weighted_f1"]),
        reverse=True,
    )[0]
    best_threshold = best_threshold_row["threshold"]
    y_pred = predictions_from_probabilities(y_prob, best_threshold)
    per_label = per_label_metrics(y_test, y_pred)
    return {
        "name": name,
        "threshold_analysis": threshold_rows,
        "selected_threshold": best_threshold,
        "selected_metrics": best_threshold_row,
        "per_label_metrics": per_label,
        "rare_label_macro_f1": rare_label_macro_f1(per_label, RARE_LABELS),
        "_probabilities_shape": list(probabilities_cache.shape),
    }


def evaluate_svm_model(model: OneVsRestClassifier, y_test: np.ndarray) -> dict[str, Any]:
    y_pred = model.predict(X_TEST_TFIDF)
    per_label = per_label_metrics(y_test, y_pred)
    return {
        "name": "One-vs-Rest Linear SVM",
        "metrics": multilabel_metrics(y_test, y_pred),
        "per_label_metrics": per_label,
        "rare_label_macro_f1": rare_label_macro_f1(per_label, RARE_LABELS),
    }


def select_best_model(logistic_results: list[dict[str, Any]], svm_result: dict[str, Any]) -> dict[str, Any]:
    candidates = []
    for result in logistic_results:
        metrics = result["selected_metrics"]
        candidates.append(
            {
                "model_family": "logistic_regression",
                "name": result["name"],
                "threshold": result["selected_threshold"],
                "macro_f1": metrics["macro_f1"],
                "micro_f1": metrics["micro_f1"],
                "rare_label_macro_f1": result["rare_label_macro_f1"],
                "selection_score": round(
                    0.5 * metrics["macro_f1"]
                    + 0.35 * metrics["micro_f1"]
                    + 0.15 * result["rare_label_macro_f1"],
                    4,
                ),
            }
        )

    svm_metrics = svm_result["metrics"]
    candidates.append(
        {
            "model_family": "linear_svm",
            "name": svm_result["name"],
            "threshold": None,
            "macro_f1": svm_metrics["macro_f1"],
            "micro_f1": svm_metrics["micro_f1"],
            "rare_label_macro_f1": svm_result["rare_label_macro_f1"],
            "selection_score": round(
                0.5 * svm_metrics["macro_f1"]
                + 0.35 * svm_metrics["micro_f1"]
                + 0.15 * svm_result["rare_label_macro_f1"],
                4,
            ),
        }
    )
    return sorted(candidates, key=lambda row: row["selection_score"], reverse=True)[0] | {
        "all_candidates": candidates
    }


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    header = "| " + " | ".join(headers) + " |"
    separator = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(str(value) for value in row) + " |" for row in rows]
    return "\n".join([header, separator, *body])


def write_report(results: dict[str, Any]) -> None:
    best = results["model_selection"]["best"]
    logistic_sections = []
    for result in results["logistic_regression"]:
        logistic_sections.extend(
            [
                f"### {result['name']}",
                f"- Selected threshold: `{result['selected_threshold']}`",
                f"- Rare-label macro F1: `{result['rare_label_macro_f1']}`",
                "",
                render_table(
                    [
                        "Threshold",
                        "Micro F1",
                        "Macro F1",
                        "Weighted F1",
                        "Precision",
                        "Recall",
                        "Hamming Loss",
                        "Exact Match",
                    ],
                    [
                        [
                            row["threshold"],
                            row["micro_f1"],
                            row["macro_f1"],
                            row["weighted_f1"],
                            row["precision_micro"],
                            row["recall_micro"],
                            row["hamming_loss"],
                            row["exact_match_accuracy"],
                        ]
                        for row in result["threshold_analysis"]
                    ],
                ),
                "",
                "#### Per-Emotion Metrics At Selected Threshold",
                render_table(
                    ["Emotion", "Precision", "Recall", "F1", "Support"],
                    [
                        [row["emotion"], row["precision"], row["recall"], row["f1"], row["support"]]
                        for row in result["per_label_metrics"]
                    ],
                ),
                "",
            ]
        )

    svm = results["linear_svm"]
    lines = [
        "# MoodMirror Phase 2 ML Baseline Report",
        "",
        "## Dataset And Split",
        f"- Dataset: `{results['dataset']['path']}`",
        f"- Rows: `{results['dataset']['rows']}`",
        f"- Emotion labels: `{len(EMOTIONS)}`",
        f"- Train rows: `{results['split']['train_rows']}`",
        f"- Test rows: `{results['split']['test_rows']}`",
        f"- Split method: `{results['split']['method']}`",
        f"- Random seed: `{RANDOM_SEED}`",
        "",
        "## TF-IDF Configuration",
        render_table(
            ["Setting", "Value"],
            [[key, value] for key, value in results["tfidf"].items()],
        ),
        "",
        "## Logistic Regression Results",
        *logistic_sections,
        "## Linear SVM Results",
        render_table(
            ["Metric", "Value"],
            [[key, value] for key, value in svm["metrics"].items()],
        ),
        "",
        f"- Rare-label macro F1: `{svm['rare_label_macro_f1']}`",
        "",
        "### Linear SVM Per-Emotion Metrics",
        render_table(
            ["Emotion", "Precision", "Recall", "F1", "Support"],
            [
                [row["emotion"], row["precision"], row["recall"], row["f1"], row["support"]]
                for row in svm["per_label_metrics"]
            ],
        ),
        "",
        "## Model Comparison And Final Choice",
        render_table(
            ["Model", "Macro F1", "Micro F1", "Rare Macro F1", "Selection Score"],
            [
                [
                    row["name"],
                    row["macro_f1"],
                    row["micro_f1"],
                    row["rare_label_macro_f1"],
                    row["selection_score"],
                ]
                for row in results["model_selection"]["best"]["all_candidates"]
            ],
        ),
        "",
        f"Selected final baseline: **{best['name']}**.",
        "",
        "The selection score weights macro F1 most heavily, then micro F1, then rare-label macro F1. Exact-match accuracy is reported but not used as the primary selection criterion.",
        "",
        "## Rare Label Limitations",
        "The rare-label metrics should be interpreted cautiously. Labels such as `jealous`, `awkward`, `ashamed`, `afraid`, and `disgusted` have very small support, so one or two examples can dramatically change precision, recall, and F1.",
        "",
        "## Saved Artifacts",
        f"- Model bundle: `{MODEL_PATH}`",
        "- Bundle contains the vectorizer, trained model, label names, selected threshold, TF-IDF config, split metadata, and selection metadata.",
    ]
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def save_best_bundle(
    best: dict[str, Any],
    vectorizer: TfidfVectorizer,
    models: dict[str, OneVsRestClassifier],
    results: dict[str, Any],
) -> None:
    selected_model = models[best["name"]]
    bundle = {
        "model": selected_model,
        "vectorizer": vectorizer,
        "labels": EMOTIONS,
        "threshold": best["threshold"],
        "model_family": best["model_family"],
        "model_name": best["name"],
        "tfidf_config": TFIDF_CONFIG,
        "split": results["split"],
        "selection": best,
    }
    joblib.dump(bundle, MODEL_PATH)


def main() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    x, y, _df = load_dataset()
    train_index, test_index, split_method = multilabel_split(x, y)
    x_train, x_test = x.iloc[train_index], x.iloc[test_index]
    y_train, y_test = y[train_index], y[test_index]

    vectorizer = build_vectorizer()
    x_train_tfidf = vectorizer.fit_transform(x_train)
    global X_TEST_TFIDF
    X_TEST_TFIDF = vectorizer.transform(x_test)

    logistic_default = train_logistic(class_weight=None)
    logistic_balanced = train_logistic(class_weight="balanced")
    svm_model = train_linear_svm()

    logistic_default.fit(x_train_tfidf, y_train)
    logistic_balanced.fit(x_train_tfidf, y_train)
    svm_model.fit(x_train_tfidf, y_train)

    logistic_results = [
        evaluate_logistic_model("One-vs-Rest Logistic Regression", logistic_default, y_test, THRESHOLDS),
        evaluate_logistic_model(
            'One-vs-Rest Logistic Regression class_weight="balanced"',
            logistic_balanced,
            y_test,
            THRESHOLDS,
        ),
    ]
    svm_result = evaluate_svm_model(svm_model, y_test)
    best = select_best_model(logistic_results, svm_result)

    results = {
        "dataset": {
            "path": str(DATA_PATH),
            "rows": len(x),
            "labels": EMOTIONS,
        },
        "split": {
            "method": split_method,
            "random_seed": RANDOM_SEED,
            "test_size": TEST_SIZE,
            "train_rows": int(len(train_index)),
            "test_rows": int(len(test_index)),
            "train_label_support": dict(zip(EMOTIONS, y_train.sum(axis=0).astype(int).tolist())),
            "test_label_support": dict(zip(EMOTIONS, y_test.sum(axis=0).astype(int).tolist())),
        },
        "tfidf": {
            **TFIDF_CONFIG,
            "vocabulary_size": int(len(vectorizer.vocabulary_)),
        },
        "logistic_regression": logistic_results,
        "linear_svm": svm_result,
        "model_selection": {
            "criterion": "0.50 * macro_f1 + 0.35 * micro_f1 + 0.15 * rare_label_macro_f1",
            "best": best,
        },
    }

    safe_results = make_json_safe(results)
    RESULTS_PATH.write_text(json.dumps(safe_results, indent=2), encoding="utf-8")
    write_report(safe_results)
    save_best_bundle(
        best,
        vectorizer,
        {
            "One-vs-Rest Logistic Regression": logistic_default,
            'One-vs-Rest Logistic Regression class_weight="balanced"': logistic_balanced,
            "One-vs-Rest Linear SVM": svm_model,
        },
        safe_results,
    )

    print(f"Wrote {RESULTS_PATH}")
    print(f"Wrote {REPORT_PATH}")
    print(f"Wrote {MODEL_PATH}")
    print(f"Selected: {best['name']}")


if __name__ == "__main__":
    main()
