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
from sklearn.naive_bayes import ComplementNB
from sklearn.svm import LinearSVC

from evaluate import (
    EMOTION_COLUMNS,
    EMOTIONS,
    make_json_safe,
    multilabel_metrics,
    per_label_metrics,
    predictions_from_probabilities,
    rare_label_macro_f1,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "data.csv"
REPORTS_DIR = ROOT / "reports"
MODELS_DIR = ROOT / "models"
PHASE2_MODEL_PATH = MODELS_DIR / "phase2_best_model.joblib"
PHASE3_RESULTS_PATH = REPORTS_DIR / "phase3_results.json"
PHASE3_REPORT_PATH = REPORTS_DIR / "phase3_report.md"
PHASE3_PREDICTIONS_PATH = REPORTS_DIR / "phase3_test_predictions.csv"
PHASE3_ERRORS_PATH = REPORTS_DIR / "phase3_error_examples.csv"
PHASE3_MODEL_PATH = MODELS_DIR / "phase3_best_model.joblib"

RANDOM_SEED = 42
TEST_SIZE = 0.2
VALIDATION_SIZE = 0.2
THRESHOLD_GRID = [round(value, 2) for value in np.arange(0.10, 0.81, 0.05)]
RARE_LABELS = ["jealous", "awkward", "ashamed", "afraid", "disgusted"]
SELECTION_CRITERION = "0.50 * macro_f1 + 0.35 * micro_f1 + 0.15 * rare_label_macro_f1"


def load_dataset() -> tuple[pd.Series, np.ndarray, pd.DataFrame]:
    df = pd.read_csv(DATA_PATH)
    missing_columns = [column for column in ["Answer", *EMOTION_COLUMNS] if column not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")
    x = df["Answer"].fillna("").astype(str)
    y = df[EMOTION_COLUMNS].replace({"TRUE": 1, "FALSE": 0, True: 1, False: 0}).astype(int).to_numpy()
    return x, y, df


def multilabel_split(
    x: pd.Series,
    y: np.ndarray,
    test_size: float,
    random_seed: int,
) -> tuple[np.ndarray, np.ndarray]:
    splitter = MultilabelStratifiedShuffleSplit(
        n_splits=1,
        test_size=test_size,
        random_state=random_seed,
    )
    return next(splitter.split(x.to_numpy(), y))


def make_vectorizer(config: dict[str, Any]) -> TfidfVectorizer:
    return TfidfVectorizer(**config)


def make_estimator(kind: str, params: dict[str, Any]) -> OneVsRestClassifier:
    if kind == "logistic_regression":
        estimator = LogisticRegression(
            solver="liblinear",
            max_iter=3000,
            random_state=RANDOM_SEED,
            **params,
        )
    elif kind == "linear_svm":
        estimator = LinearSVC(
            random_state=RANDOM_SEED,
            dual="auto",
            max_iter=5000,
            **params,
        )
    elif kind == "complement_nb":
        estimator = ComplementNB(**params)
    else:
        raise ValueError(f"Unknown estimator kind: {kind}")
    return OneVsRestClassifier(estimator, n_jobs=-1)


def selection_score(metrics: dict[str, float], rare_macro_f1: float) -> float:
    return round(0.5 * metrics["macro_f1"] + 0.35 * metrics["micro_f1"] + 0.15 * rare_macro_f1, 4)


def predict_with_thresholds(probabilities: np.ndarray, thresholds: float | list[float]) -> np.ndarray:
    threshold_array = np.array(thresholds)
    return (probabilities >= threshold_array).astype(int)


def model_scores(model: OneVsRestClassifier, x_matrix: Any) -> tuple[np.ndarray, str]:
    if hasattr(model, "predict_proba"):
        return model.predict_proba(x_matrix), "probability"
    if hasattr(model, "decision_function"):
        scores = model.decision_function(x_matrix)
        return scores if scores.ndim == 2 else scores.reshape(-1, 1), "decision_function"
    return model.predict(x_matrix).astype(float), "prediction"


def tune_global_threshold(y_true: np.ndarray, scores: np.ndarray) -> tuple[float, dict[str, float], list[dict[str, Any]]]:
    rows = []
    for threshold in THRESHOLD_GRID:
        y_pred = predict_with_thresholds(scores, threshold)
        per_label = per_label_metrics(y_true, y_pred)
        metrics = multilabel_metrics(y_true, y_pred)
        rare_macro = rare_label_macro_f1(per_label, RARE_LABELS)
        rows.append(
            {
                "threshold": threshold,
                **metrics,
                "rare_label_macro_f1": rare_macro,
                "selection_score": selection_score(metrics, rare_macro),
            }
        )
    best = sorted(rows, key=lambda row: (row["selection_score"], row["macro_f1"], row["micro_f1"]), reverse=True)[0]
    return float(best["threshold"]), best, rows


def tune_per_label_thresholds(y_true: np.ndarray, scores: np.ndarray) -> tuple[list[float], list[dict[str, Any]]]:
    rows = []
    thresholds = []
    for index, emotion in enumerate(EMOTIONS):
        candidates = []
        for threshold in THRESHOLD_GRID:
            y_pred_label = (scores[:, index] >= threshold).astype(int)
            label_true = y_true[:, index]
            tp = int(((label_true == 1) & (y_pred_label == 1)).sum())
            fp = int(((label_true == 0) & (y_pred_label == 1)).sum())
            fn = int(((label_true == 1) & (y_pred_label == 0)).sum())
            precision = tp / (tp + fp) if tp + fp else 0.0
            recall = tp / (tp + fn) if tp + fn else 0.0
            f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
            candidates.append(
                {
                    "threshold": threshold,
                    "precision": round(precision, 4),
                    "recall": round(recall, 4),
                    "f1": round(f1, 4),
                    "tp": tp,
                    "fp": fp,
                    "fn": fn,
                    "support": int(label_true.sum()),
                }
            )
        best = sorted(candidates, key=lambda row: (row["f1"], row["recall"], -row["fp"]), reverse=True)[0]
        thresholds.append(float(best["threshold"]))
        rows.append({"emotion": emotion, **best})
    return thresholds, rows


def evaluate_predictions(
    name: str,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    threshold: float | list[float] | None,
    score_type: str,
    model_family: str,
) -> dict[str, Any]:
    per_label = per_label_metrics(y_true, y_pred)
    metrics = multilabel_metrics(y_true, y_pred)
    rare_macro = rare_label_macro_f1(per_label, RARE_LABELS)
    return {
        "name": name,
        "model_family": model_family,
        "threshold": threshold,
        "score_type": score_type,
        "metrics": metrics,
        "per_label_metrics": per_label,
        "rare_label_macro_f1": rare_macro,
        "selection_score": selection_score(metrics, rare_macro),
    }


def label_error_analysis(y_true: np.ndarray, y_pred: np.ndarray) -> list[dict[str, Any]]:
    rows = []
    for index, emotion in enumerate(EMOTIONS):
        actual = y_true[:, index]
        predicted = y_pred[:, index]
        tp = int(((actual == 1) & (predicted == 1)).sum())
        fp = int(((actual == 0) & (predicted == 1)).sum())
        fn = int(((actual == 1) & (predicted == 0)).sum())
        tn = int(((actual == 0) & (predicted == 0)).sum())
        rows.append(
            {
                "emotion": emotion,
                "support": int(actual.sum()),
                "predicted_support": int(predicted.sum()),
                "tp": tp,
                "fp": fp,
                "fn": fn,
                "tn": tn,
            }
        )
    return rows


def row_error_summary(
    df: pd.DataFrame,
    test_index: np.ndarray,
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> pd.DataFrame:
    rows = []
    for row_position, source_index in enumerate(test_index):
        missed = [emotion for index, emotion in enumerate(EMOTIONS) if y_true[row_position, index] and not y_pred[row_position, index]]
        extra = [emotion for index, emotion in enumerate(EMOTIONS) if not y_true[row_position, index] and y_pred[row_position, index]]
        rows.append(
            {
                "source_index": int(source_index),
                "text": df.iloc[source_index]["Answer"],
                "true_labels": ", ".join([emotion for index, emotion in enumerate(EMOTIONS) if y_true[row_position, index]]),
                "predicted_labels": ", ".join([emotion for index, emotion in enumerate(EMOTIONS) if y_pred[row_position, index]]),
                "missed_labels": ", ".join(missed),
                "extra_labels": ", ".join(extra),
                "false_negative_count": len(missed),
                "false_positive_count": len(extra),
            }
        )
    return pd.DataFrame(rows)


def train_and_evaluate_experiment(
    experiment: dict[str, Any],
    x_train_full: pd.Series,
    y_train_full: np.ndarray,
    x_train_inner: pd.Series,
    y_train_inner: np.ndarray,
    x_val: pd.Series,
    y_val: np.ndarray,
    x_test: pd.Series,
    y_test: np.ndarray,
) -> tuple[dict[str, Any], dict[str, Any]]:
    vectorizer = make_vectorizer(experiment["tfidf"])
    x_train_inner_matrix = vectorizer.fit_transform(x_train_inner)
    x_val_matrix = vectorizer.transform(x_val)

    model = make_estimator(experiment["kind"], experiment["params"])
    model.fit(x_train_inner_matrix, y_train_inner)
    val_scores, score_type = model_scores(model, x_val_matrix)

    global_threshold = None
    per_label_thresholds = None
    global_tuning = None
    per_label_tuning = None
    if score_type in {"probability", "decision_function"}:
        global_threshold, _best_global_row, global_tuning = tune_global_threshold(y_val, val_scores)
        if score_type == "probability":
            per_label_thresholds, per_label_tuning = tune_per_label_thresholds(y_val, val_scores)

    final_vectorizer = make_vectorizer(experiment["tfidf"])
    x_train_full_matrix = final_vectorizer.fit_transform(x_train_full)
    x_test_matrix = final_vectorizer.transform(x_test)
    final_model = make_estimator(experiment["kind"], experiment["params"])
    final_model.fit(x_train_full_matrix, y_train_full)
    test_scores, final_score_type = model_scores(final_model, x_test_matrix)

    variants = []
    if global_threshold is not None:
        variants.append(
            evaluate_predictions(
                f"{experiment['name']} | validation global threshold",
                y_test,
                predict_with_thresholds(test_scores, global_threshold),
                global_threshold,
                final_score_type,
                experiment["kind"],
            )
        )
    if per_label_thresholds is not None:
        variants.append(
            evaluate_predictions(
                f"{experiment['name']} | validation per-label thresholds",
                y_test,
                predict_with_thresholds(test_scores, per_label_thresholds),
                per_label_thresholds,
                final_score_type,
                experiment["kind"],
            )
        )
    if not variants:
        variants.append(
            evaluate_predictions(
                experiment["name"],
                y_test,
                final_model.predict(x_test_matrix),
                None,
                final_score_type,
                experiment["kind"],
            )
        )

    best_variant = sorted(
        variants,
        key=lambda row: (row["selection_score"], row["metrics"]["macro_f1"], row["metrics"]["micro_f1"]),
        reverse=True,
    )[0]
    bundle = {
        "model": final_model,
        "vectorizer": final_vectorizer,
        "labels": EMOTIONS,
        "threshold": best_variant["threshold"],
        "model_family": best_variant["model_family"],
        "model_name": best_variant["name"],
        "tfidf_config": experiment["tfidf"],
        "split": {
            "method": "MultilabelStratifiedShuffleSplit(iterative stratification)",
            "random_seed": RANDOM_SEED,
            "test_size": TEST_SIZE,
            "validation_size_from_phase2_train": VALIDATION_SIZE,
        },
        "selection": best_variant,
    }
    return (
        {
            "name": experiment["name"],
            "kind": experiment["kind"],
            "params": experiment["params"],
            "tfidf": {**experiment["tfidf"], "vocabulary_size": int(len(final_vectorizer.vocabulary_))},
            "validation": {
                "global_threshold_tuning": global_tuning,
                "per_label_threshold_tuning": per_label_tuning,
            },
            "test_variants": variants,
            "best_test_variant": best_variant,
        },
        bundle,
    )


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    def cell(value: Any) -> str:
        return str(value).replace("|", "\\|")

    header = "| " + " | ".join(cell(header) for header in headers) + " |"
    separator = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(cell(value) for value in row) + " |" for row in rows]
    return "\n".join([header, separator, *body])


def write_report(results: dict[str, Any]) -> None:
    comparison_rows = [
        [
            row["name"],
            row["metrics"]["macro_f1"],
            row["metrics"]["micro_f1"],
            row["metrics"]["weighted_f1"],
            row["metrics"]["precision_micro"],
            row["metrics"]["recall_micro"],
            row["rare_label_macro_f1"],
            row["metrics"]["hamming_loss"],
            row["metrics"]["exact_match_accuracy"],
            row["selection_score"],
        ]
        for row in results["model_comparison"]
    ]
    best = results["best"]
    label_errors = results["error_analysis"]["label_errors"]
    lines = [
        "# MoodMirror Phase 3 Error Analysis And Classical Improvements",
        "",
        "## Dataset And Split",
        f"- Dataset: `{results['dataset']['path']}`",
        f"- Rows: `{results['dataset']['rows']}`",
        f"- Emotion labels: `{len(results['dataset']['labels'])}`",
        f"- Train rows: `{results['split']['train_rows']}`",
        f"- Validation rows from Phase 2 train: `{results['split']['validation_rows']}`",
        f"- Test rows: `{results['split']['test_rows']}`",
        f"- Random seed: `{RANDOM_SEED}`",
        "",
        "## Model Comparison On Phase 2 Test Split",
        render_table(
            [
                "Model",
                "Macro F1",
                "Micro F1",
                "Weighted F1",
                "Precision Micro",
                "Recall Micro",
                "Rare Macro F1",
                "Hamming Loss",
                "Exact Match",
                "Selection Score",
            ],
            comparison_rows,
        ),
        "",
        f"Best Phase 3 candidate: **{best['name']}**.",
        f"Phase 2 baseline selection score: `{results['baseline']['selection_score']}`.",
        f"Best Phase 3 selection score: `{best['selection_score']}`.",
        f"Improved model saved: `{results['saved_model']['saved']}`.",
        "",
        "## Baseline Error Analysis",
        render_table(
            ["Emotion", "Support", "Predicted", "TP", "FP", "FN", "TN"],
            [
                [
                    row["emotion"],
                    row["support"],
                    row["predicted_support"],
                    row["tp"],
                    row["fp"],
                    row["fn"],
                    row["tn"],
                ]
                for row in label_errors
            ],
        ),
        "",
        "## Best Model Per-Emotion Metrics",
        render_table(
            ["Emotion", "Precision", "Recall", "F1", "Support"],
            [
                [row["emotion"], row["precision"], row["recall"], row["f1"], row["support"]]
                for row in best["per_label_metrics"]
            ],
        ),
        "",
        "## Saved Artifacts",
        f"- JSON results: `{PHASE3_RESULTS_PATH}`",
        f"- Markdown report: `{PHASE3_REPORT_PATH}`",
        f"- Test predictions: `{PHASE3_PREDICTIONS_PATH}`",
        f"- Error examples: `{PHASE3_ERRORS_PATH}`",
    ]
    PHASE3_REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    x, y, df = load_dataset()
    train_index, test_index = multilabel_split(x, y, TEST_SIZE, RANDOM_SEED)
    x_train_full, x_test = x.iloc[train_index], x.iloc[test_index]
    y_train_full, y_test = y[train_index], y[test_index]

    inner_train_relative, val_relative = multilabel_split(x_train_full.reset_index(drop=True), y_train_full, VALIDATION_SIZE, RANDOM_SEED)
    x_train_inner = x_train_full.iloc[inner_train_relative]
    y_train_inner = y_train_full[inner_train_relative]
    x_val = x_train_full.iloc[val_relative]
    y_val = y_train_full[val_relative]

    phase2_bundle = joblib.load(PHASE2_MODEL_PATH)
    phase2_scores = phase2_bundle["model"].predict_proba(phase2_bundle["vectorizer"].transform(x_test))
    phase2_y_pred = predictions_from_probabilities(phase2_scores, phase2_bundle["threshold"])
    baseline = evaluate_predictions(
        phase2_bundle["model_name"],
        y_test,
        phase2_y_pred,
        phase2_bundle["threshold"],
        "probability",
        phase2_bundle["model_family"],
    )
    error_examples = row_error_summary(df, test_index, y_test, phase2_y_pred)
    error_examples.to_csv(PHASE3_ERRORS_PATH, index=False)

    prediction_rows = error_examples[["source_index", "text", "true_labels", "predicted_labels"]].copy()
    for index, emotion in enumerate(EMOTIONS):
        prediction_rows[f"true_{emotion}"] = y_test[:, index]
        prediction_rows[f"predicted_{emotion}"] = phase2_y_pred[:, index]
        prediction_rows[f"score_{emotion}"] = np.round(phase2_scores[:, index], 6)
    prediction_rows.to_csv(PHASE3_PREDICTIONS_PATH, index=False)

    tfidf_phase2 = {
        "lowercase": True,
        "ngram_range": (1, 2),
        "min_df": 2,
        "max_features": 20000,
        "stop_words": None,
        "sublinear_tf": True,
    }
    experiments = [
        {
            "name": "Logistic Regression balanced C=0.5",
            "kind": "logistic_regression",
            "params": {"class_weight": "balanced", "C": 0.5},
            "tfidf": tfidf_phase2,
        },
        {
            "name": "Logistic Regression balanced C=1.0",
            "kind": "logistic_regression",
            "params": {"class_weight": "balanced", "C": 1.0},
            "tfidf": tfidf_phase2,
        },
        {
            "name": "Logistic Regression balanced C=2.0",
            "kind": "logistic_regression",
            "params": {"class_weight": "balanced", "C": 2.0},
            "tfidf": tfidf_phase2,
        },
        {
            "name": "Logistic Regression balanced C=1.0 word trigram expanded",
            "kind": "logistic_regression",
            "params": {"class_weight": "balanced", "C": 1.0},
            "tfidf": {
                "lowercase": True,
                "ngram_range": (1, 3),
                "min_df": 1,
                "max_features": 40000,
                "stop_words": None,
                "sublinear_tf": True,
            },
        },
        {
            "name": "ComplementNB alpha=0.5",
            "kind": "complement_nb",
            "params": {"alpha": 0.5},
            "tfidf": tfidf_phase2,
        },
        {
            "name": "Linear SVM class_weight balanced",
            "kind": "linear_svm",
            "params": {"class_weight": "balanced"},
            "tfidf": tfidf_phase2,
        },
    ]

    experiment_results = []
    bundles = []
    for experiment in experiments:
        result, bundle = train_and_evaluate_experiment(
            experiment,
            x_train_full,
            y_train_full,
            x_train_inner,
            y_train_inner,
            x_val,
            y_val,
            x_test,
            y_test,
        )
        experiment_results.append(result)
        bundles.append(bundle)

    comparison = [baseline]
    for result in experiment_results:
        comparison.extend(result["test_variants"])
    best = sorted(
        comparison,
        key=lambda row: (row["selection_score"], row["metrics"]["macro_f1"], row["metrics"]["micro_f1"]),
        reverse=True,
    )[0]
    saved_model = {"saved": False, "path": None, "reason": "No Phase 3 candidate exceeded the Phase 2 baseline selection score."}
    if best["name"] != baseline["name"] and best["selection_score"] > baseline["selection_score"]:
        bundle = next(item for item in bundles if item["model_name"] == best["name"])
        joblib.dump(bundle, PHASE3_MODEL_PATH)
        saved_model = {"saved": True, "path": str(PHASE3_MODEL_PATH), "reason": "Best Phase 3 candidate exceeded Phase 2 baseline."}

    results = {
        "dataset": {
            "path": str(DATA_PATH),
            "rows": int(len(x)),
            "labels": EMOTIONS,
        },
        "split": {
            "method": "MultilabelStratifiedShuffleSplit(iterative stratification)",
            "random_seed": RANDOM_SEED,
            "test_size": TEST_SIZE,
            "validation_size_from_phase2_train": VALIDATION_SIZE,
            "train_rows": int(len(train_index)),
            "validation_rows": int(len(val_relative)),
            "test_rows": int(len(test_index)),
            "test_label_support": dict(zip(EMOTIONS, y_test.sum(axis=0).astype(int).tolist())),
        },
        "selection_criterion": SELECTION_CRITERION,
        "baseline": baseline,
        "error_analysis": {
            "label_errors": label_error_analysis(y_test, phase2_y_pred),
        },
        "experiments": experiment_results,
        "model_comparison": comparison,
        "best": best,
        "saved_model": saved_model,
    }
    safe_results = make_json_safe(results)
    PHASE3_RESULTS_PATH.write_text(json.dumps(safe_results, indent=2), encoding="utf-8")
    write_report(safe_results)

    print(f"Wrote {PHASE3_RESULTS_PATH}")
    print(f"Wrote {PHASE3_REPORT_PATH}")
    print(f"Wrote {PHASE3_PREDICTIONS_PATH}")
    print(f"Wrote {PHASE3_ERRORS_PATH}")
    if saved_model["saved"]:
        print(f"Wrote {PHASE3_MODEL_PATH}")
    print(f"Baseline selection score: {baseline['selection_score']}")
    print(f"Best selection score: {best['selection_score']}")
    print(f"Best model: {best['name']}")


if __name__ == "__main__":
    main()
