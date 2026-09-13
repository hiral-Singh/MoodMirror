# MoodMirror ML EDA Report

## Dataset Shape
- Rows: 1473
- Columns: 30
- Text column: `Answer`
- Emotion label columns: 18
- Topic label columns: 11

## Data Quality
- Duplicate full rows: 0
- Duplicate normalized journal texts: 0
- Empty journal entries: 0
- Columns with missing values: 0
- Label columns with invalid boolean values: 0

## Text Statistics
| Metric | Characters | Words |
| --- | --- | --- |
| Min | 15 | 4 |
| Max | 1162 | 223 |
| Mean | 169.2 | 33.53 |
| Median | 146 | 29 |
| P90 | 303 | 60 |
| P95 | 361 | 72 |
| P99 | 568.56 | 111 |
| Std | 111.47 | 21.7 |

- Very short entries under 50 characters: 86
- Very short entries under 20 words: 388
- Entries over 1000 characters: 1

### Character Length Buckets
| Bucket | Count |
| --- | --- |
| 0-99 | 405 |
| 100-249 | 816 |
| 250-499 | 227 |
| 500-749 | 22 |
| 750-999 | 2 |
| 1000+ | 1 |

## Emotion Label Frequency
| Emotion | Positive | Negative | % Positive |
| --- | --- | --- | --- |
| happy | 730 | 743 | 49.56 |
| satisfied | 591 | 882 | 40.12 |
| calm | 368 | 1105 | 24.98 |
| proud | 337 | 1136 | 22.88 |
| excited | 251 | 1222 | 17.04 |
| frustrated | 141 | 1332 | 9.57 |
| anxious | 125 | 1348 | 8.49 |
| surprised | 64 | 1409 | 4.34 |
| nostalgic | 61 | 1412 | 4.14 |
| bored | 49 | 1424 | 3.33 |
| sad | 43 | 1430 | 2.92 |
| angry | 28 | 1445 | 1.9 |
| confused | 28 | 1445 | 1.9 |
| disgusted | 22 | 1451 | 1.49 |
| afraid | 18 | 1455 | 1.22 |
| ashamed | 17 | 1456 | 1.15 |
| awkward | 15 | 1458 | 1.02 |
| jealous | 3 | 1470 | 0.2 |

## Multi-Label Emotion Characteristics
- Average emotions per journal: 1.96
- Min emotions per journal: 1
- Max emotions per journal: 7

| # Emotions | Rows |
| --- | --- |
| 1 | 609 |
| 2 | 382 |
| 3 | 429 |
| 4 | 41 |
| 5 | 6 |
| 6 | 5 |
| 7 | 1 |

## Top Emotion Co-Occurrences
| Pair | Count | % Dataset |
| --- | --- | --- |
| happy + satisfied | 315 | 21.38 |
| calm + happy | 182 | 12.36 |
| happy + proud | 178 | 12.08 |
| excited + happy | 172 | 11.68 |
| calm + satisfied | 162 | 11 |
| proud + satisfied | 146 | 9.91 |
| excited + satisfied | 93 | 6.31 |
| excited + proud | 87 | 5.91 |
| calm + proud | 56 | 3.8 |
| anxious + frustrated | 53 | 3.6 |
| happy + nostalgic | 45 | 3.05 |
| calm + excited | 35 | 2.38 |
| happy + surprised | 34 | 2.31 |
| nostalgic + satisfied | 21 | 1.43 |
| bored + frustrated | 20 | 1.36 |

## Topic Label Frequency
| Topic | Positive | Negative | % Positive |
| --- | --- | --- | --- |
| family | 275 | 1198 | 18.67 |
| work | 235 | 1238 | 15.95 |
| food | 203 | 1270 | 13.78 |
| exercise | 185 | 1288 | 12.56 |
| sleep | 132 | 1341 | 8.96 |
| friends | 100 | 1373 | 6.79 |
| health | 99 | 1374 | 6.72 |
| recreation | 89 | 1384 | 6.04 |
| god | 67 | 1406 | 4.55 |
| love | 67 | 1406 | 4.55 |
| school | 19 | 1454 | 1.29 |

## Multi-Label Topic Characteristics
- Average topics per journal: 1
- Min topics per journal: 0
- Max topics per journal: 1

| # Topics | Rows |
| --- | --- |
| 0 | 2 |
| 1 | 1471 |

