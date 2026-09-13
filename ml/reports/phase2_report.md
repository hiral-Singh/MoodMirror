# MoodMirror Phase 2 ML Baseline Report

## Dataset And Split
- Dataset: `D:\Project\moodMirror\ml\data\data.csv`
- Rows: `1473`
- Emotion labels: `18`
- Train rows: `1166`
- Test rows: `307`
- Split method: `MultilabelStratifiedShuffleSplit(iterative stratification)`
- Random seed: `42`

## TF-IDF Configuration
| Setting | Value |
| --- | --- |
| lowercase | True |
| ngram_range | (1, 2) |
| min_df | 2 |
| max_features | 20000 |
| stop_words | None |
| sublinear_tf | True |
| vocabulary_size | 5589 |

## Logistic Regression Results
### One-vs-Rest Logistic Regression
- Selected threshold: `0.3`
- Rare-label macro F1: `0.0`

| Threshold | Micro F1 | Macro F1 | Weighted F1 | Precision | Recall | Hamming Loss | Exact Match |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.3 | 0.4862 | 0.1138 | 0.381 | 0.4465 | 0.5337 | 0.1182 | 0.0684 |
| 0.4 | 0.4451 | 0.0944 | 0.338 | 0.5272 | 0.3851 | 0.1006 | 0.1238 |
| 0.5 | 0.3166 | 0.0596 | 0.2381 | 0.6212 | 0.2124 | 0.0961 | 0.114 |
| 0.6 | 0.1626 | 0.031 | 0.1329 | 0.726 | 0.0915 | 0.0988 | 0.0684 |
| 0.7 | 0.0469 | 0.0098 | 0.0436 | 0.7778 | 0.0242 | 0.103 | 0.0195 |

#### Per-Emotion Metrics At Selected Threshold
| Emotion | Precision | Recall | F1 | Support |
| --- | --- | --- | --- | --- |
| afraid | 0.0 | 0.0 | 0.0 | 4 |
| angry | 0.0 | 0.0 | 0.0 | 6 |
| anxious | 0.0 | 0.0 | 0.0 | 25 |
| ashamed | 0.0 | 0.0 | 0.0 | 3 |
| awkward | 0.0 | 0.0 | 0.0 | 3 |
| bored | 0.0 | 0.0 | 0.0 | 10 |
| calm | 0.4026 | 0.4189 | 0.4106 | 74 |
| confused | 0.0 | 0.0 | 0.0 | 6 |
| disgusted | 0.0 | 0.0 | 0.0 | 4 |
| excited | 1.0 | 0.02 | 0.0392 | 50 |
| frustrated | 0.0 | 0.0 | 0.0 | 28 |
| happy | 0.5017 | 0.9932 | 0.6667 | 146 |
| jealous | 0.0 | 0.0 | 0.0 | 1 |
| nostalgic | 0.0 | 0.0 | 0.0 | 12 |
| proud | 0.4667 | 0.3134 | 0.375 | 67 |
| sad | 0.0 | 0.0 | 0.0 | 9 |
| satisfied | 0.3964 | 0.9407 | 0.5578 | 118 |
| surprised | 0.0 | 0.0 | 0.0 | 13 |

### One-vs-Rest Logistic Regression class_weight="balanced"
- Selected threshold: `0.4`
- Rare-label macro F1: `0.0`

| Threshold | Micro F1 | Macro F1 | Weighted F1 | Precision | Recall | Hamming Loss | Exact Match |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.3 | 0.425 | 0.2441 | 0.4554 | 0.2777 | 0.905 | 0.2566 | 0.0033 |
| 0.4 | 0.4805 | 0.2527 | 0.4757 | 0.3571 | 0.734 | 0.1663 | 0.0163 |
| 0.5 | 0.4585 | 0.206 | 0.4377 | 0.4742 | 0.4439 | 0.1098 | 0.0619 |
| 0.6 | 0.2827 | 0.1177 | 0.2691 | 0.6199 | 0.1831 | 0.0974 | 0.0912 |
| 0.7 | 0.0822 | 0.0309 | 0.0797 | 0.8621 | 0.0432 | 0.101 | 0.0358 |

