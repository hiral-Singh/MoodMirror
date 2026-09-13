# MoodMirror Phase 3 Error Analysis And Classical Improvements

## Dataset And Split
- Dataset: `D:\Project\moodMirror\ml\data\data.csv`
- Rows: `1473`
- Emotion labels: `18`
- Train rows: `1166`
- Validation rows from Phase 2 train: `235`
- Test rows: `307`
- Random seed: `42`

## Model Comparison On Phase 2 Test Split
| Model | Macro F1 | Micro F1 | Weighted F1 | Precision Micro | Recall Micro | Rare Macro F1 | Hamming Loss | Exact Match | Selection Score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| One-vs-Rest Logistic Regression class_weight="balanced" | 0.2527 | 0.4805 | 0.4757 | 0.3571 | 0.734 | 0.0 | 0.1663 | 0.0163 | 0.2945 |
| Logistic Regression balanced C=0.5 \| validation global threshold | 0.2526 | 0.4788 | 0.4731 | 0.3688 | 0.6822 | 0.0 | 0.1556 | 0.0261 | 0.2939 |
| Logistic Regression balanced C=0.5 \| validation per-label thresholds | 0.2631 | 0.3804 | 0.4729 | 0.2517 | 0.7789 | 0.0402 | 0.2658 | 0.0 | 0.2707 |
| Logistic Regression balanced C=1.0 \| validation global threshold | 0.2527 | 0.4805 | 0.4757 | 0.3571 | 0.734 | 0.0 | 0.1663 | 0.0163 | 0.2945 |
| Logistic Regression balanced C=1.0 \| validation per-label thresholds | 0.2811 | 0.4133 | 0.4735 | 0.2958 | 0.6857 | 0.0485 | 0.2039 | 0.0065 | 0.2925 |
| Logistic Regression balanced C=2.0 \| validation global threshold | 0.2608 | 0.4821 | 0.4783 | 0.3568 | 0.7427 | 0.0 | 0.1672 | 0.0163 | 0.2991 |
| Logistic Regression balanced C=2.0 \| validation per-label thresholds | 0.2671 | 0.4375 | 0.4706 | 0.3116 | 0.734 | 0.0386 | 0.1978 | 0.0098 | 0.2925 |
| Logistic Regression balanced C=1.0 word trigram expanded \| validation global threshold | 0.1891 | 0.4792 | 0.4438 | 0.4 | 0.5976 | 0.0 | 0.1361 | 0.0554 | 0.2623 |
| Logistic Regression balanced C=1.0 word trigram expanded \| validation per-label thresholds | 0.2506 | 0.3603 | 0.4634 | 0.2363 | 0.7582 | 0.0345 | 0.2821 | 0.0 | 0.2566 |
| ComplementNB alpha=0.5 \| validation global threshold | 0.168 | 0.4799 | 0.4412 | 0.3875 | 0.6304 | 0.0 | 0.1431 | 0.0391 | 0.252 |
| ComplementNB alpha=0.5 \| validation per-label thresholds | 0.1876 | 0.4205 | 0.4461 | 0.3086 | 0.6598 | 0.0 | 0.1906 | 0.0228 | 0.241 |
| Linear SVM class_weight balanced \| validation global threshold | 0.1565 | 0.3957 | 0.3706 | 0.5242 | 0.3178 | 0.0 | 0.1017 | 0.101 | 0.2167 |

Best Phase 3 candidate: **Logistic Regression balanced C=2.0 | validation global threshold**.
Phase 2 baseline selection score: `0.2945`.
Best Phase 3 selection score: `0.2991`.
Improved model saved: `True`.

## Baseline Error Analysis
| Emotion | Support | Predicted | TP | FP | FN | TN |
| --- | --- | --- | --- | --- | --- | --- |
| afraid | 4 | 0 | 0 | 0 | 4 | 303 |
| angry | 6 | 1 | 0 | 1 | 6 | 300 |
| anxious | 25 | 50 | 14 | 36 | 11 | 246 |
| ashamed | 3 | 0 | 0 | 0 | 3 | 304 |
| awkward | 3 | 0 | 0 | 0 | 3 | 304 |
| bored | 10 | 13 | 7 | 6 | 3 | 291 |
| calm | 74 | 201 | 62 | 139 | 12 | 94 |
| confused | 6 | 2 | 1 | 1 | 5 | 300 |
| disgusted | 4 | 0 | 0 | 0 | 4 | 303 |
| excited | 50 | 155 | 34 | 121 | 16 | 136 |
| frustrated | 28 | 60 | 19 | 41 | 9 | 238 |
| happy | 146 | 238 | 130 | 108 | 16 | 53 |
| jealous | 1 | 0 | 0 | 0 | 1 | 306 |
| nostalgic | 12 | 14 | 4 | 10 | 8 | 285 |
| proud | 67 | 173 | 47 | 126 | 20 | 114 |
| sad | 9 | 4 | 0 | 4 | 9 | 294 |
| satisfied | 118 | 257 | 104 | 153 | 14 | 36 |
| surprised | 13 | 22 | 3 | 19 | 10 | 275 |

## Best Model Per-Emotion Metrics
| Emotion | Precision | Recall | F1 | Support |
| --- | --- | --- | --- | --- |
| afraid | 0.0 | 0.0 | 0.0 | 4 |
| angry | 0.5 | 0.1667 | 0.25 | 6 |
| anxious | 0.2692 | 0.56 | 0.3636 | 25 |
| ashamed | 0.0 | 0.0 | 0.0 | 3 |
| awkward | 0.0 | 0.0 | 0.0 | 3 |
| bored | 0.4615 | 0.6 | 0.5217 | 10 |
| calm | 0.3005 | 0.8243 | 0.4404 | 74 |
| confused | 0.25 | 0.1667 | 0.2 | 6 |
| disgusted | 0.0 | 0.0 | 0.0 | 4 |
| excited | 0.2208 | 0.68 | 0.3333 | 50 |
| frustrated | 0.3333 | 0.6786 | 0.4471 | 28 |
| happy | 0.5403 | 0.9178 | 0.6802 | 146 |
| jealous | 0.0 | 0.0 | 0.0 | 1 |
| nostalgic | 0.2353 | 0.3333 | 0.2759 | 12 |
| proud | 0.28 | 0.7313 | 0.405 | 67 |
| sad | 0.0 | 0.0 | 0.0 | 9 |
| satisfied | 0.4071 | 0.8729 | 0.5553 | 118 |
| surprised | 0.1739 | 0.3077 | 0.2222 | 13 |

## Saved Artifacts
- JSON results: `D:\Project\moodMirror\ml\reports\phase3_results.json`
- Markdown report: `D:\Project\moodMirror\ml\reports\phase3_report.md`
- Test predictions: `D:\Project\moodMirror\ml\reports\phase3_test_predictions.csv`
- Error examples: `D:\Project\moodMirror\ml\reports\phase3_error_examples.csv`