## Top Topic Co-Occurrences
| Pair | Count | % Dataset |
| --- | --- | --- |

## Emotion-Topic Relationships
Top associations use lift: emotion rate within topic divided by emotion base rate. Small topic counts should be interpreted carefully.

### family (275 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| jealous | 1 | 0.36 | 1.79 |
| nostalgic | 19 | 6.91 | 1.67 |
| sad | 13 | 4.73 | 1.62 |
| happy | 202 | 73.45 | 1.48 |
| angry | 7 | 2.55 | 1.34 |
### work (235 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| bored | 31 | 13.19 | 3.97 |
| frustrated | 56 | 23.83 | 2.49 |
| anxious | 48 | 20.43 | 2.41 |
| angry | 9 | 3.83 | 2.01 |
| disgusted | 6 | 2.55 | 1.71 |
### food (203 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| ashamed | 8 | 3.94 | 3.41 |
| jealous | 1 | 0.49 | 2.42 |
| nostalgic | 17 | 8.37 | 2.02 |
| disgusted | 5 | 2.46 | 1.65 |
| excited | 42 | 20.69 | 1.21 |
### exercise (185 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| proud | 81 | 43.78 | 1.91 |
| excited | 49 | 26.49 | 1.55 |
| satisfied | 101 | 54.59 | 1.36 |
| ashamed | 2 | 1.08 | 0.94 |
| happy | 83 | 44.86 | 0.91 |
### sleep (132 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| awkward | 3 | 2.27 | 2.23 |
| calm | 61 | 46.21 | 1.85 |
| angry | 4 | 3.03 | 1.59 |
| confused | 4 | 3.03 | 1.59 |
| afraid | 2 | 1.52 | 1.24 |
### friends (100 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| jealous | 1 | 1 | 4.91 |
| nostalgic | 14 | 14 | 3.38 |
| awkward | 3 | 3 | 2.95 |
| surprised | 9 | 9 | 2.07 |
| ashamed | 2 | 2 | 1.73 |
### health (99 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| afraid | 6 | 6.06 | 4.96 |
| confused | 7 | 7.07 | 3.72 |
| disgusted | 5 | 5.05 | 3.38 |
| anxious | 21 | 21.21 | 2.5 |
| sad | 7 | 7.07 | 2.42 |
### recreation (89 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| excited | 27 | 30.34 | 1.78 |
| calm | 37 | 41.57 | 1.66 |
| bored | 4 | 4.49 | 1.35 |
| surprised | 5 | 5.62 | 1.29 |
| confused | 2 | 2.25 | 1.18 |
### god (67 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| calm | 39 | 58.21 | 2.33 |
| nostalgic | 3 | 4.48 | 1.08 |
| excited | 12 | 17.91 | 1.05 |
| happy | 34 | 50.75 | 1.02 |
| satisfied | 27 | 40.3 | 1 |
### love (67 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| excited | 20 | 29.85 | 1.75 |
| surprised | 4 | 5.97 | 1.37 |
| happy | 45 | 67.16 | 1.36 |
| satisfied | 29 | 43.28 | 1.08 |
| calm | 17 | 25.37 | 1.02 |
### school (19 rows)

| Emotion | Positive in Topic | % Topic Rows | Lift |
| --- | --- | --- | --- |
| bored | 3 | 15.79 | 4.75 |
| disgusted | 1 | 5.26 | 3.52 |
| anxious | 4 | 21.05 | 2.48 |
| surprised | 2 | 10.53 | 2.42 |
| proud | 7 | 36.84 | 1.61 |

## Label Quality
- Rows with no emotion labels: 0
- Rows with no topic labels: 2
- Rows with >= 5 emotion labels: 12
- Rows with >= 3 topic labels: 0

## Representative Examples
Examples are truncated to avoid copying large amounts of raw journal text.