#### Per-Emotion Metrics At Selected Threshold
| Emotion | Precision | Recall | F1 | Support |
| --- | --- | --- | --- | --- |
| afraid | 0.0 | 0.0 | 0.0 | 4 |
| angry | 0.0 | 0.0 | 0.0 | 6 |
| anxious | 0.28 | 0.56 | 0.3733 | 25 |
| ashamed | 0.0 | 0.0 | 0.0 | 3 |
| awkward | 0.0 | 0.0 | 0.0 | 3 |
| bored | 0.5385 | 0.7 | 0.6087 | 10 |
| calm | 0.3085 | 0.8378 | 0.4509 | 74 |
| confused | 0.5 | 0.1667 | 0.25 | 6 |
| disgusted | 0.0 | 0.0 | 0.0 | 4 |
| excited | 0.2194 | 0.68 | 0.3317 | 50 |
| frustrated | 0.3167 | 0.6786 | 0.4318 | 28 |
| happy | 0.5462 | 0.8904 | 0.6771 | 146 |
| jealous | 0.0 | 0.0 | 0.0 | 1 |
| nostalgic | 0.2857 | 0.3333 | 0.3077 | 12 |
| proud | 0.2717 | 0.7015 | 0.3917 | 67 |
| sad | 0.0 | 0.0 | 0.0 | 9 |
| satisfied | 0.4047 | 0.8814 | 0.5547 | 118 |
| surprised | 0.1364 | 0.2308 | 0.1714 | 13 |

## Linear SVM Results
| Metric | Value |
| --- | --- |
| micro_f1 | 0.4114 |
| macro_f1 | 0.1277 |
| weighted_f1 | 0.362 |
| precision_micro | 0.5667 |
| recall_micro | 0.323 |
| hamming_loss | 0.0968 |
| exact_match_accuracy | 0.1107 |

- Rare-label macro F1: `0.0`

### Linear SVM Per-Emotion Metrics
| Emotion | Precision | Recall | F1 | Support |
| --- | --- | --- | --- | --- |
| afraid | 0.0 | 0.0 | 0.0 | 4 |
| angry | 0.0 | 0.0 | 0.0 | 6 |
| anxious | 0.6667 | 0.08 | 0.1429 | 25 |
| ashamed | 0.0 | 0.0 | 0.0 | 3 |
| awkward | 0.0 | 0.0 | 0.0 | 3 |
| bored | 0.0 | 0.0 | 0.0 | 10 |
| calm | 0.375 | 0.1622 | 0.2264 | 74 |
| confused | 0.0 | 0.0 | 0.0 | 6 |
| disgusted | 0.0 | 0.0 | 0.0 | 4 |
| excited | 0.5 | 0.1 | 0.1667 | 50 |
| frustrated | 1.0 | 0.1786 | 0.303 | 28 |
| happy | 0.6376 | 0.6507 | 0.6441 | 146 |
| jealous | 0.0 | 0.0 | 0.0 | 1 |
| nostalgic | 0.0 | 0.0 | 0.0 | 12 |
| proud | 0.5667 | 0.2537 | 0.3505 | 67 |
| sad | 0.0 | 0.0 | 0.0 | 9 |
| satisfied | 0.505 | 0.4322 | 0.4658 | 118 |
| surprised | 0.0 | 0.0 | 0.0 | 13 |

## Model Comparison And Final Choice
| Model | Macro F1 | Micro F1 | Rare Macro F1 | Selection Score |
| --- | --- | --- | --- | --- |
| One-vs-Rest Logistic Regression | 0.1138 | 0.4862 | 0.0 | 0.2271 |
| One-vs-Rest Logistic Regression class_weight="balanced" | 0.2527 | 0.4805 | 0.0 | 0.2945 |
| One-vs-Rest Linear SVM | 0.1277 | 0.4114 | 0.0 | 0.2078 |

Selected final baseline: **One-vs-Rest Logistic Regression class_weight="balanced"**.

The selection score weights macro F1 most heavily, then micro F1, then rare-label macro F1. Exact-match accuracy is reported but not used as the primary selection criterion.

## Rare Label Limitations
The rare-label metrics should be interpreted cautiously. Labels such as `jealous`, `awkward`, `ashamed`, `afraid`, and `disgusted` have very small support, so one or two examples can dramatically change precision, recall, and F1.

## Saved Artifacts
- Model bundle: `D:\Project\moodMirror\ml\models\phase2_best_model.joblib`
- Bundle contains the vectorizer, trained model, label names, selected threshold, TF-IDF config, split metadata, and selection metadata.