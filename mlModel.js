const LABELS = ["Low", "Moderate", "High"];

const FEATURE_CONFIG = [
  { key: "screenTimeHours", label: "screen time", scale: 10, direction: 1 },
  { key: "focusHours", label: "focus time", scale: 8, direction: -1 },
  { key: "sleepHours", label: "sleep", scale: 10, direction: -1 },
  { key: "unlocks", label: "pickups", scale: 100, direction: 1 },
  { key: "scrollingHours", label: "scrolling", scale: 6, direction: 1 },
  { key: "hydration", label: "hydration", scale: 100, direction: -1 },
  { key: "heartRate", label: "heart rate", scale: 120, direction: 1 },
  { key: "wellbeingScore", label: "wellbeing score", scale: 100, direction: -1 },
];

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function dot(weights, features) {
  return weights.reduce((sum, weight, index) => sum + weight * features[index], 0);
}

function normalizeProbabilities(probabilities) {
  const total = Object.values(probabilities).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(Object.entries(probabilities).map(([label, value]) => [label, value / total]));
}

export function getRiskFeatureVector(user) {
  return FEATURE_CONFIG.map(({ key, scale, direction }) => ((Number(user[key]) || 0) / scale) * direction);
}

function fallbackModel() {
  return {
    method: "fallback",
    trainedOn: 0,
    labels: LABELS,
    featureConfig: FEATURE_CONFIG,
    weightsByLabel: {
      Low: [-2.4, -1.2, -1.5, -0.7, -0.8, -0.6, -0.4, 2.4, 0.9],
      Moderate: [-0.4, -0.2, -0.2, 0.1, 0.1, -0.1, 0.2, 0.3, 0.5],
      High: [2.2, 1.1, 1.4, 0.8, 0.9, 0.7, 0.6, -2.1, -1.1],
    },
  };
}

export function trainRiskModel(users = []) {
  const trainingUsers = users.filter((user) => user?.riskLevel && LABELS.includes(user.riskLevel));
  const distinctLabels = new Set(trainingUsers.map((user) => user.riskLevel));

  if (trainingUsers.length < 3 || distinctLabels.size < 2) {
    return fallbackModel();
  }

  const weightsByLabel = Object.fromEntries(
    LABELS.map((label) => [label, new Array(FEATURE_CONFIG.length + 1).fill(0)]),
  );

  const learningRate = 0.24;
  const regularization = 0.002;
  const epochs = 220;

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    for (const user of trainingUsers) {
      const features = [1, ...getRiskFeatureVector(user)];
      for (const label of LABELS) {
        const target = user.riskLevel === label ? 1 : 0;
        const weights = weightsByLabel[label];
        const prediction = sigmoid(dot(weights, features));
        const error = prediction - target;

        for (let index = 0; index < weights.length; index += 1) {
          const penalty = index === 0 ? 0 : regularization * weights[index];
          weights[index] -= learningRate * ((error * features[index]) + penalty);
        }
      }
    }
  }

  return {
    method: "logistic-ovr",
    trainedOn: trainingUsers.length,
    labels: LABELS,
    featureConfig: FEATURE_CONFIG,
    weightsByLabel: Object.fromEntries(
      Object.entries(weightsByLabel).map(([label, weights]) => [label, weights.map((value) => Number(value.toFixed(4)))]),
    ),
  };
}

export function predictRiskWithModel(user, model) {
  const activeModel = model || fallbackModel();
  const featureVector = getRiskFeatureVector(user);
  const features = [1, ...featureVector];
  const rawScores = Object.fromEntries(
    activeModel.labels.map((label) => [label, sigmoid(dot(activeModel.weightsByLabel[label], features))]),
  );
  const probabilities = normalizeProbabilities(rawScores);
  const ranking = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const [predictedLabel, predictedScore] = ranking[0];
  const runnerUpScore = ranking[1]?.[1] ?? 0;

  const contributionWeights = activeModel.weightsByLabel[predictedLabel].slice(1);
  const drivers = activeModel.featureConfig
    .map((feature, index) => ({
      key: feature.key,
      label: feature.label,
      contribution: contributionWeights[index] * featureVector[index],
      direction: contributionWeights[index] >= 0 ? "raises" : "reduces",
    }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3)
    .map((item) => ({
      ...item,
      impact: Math.round(Math.abs(item.contribution) * 100) / 100,
    }));

  return {
    method: activeModel.method,
    trainedOn: activeModel.trainedOn,
    predictedLabel,
    confidence: Math.round(predictedScore * 100),
    margin: Math.round((predictedScore - runnerUpScore) * 100),
    probabilities: Object.fromEntries(
      LABELS.map((label) => [label, Math.round((probabilities[label] || 0) * 100)]),
    ),
    drivers,
  };
}