### Common Emotions
#### happy
- My family was the most salient part of my day, since most days the care of my 2 children occupies the majority of my time. They are 2 years old and 7 months and I love them, but they also require so much attention that m...
- Yesterday, my family and I played a bunch of board games. My husband won most of them which is not surprising in the least. We played all sorts of games including Life, Clue, Mouse Trap and more. It was relaxing and such...
#### satisfied
- Yesterday, my family and I played a bunch of board games. My husband won most of them which is not surprising in the least. We played all sorts of games including Life, Clue, Mouse Trap and more. It was relaxing and such...
- Yesterday, I got a lot of things ready for listing, and fielded many questions from potential buyers. I also did some surveys on Mturk. Woke up this morning to find that there are quite a few items that now have bids and...
#### calm
- Yoga keeps me focused. I am able to take some time for me and breath and work my body. This is important because it sets up my mood for the whole day.
- Yesterday, my family and I played a bunch of board games. My husband won most of them which is not surprising in the least. We played all sorts of games including Life, Clue, Mouse Trap and more. It was relaxing and such...

### Rare Emotions
#### jealous
- My friend recently told me about a promotion he'd gotten. I was proud and happy for him, but I was also jealousy. I've been working on a promotion myself for a year now, and there's no sign it's coming any time soon.
- Continued with the physiotherapy exercise after being pushed by my daughter. Great to have a daughter who care for me so much.
#### awkward
- I went to my MRI to find out about the spot on my pancreas.  I did not like it because I felt trapped in the machine.  When I got home I had a vertigo attack that I think was caused by being in the MRI for so long.
- I was downtown, and bumped into an old friend of mine at a bus station.  We do not always get along so great, and he was in a bad mood, so we ended up taking a long bus ride together in mostly awkward silence.
#### ashamed
- I have been sleeping a lot lately. When I get home from work, I usually need to take a nap. It can last anywhere from an hour to three hours. It is really frustrating because I am getting enough sleep at night, so I feel...
- I had parent teacher conferences for two of my children. One was excellent and is doing really well and my oldest, is doing well academically but is struggling in the classroom and socially. He receives a lot of help at...

### Multi-Emotion Entries
- Emotions: angry, anxious, bored, frustrated, sad | Topics: work | Text: Yesterday, I had to go to work. It was my first day back to work after my weekend, so I was pretty frustrated and sad. It was a pretty boring day overall.
- Emotions: calm, excited, happy, nostalgic, proud, satisfied | Topics: friends | Text: We had friends surprise us with a visit. We haven't seen them over 2 years. We were all so excited! They are from Hawaii and it is snowing here so we got to play in the snow with them and build a snowman!
- Emotions: excited, happy, proud, satisfied | Topics: family | Text: Upon picking up my only child from school, she gave me the amazing news, she was chosen to be in Honors quiet. Dad and I are so happy and proud of her. We dont know how we are going to squeeze in Choir rehearsals with he...
- Emotions: excited, happy, proud, satisfied | Topics: exercise | Text: Today, I exercised and it honestly felt amazing.  The feeling after a good workout is hard to beat.
- Emotions: calm, excited, happy, proud, satisfied, surprised | Topics: food | Text: My wife has 4th stage cancer and is going through chemo every 3 weeks.  In the 2nd week after the last chemo treatment she is her normal self and able  to cook.  So yesterday for dinner we had a good cooked meal that was...

## ML Formulation Notes
- The dataset is naturally multi-label because entries can have more than one emotion label.
- A first version can use all 18 emotion labels, but rare labels need careful per-label monitoring and may have unstable F1 scores.
- Topic labels are useful for EDA and future modeling, but emotion prediction should be the first supervised task to keep scope clear.
- Use a multilabel-aware split when possible. Iterative stratification is preferable to ordinary random splitting because it preserves rare label and label-combination frequencies better.
- Simple exact-match accuracy will be misleading because partially correct multi-label predictions can still count as entirely wrong, and negative labels dominate.

## Recommended Baseline
- Start with TF-IDF word n-grams plus One-vs-Rest Logistic Regression.
- Preprocess by lowercasing, normalizing whitespace, preserving negations, and using TF-IDF with unigrams/bigrams.
- Tune max_features, ngram_range, min_df, class_weight, regularization C, and decision thresholds.
- Establish micro F1, macro F1, weighted F1, Hamming loss, and per-label precision/recall/F1 before testing more complex models.

## Future Experimentation Plan
1. EDA and label-quality review.
2. TF-IDF + One-vs-Rest Logistic Regression baseline.
3. Linear SVM comparison.
4. Error analysis and per-label threshold tuning.
5. Optional transformer experiment if the baseline leaves clear headroom.
6. Select final model using held-out multilabel metrics.
7. Integrate inference into MoodMirror only after the ML pipeline is validated.
