from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    hamming_loss,
    precision_recall_fscore_support,
    precision_score,
    recall_score,
)


EMOTIONS = [
    "afraid",
    "angry",
    "anxious",
    "ashamed",
    "awkward",
    "bored",
    "calm",
    "confused",
    "disgusted",
    "excited",
    "frustrated",
    "happy",
    "jealous",
    "nostalgic",
    "proud",
    "sad",
    "satisfied",
    "surprised",
]

EMOTION_COLUMNS = [f"Answer.f1.{emotion}.raw" for emotion in EMOTIONS]


def multilabel_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    return {
        "micro_f1": round(float(f1_score(y_true, y_pred, average="micro", zero_division=0)), 4),
        "macro_f1": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "weighted_f1": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "precision_micro": round(float(precision_score(y_true, y_pred, average="micro", zero_division=0)), 4),
        "recall_micro": round(float(recall_score(y_true, y_pred, average="micro", zero_division=0)), 4),
        "hamming_loss": round(float(hamming_loss(y_true, y_pred)), 4),
        "exact_match_accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
    }


def per_label_metrics(y_true: np.ndarray, y_pred: np.ndarray, labels: list[str] = EMOTIONS) -> list[dict[str, Any]]:
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true,
        y_pred,
        average=None,
        zero_division=0,
    )

    return [
        {
            "emotion": label,
            "precision": round(float(precision[index]), 4),
            "recall": round(float(recall[index]), 4),
            "f1": round(float(f1[index]), 4),
            "support": int(support[index]),
        }
        for index, label in enumerate(labels)
    ]


def predictions_from_probabilities(probabilities: np.ndarray, threshold: float) -> np.ndarray:
    return (probabilities >= threshold).astype(int)


def evaluate_thresholds(
    y_true: np.ndarray,
    probabilities: np.ndarray,
    thresholds: list[float],
) -> list[dict[str, Any]]:
    rows = []
    for threshold in thresholds:
        y_pred = predictions_from_probabilities(probabilities, threshold)
        rows.append(
            {
                "threshold": threshold,
                **multilabel_metrics(y_true, y_pred),
            }
        )
    return rows


def rare_label_macro_f1(per_label: list[dict[str, Any]], rare_labels: list[str]) -> float:
    values = [row["f1"] for row in per_label if row["emotion"] in rare_labels]
    return round(float(np.mean(values)), 4) if values else 0.0


def make_json_safe(value: Any) -> Any:
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, dict):
        return {key: make_json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [make_json_safe(item) for item in value]
    return value
