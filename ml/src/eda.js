import fs from "fs";
import path from "path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const DATA_PATH = path.join(ROOT, "data", "data.csv");
const REPORTS_DIR = path.join(ROOT, "reports");
const JSON_OUT = path.join(REPORTS_DIR, "eda_summary.json");
const MD_OUT = path.join(REPORTS_DIR, "eda_report.md");

const EMOTIONS = [
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
  "surprised"
];

const TOPICS = [
  "exercise",
  "family",
  "food",
  "friends",
  "god",
  "health",
  "love",
  "recreation",
  "school",
  "sleep",
  "work"
];

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...dataRows] = rows;
  return dataRows
    .filter((dataRow) => dataRow.length > 1 || dataRow[0])
    .map((dataRow) =>
      Object.fromEntries(headers.map((header, index) => [header, dataRow[index] ?? ""]))
    );
};

const asBool = (value) => {
  if (value === "TRUE") return true;
  if (value === "FALSE") return false;
  return null;
};

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

const std = (values) => {
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
};

const frequency = (values) => {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return Object.fromEntries([...counts.entries()].sort((a, b) => Number(a[0]) - Number(b[0])));
};

const truncate = (text, length = 220) =>
  text.length > length ? `${text.slice(0, length).trim()}...` : text;

const pairKey = (a, b) => [a, b].sort().join(" + ");

const summarizeLabels = (rows, labels, columnFor) =>
  labels
    .map((label) => {
      const column = columnFor(label);
      const positive = rows.filter((row) => asBool(row[column]) === true).length;
      return {
        label,
        column,
        positive,
        negative: rows.length - positive,
        percentage: Number(((positive / rows.length) * 100).toFixed(2))
      };
    })
    .sort((a, b) => b.positive - a.positive);

