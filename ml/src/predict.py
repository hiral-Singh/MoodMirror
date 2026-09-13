from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import joblib
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_PATH = ROOT / "models" / "phase2_best_model.joblib"


def _sigmoid(scores: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-scores))


def predict_journal_entry(text: str, model_path: str | Path = DEFAULT_MODEL_PATH) -> dict[str, Any]:
    bundle = joblib.load(model_path)
    vectorizer = bundle["vectorizer"]
    model = bundle["model"]
    labels = bundle["labels"]
    threshold = bundle["threshold"]
    transformed = vectorizer.transform([text])

    if hasattr(model, "predict_proba") and threshold is not None:
        scores = model.predict_proba(transformed)[0]
        predicted_mask = scores >= threshold
        score_type = "probability"
    elif hasattr(model, "decision_function"):
        raw_scores = model.decision_function(transformed)
        raw_scores = raw_scores[0] if raw_scores.ndim == 2 else raw_scores
        scores = _sigmoid(raw_scores)
        predicted_mask = raw_scores >= 0
        score_type = "decision_score_sigmoid_scaled"
    else:
        predictions = model.predict(transformed)[0]
        scores = predictions.astype(float)
        predicted_mask = predictions.astype(bool)
        score_type = "prediction_only"

    emotion_scores = [
        {
            "emotion": label,
            "score": round(float(score), 4),
            "predicted": bool(predicted),
        }
        for label, score, predicted in zip(labels, scores, predicted_mask)
    ]

    return {
        "predicted_emotions": [row["emotion"] for row in emotion_scores if row["predicted"]],
        "threshold": threshold,
        "score_type": score_type,
        "scores": emotion_scores,
        "model_name": bundle["model_name"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict MoodMirror emotion labels for a journal entry.")
    parser.add_argument("text", help="Journal text to classify")
    parser.add_argument("--model-path", default=str(DEFAULT_MODEL_PATH), help="Path to saved joblib model bundle")
    args = parser.parse_args()
    result = predict_journal_entry(args.text, args.model_path)
    print(result)


if __name__ == "__main__":
    main()