const summarizePairs = (rows, labels, columnFor, limit = 20) => {
  const pairCounts = new Map();
  rows.forEach((row) => {
    const active = labels.filter((label) => asBool(row[columnFor(label)]) === true);
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const key = pairKey(active[i], active[j]);
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  });

  return [...pairCounts.entries()]
    .map(([pair, count]) => ({
      pair,
      count,
      percentage: Number(((count / rows.length) * 100).toFixed(2))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

const topicEmotionRelationships = (rows, emotionSummary) => {
  const emotionBaseRates = Object.fromEntries(
    emotionSummary.map((item) => [item.label, item.positive / rows.length])
  );

  return TOPICS.map((topic) => {
    const topicRows = rows.filter((row) => asBool(row[`Answer.t1.${topic}.raw`]) === true);
    const emotions = EMOTIONS.map((emotion) => {
      const positive = topicRows.filter((row) => asBool(row[`Answer.f1.${emotion}.raw`]) === true).length;
      const rate = topicRows.length ? positive / topicRows.length : 0;
      const baseRate = emotionBaseRates[emotion] || 0;
      return {
        emotion,
        positive,
        rate: Number((rate * 100).toFixed(2)),
        lift: baseRate ? Number((rate / baseRate).toFixed(2)) : null
      };
    })
      .filter((item) => item.positive > 0)
      .sort((a, b) => b.lift - a.lift || b.positive - a.positive)
      .slice(0, 5);

    return {
      topic,
      topicCount: topicRows.length,
      strongestEmotionAssociations: emotions
    };
  }).sort((a, b) => b.topicCount - a.topicCount);
};

const bucketize = (values, buckets) =>
  buckets.map(([label, min, max]) => ({
    bucket: label,
    count: values.filter((value) => value >= min && value < max).length
  }));

const renderTable = (headers, rows) => {
  const headerLine = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((value) => String(value).replace(/\|/g, "\\|")).join(" | ")} |`);
  return [headerLine, separator, ...body].join("\n");
};

const main = () => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const rows = parseCsv(raw);
  const columns = Object.keys(rows[0] || {});
  const emotionColumns = EMOTIONS.map((emotion) => `Answer.f1.${emotion}.raw`);
  const topicColumns = TOPICS.map((topic) => `Answer.t1.${topic}.raw`);
  const labelColumns = [...emotionColumns, ...topicColumns];

  const missingByColumn = Object.fromEntries(
    columns.map((column) => [
      column,
      rows.filter((row) => row[column] === undefined || row[column] === null || row[column].trim() === "").length
    ])
  );

  const invalidBooleanValues = Object.fromEntries(
    labelColumns.map((column) => [
      column,
      [...new Set(rows.map((row) => row[column]).filter((value) => value !== "TRUE" && value !== "FALSE"))]
    ]).filter(([, values]) => values.length)
  );

  const exactRows = rows.map((row) => JSON.stringify(row));
  const normalizedTexts = rows.map((row) => row.Answer.trim().replace(/\s+/g, " ").toLowerCase());
  const charLengths = rows.map((row) => row.Answer.trim().length);
  const wordLengths = rows.map((row) => row.Answer.trim().split(/\s+/).filter(Boolean).length);
  const emotionCounts = rows.map(
    (row) => EMOTIONS.filter((emotion) => asBool(row[`Answer.f1.${emotion}.raw`]) === true).length
  );
  const topicCounts = rows.map(
    (row) => TOPICS.filter((topic) => asBool(row[`Answer.t1.${topic}.raw`]) === true).length
  );

  const duplicateRows = exactRows.length - new Set(exactRows).size;
  const duplicateTexts = normalizedTexts.length - new Set(normalizedTexts).size;
  const emptyTextRows = rows.filter((row) => !row.Answer.trim()).length;
  const emotionSummary = summarizeLabels(rows, EMOTIONS, (label) => `Answer.f1.${label}.raw`);
  const topicSummary = summarizeLabels(rows, TOPICS, (label) => `Answer.t1.${label}.raw`);
  const multiEmotionDist = frequency(emotionCounts);
  const topicCountDist = frequency(topicCounts);
  const textStats = {
    characters: {
      min: Math.min(...charLengths),
      max: Math.max(...charLengths),
      mean: Number(mean(charLengths).toFixed(2)),
      median: median(charLengths),
      p90: Number(percentile(charLengths, 0.9).toFixed(2)),
      p95: Number(percentile(charLengths, 0.95).toFixed(2)),
      p99: Number(percentile(charLengths, 0.99).toFixed(2)),
      std: Number(std(charLengths).toFixed(2))
    },
    words: {
      min: Math.min(...wordLengths),
      max: Math.max(...wordLengths),
      mean: Number(mean(wordLengths).toFixed(2)),
      median: median(wordLengths),
      p90: Number(percentile(wordLengths, 0.9).toFixed(2)),
      p95: Number(percentile(wordLengths, 0.95).toFixed(2)),
      p99: Number(percentile(wordLengths, 0.99).toFixed(2)),
      std: Number(std(wordLengths).toFixed(2))
    },
    veryShortUnder50Chars: charLengths.filter((value) => value < 50).length,
    veryShortUnder20Words: wordLengths.filter((value) => value < 20).length,
    unusuallyLongOverP95Chars: charLengths.filter((value) => value > percentile(charLengths, 0.95)).length,
    unusuallyLongOver1000Chars: charLengths.filter((value) => value > 1000).length,
    characterBuckets: bucketize(charLengths, [
      ["0-99", 0, 100],
      ["100-249", 100, 250],
      ["250-499", 250, 500],
      ["500-749", 500, 750],
      ["750-999", 750, 1000],
      ["1000+", 1000, Infinity]
    ]),
    wordBuckets: bucketize(wordLengths, [
      ["0-24", 0, 25],
      ["25-49", 25, 50],
      ["50-99", 50, 100],
      ["100-149", 100, 150],
      ["150-199", 150, 200],
      ["200+", 200, Infinity]
    ])
  };

  const noEmotionRows = rows.filter((_, index) => emotionCounts[index] === 0);
  const noTopicRows = rows.filter((_, index) => topicCounts[index] === 0);
  const manyEmotionThreshold = Math.max(5, Math.ceil(percentile(emotionCounts, 0.95)));
  const manyTopicThreshold = Math.max(3, Math.ceil(percentile(topicCounts, 0.95)));
  const problematicExamples = {
    noEmotionCount: noEmotionRows.length,
    noTopicCount: noTopicRows.length,
    manyEmotionThreshold,
    manyEmotionCount: emotionCounts.filter((count) => count >= manyEmotionThreshold).length,
    manyTopicThreshold,
    manyTopicCount: topicCounts.filter((count) => count >= manyTopicThreshold).length
  };

  const examplesForEmotion = (emotion) =>
    rows
      .filter((row) => asBool(row[`Answer.f1.${emotion}.raw`]) === true)
      .slice(0, 2)
      .map((row) => truncate(row.Answer));

  const commonEmotions = emotionSummary.slice(0, 3).map((item) => item.label);
  const rareEmotions = [...emotionSummary].sort((a, b) => a.positive - b.positive).slice(0, 3).map((item) => item.label);
  const multiEmotionExamples = rows
    .map((row, index) => ({
      emotions: EMOTIONS.filter((emotion) => asBool(row[`Answer.f1.${emotion}.raw`]) === true),
      topics: TOPICS.filter((topic) => asBool(row[`Answer.t1.${topic}.raw`]) === true),
      text: truncate(row.Answer),
      emotionCount: emotionCounts[index]
    }))
    .filter((item) => item.emotionCount >= 4)
    .slice(0, 5);

  const summary = {
    dataset: {
      path: DATA_PATH,
      rows: rows.length,
      columns: columns.length,
      columnNames: columns,
      inferredDataTypes: Object.fromEntries(columns.map((column) => [column, column === "Answer" ? "text/string" : "boolean string TRUE/FALSE"]))
    },
    dataQuality: {
      missingByColumn,
      duplicateRows,
      duplicateJournalTexts: duplicateTexts,
      emptyJournalEntries: emptyTextRows,
      invalidBooleanValues
    },
    textStats,
    emotions: {
      summary: emotionSummary,
      mostCommon: emotionSummary.slice(0, 5),
      rarest: [...emotionSummary].sort((a, b) => a.positive - b.positive).slice(0, 5),
      labelCount: {
        average: Number(mean(emotionCounts).toFixed(2)),
        min: Math.min(...emotionCounts),
        max: Math.max(...emotionCounts),
        distribution: multiEmotionDist
      },
      cooccurrenceTop20: summarizePairs(rows, EMOTIONS, (label) => `Answer.f1.${label}.raw`)
    },
    topics: {
      summary: topicSummary,
      mostCommon: topicSummary.slice(0, 5),
      rarest: [...topicSummary].sort((a, b) => a.positive - b.positive).slice(0, 5),
      labelCount: {
        average: Number(mean(topicCounts).toFixed(2)),
        min: Math.min(...topicCounts),
        max: Math.max(...topicCounts),
        distribution: topicCountDist
      },
      cooccurrenceTop20: summarizePairs(rows, TOPICS, (label) => `Answer.t1.${label}.raw`)
    },
    emotionTopicRelationships: topicEmotionRelationships(rows, emotionSummary),
    labelQuality: problematicExamples,
    examples: {
      commonEmotions: Object.fromEntries(commonEmotions.map((emotion) => [emotion, examplesForEmotion(emotion)])),
      rareEmotions: Object.fromEntries(rareEmotions.map((emotion) => [emotion, examplesForEmotion(emotion)])),
      multiEmotionExamples
    }
  };

  fs.writeFileSync(JSON_OUT, `${JSON.stringify(summary, null, 2)}\n`);

  const md = [
    "# MoodMirror ML EDA Report",
    "",
    "## Dataset Shape",
    `- Rows: ${summary.dataset.rows}`,
    `- Columns: ${summary.dataset.columns}`,
    `- Text column: \`Answer\``,
    `- Emotion label columns: ${EMOTIONS.length}`,
    `- Topic label columns: ${TOPICS.length}`,
    "",
    "## Data Quality",
    `- Duplicate full rows: ${duplicateRows}`,
    `- Duplicate normalized journal texts: ${duplicateTexts}`,
    `- Empty journal entries: ${emptyTextRows}`,
    `- Columns with missing values: ${Object.entries(missingByColumn).filter(([, count]) => count > 0).length}`,
    `- Label columns with invalid boolean values: ${Object.keys(invalidBooleanValues).length}`,
    "",
    "## Text Statistics",
    renderTable(
      ["Metric", "Characters", "Words"],
      [
        ["Min", textStats.characters.min, textStats.words.min],
        ["Max", textStats.characters.max, textStats.words.max],
        ["Mean", textStats.characters.mean, textStats.words.mean],
        ["Median", textStats.characters.median, textStats.words.median],
        ["P90", textStats.characters.p90, textStats.words.p90],
        ["P95", textStats.characters.p95, textStats.words.p95],
        ["P99", textStats.characters.p99, textStats.words.p99],
        ["Std", textStats.characters.std, textStats.words.std]
      ]
    ),
    "",
    `- Very short entries under 50 characters: ${textStats.veryShortUnder50Chars}`,
    `- Very short entries under 20 words: ${textStats.veryShortUnder20Words}`,
    `- Entries over 1000 characters: ${textStats.unusuallyLongOver1000Chars}`,
    "",
    "### Character Length Buckets",
    renderTable(["Bucket", "Count"], textStats.characterBuckets.map((item) => [item.bucket, item.count])),
    "",
    "## Emotion Label Frequency",
    renderTable(
      ["Emotion", "Positive", "Negative", "% Positive"],
      emotionSummary.map((item) => [item.label, item.positive, item.negative, item.percentage])
    ),
    "",
    "## Multi-Label Emotion Characteristics",
    `- Average emotions per journal: ${summary.emotions.labelCount.average}`,
    `- Min emotions per journal: ${summary.emotions.labelCount.min}`,
    `- Max emotions per journal: ${summary.emotions.labelCount.max}`,
    "",
    renderTable(["# Emotions", "Rows"], Object.entries(summary.emotions.labelCount.distribution)),
    "",
    "## Top Emotion Co-Occurrences",
    renderTable(
      ["Pair", "Count", "% Dataset"],
      summary.emotions.cooccurrenceTop20.slice(0, 15).map((item) => [item.pair, item.count, item.percentage])
    ),
    "",
    "## Topic Label Frequency",
    renderTable(
      ["Topic", "Positive", "Negative", "% Positive"],
      topicSummary.map((item) => [item.label, item.positive, item.negative, item.percentage])
    ),
    "",
    "## Multi-Label Topic Characteristics",
    `- Average topics per journal: ${summary.topics.labelCount.average}`,
    `- Min topics per journal: ${summary.topics.labelCount.min}`,
    `- Max topics per journal: ${summary.topics.labelCount.max}`,
    "",
    renderTable(["# Topics", "Rows"], Object.entries(summary.topics.labelCount.distribution)),
    "",
    "## Top Topic Co-Occurrences",
    renderTable(
      ["Pair", "Count", "% Dataset"],
      summary.topics.cooccurrenceTop20.slice(0, 15).map((item) => [item.pair, item.count, item.percentage])
    ),
    "",
    "## Emotion-Topic Relationships",
    "Top associations use lift: emotion rate within topic divided by emotion base rate. Small topic counts should be interpreted carefully.",
    "",
    ...summary.emotionTopicRelationships.map((topic) => [
      `### ${topic.topic} (${topic.topicCount} rows)`,
      renderTable(
        ["Emotion", "Positive in Topic", "% Topic Rows", "Lift"],
        topic.strongestEmotionAssociations.map((item) => [item.emotion, item.positive, item.rate, item.lift])
      )
    ].join("\n\n")),
    "",
    "## Label Quality",
    `- Rows with no emotion labels: ${problematicExamples.noEmotionCount}`,
    `- Rows with no topic labels: ${problematicExamples.noTopicCount}`,
    `- Rows with >= ${manyEmotionThreshold} emotion labels: ${problematicExamples.manyEmotionCount}`,
    `- Rows with >= ${manyTopicThreshold} topic labels: ${problematicExamples.manyTopicCount}`,
    "",
    "## Representative Examples",
    "Examples are truncated to avoid copying large amounts of raw journal text.",
    "",
    "### Common Emotions",
    ...Object.entries(summary.examples.commonEmotions).map(([emotion, examples]) => [
      `#### ${emotion}`,
      ...examples.map((example) => `- ${example}`)
    ].join("\n")),
    "",
    "### Rare Emotions",
    ...Object.entries(summary.examples.rareEmotions).map(([emotion, examples]) => [
      `#### ${emotion}`,
      ...examples.map((example) => `- ${example}`)
    ].join("\n")),
    "",
    "### Multi-Emotion Entries",
    ...summary.examples.multiEmotionExamples.map((example) =>
      `- Emotions: ${example.emotions.join(", ")} | Topics: ${example.topics.join(", ") || "none"} | Text: ${example.text}`
    ),
    "",
    "## ML Formulation Notes",
    "- The dataset is naturally multi-label because entries can have more than one emotion label.",
    "- A first version can use all 18 emotion labels, but rare labels need careful per-label monitoring and may have unstable F1 scores.",
    "- Topic labels are useful for EDA and future modeling, but emotion prediction should be the first supervised task to keep scope clear.",
    "- Use a multilabel-aware split when possible. Iterative stratification is preferable to ordinary random splitting because it preserves rare label and label-combination frequencies better.",
    "- Simple exact-match accuracy will be misleading because partially correct multi-label predictions can still count as entirely wrong, and negative labels dominate.",
    "",
    "## Recommended Baseline",
    "- Start with TF-IDF word n-grams plus One-vs-Rest Logistic Regression.",
    "- Preprocess by lowercasing, normalizing whitespace, preserving negations, and using TF-IDF with unigrams/bigrams.",
    "- Tune max_features, ngram_range, min_df, class_weight, regularization C, and decision thresholds.",
    "- Establish micro F1, macro F1, weighted F1, Hamming loss, and per-label precision/recall/F1 before testing more complex models.",
    "",
    "## Future Experimentation Plan",
    "1. EDA and label-quality review.",
    "2. TF-IDF + One-vs-Rest Logistic Regression baseline.",
    "3. Linear SVM comparison.",
    "4. Error analysis and per-label threshold tuning.",
    "5. Optional transformer experiment if the baseline leaves clear headroom.",
    "6. Select final model using held-out multilabel metrics.",
    "7. Integrate inference into MoodMirror only after the ML pipeline is validated."
  ].join("\n");

  fs.writeFileSync(MD_OUT, `${md}\n`);
  console.log(`Wrote ${JSON_OUT}`);
  console.log(`Wrote ${MD_OUT}`);
};

main();
