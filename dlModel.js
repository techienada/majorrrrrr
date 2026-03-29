function relu(value) {
  return Math.max(0, value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildWindows(users = [], windowSize = 4) {
  const samples = [];
  users.forEach((user) => {
    const trend = (user.weeklyTrend || []).map((value) => Number(value) / 100);
    if (trend.length <= windowSize) return;
    for (let index = 0; index <= trend.length - windowSize - 1; index += 1) {
      samples.push({
        input: trend.slice(index, index + windowSize),
        target: trend[index + windowSize],
      });
    }
  });
  return samples;
}

function fallbackModel() {
  return {
    method: "fallback-sequence",
    trainedOn: 0,
    windowSize: 4,
    hiddenSize: 6,
    w1: [],
    b1: [],
    w2: [],
    b2: 0,
  };
}

export function trainDeepTrendModel(users = []) {
  const samples = buildWindows(users, 4);
  if (!samples.length) return fallbackModel();

  const inputSize = 4;
  const hiddenSize = 8;
  const learningRate = 0.045;
  const model = {
    method: "dense-neural-net",
    trainedOn: samples.length,
    windowSize: inputSize,
    hiddenSize,
    w1: Array.from({ length: hiddenSize }, (_, row) =>
      Array.from({ length: inputSize }, (_, col) => ((row + 1) * (col + 2)) / 100),
    ),
    b1: new Array(hiddenSize).fill(0),
    w2: Array.from({ length: hiddenSize }, (_, index) => (index + 1) / 100),
    b2: 0,
  };

  for (let epoch = 0; epoch < 320; epoch += 1) {
    samples.forEach(({ input, target }) => {
      const hiddenLinear = model.w1.map((weights, hiddenIndex) =>
        weights.reduce((sum, weight, inputIndex) => sum + (weight * input[inputIndex]), model.b1[hiddenIndex]),
      );
      const hidden = hiddenLinear.map(relu);
      const output = clamp(
        hidden.reduce((sum, value, hiddenIndex) => sum + (value * model.w2[hiddenIndex]), model.b2),
        0,
        1,
      );
      const error = output - target;

      model.w2 = model.w2.map((weight, hiddenIndex) => weight - (learningRate * error * hidden[hiddenIndex]));
      model.b2 -= learningRate * error;

      hidden.forEach((hiddenValue, hiddenIndex) => {
        const grad = hiddenLinear[hiddenIndex] > 0 ? error * model.w2[hiddenIndex] : 0;
        model.w1[hiddenIndex] = model.w1[hiddenIndex].map(
          (weight, inputIndex) => weight - (learningRate * grad * input[inputIndex]),
        );
        model.b1[hiddenIndex] -= learningRate * grad;
      });
    });
  }

  return model;
}

export function predictDeepTrend(user, model) {
  const trend = (user.weeklyTrend || []).map(Number);
  const activeModel = model || fallbackModel();
  if (trend.length < activeModel.windowSize || activeModel.method === "fallback-sequence") {
    const latest = trend[trend.length - 1] || Number(user.wellbeingScore) || 0;
    const previous = trend[trend.length - 2] || latest;
    const delta = latest - previous;
    const predictedScore = clamp(Math.round(latest + delta), 35, 97);
    return {
      method: activeModel.method,
      trainedOn: activeModel.trainedOn,
      predictedScore,
      change: predictedScore - latest,
      direction: predictedScore > latest + 2 ? "Improving" : predictedScore < latest - 2 ? "Worsening" : "Stable",
      confidence: 58,
    };
  }

  const input = trend.slice(-activeModel.windowSize).map((value) => value / 100);
  const hiddenLinear = activeModel.w1.map((weights, hiddenIndex) =>
    weights.reduce((sum, weight, inputIndex) => sum + (weight * input[inputIndex]), activeModel.b1[hiddenIndex]),
  );
  const hidden = hiddenLinear.map(relu);
  const output = clamp(
    hidden.reduce((sum, value, hiddenIndex) => sum + (value * activeModel.w2[hiddenIndex]), activeModel.b2),
    0,
    1,
  );
  const latest = trend[trend.length - 1];
  const predictedScore = clamp(Math.round(output * 100), 35, 97);
  const change = predictedScore - latest;
  const confidence = clamp(
    Math.round(82 - (Math.abs(change) * 2) + Math.min(10, activeModel.trainedOn)),
    52,
    94,
  );

  return {
    method: activeModel.method,
    trainedOn: activeModel.trainedOn,
    predictedScore,
    change,
    direction: change >= 3 ? "Improving" : change <= -3 ? "Worsening" : "Stable",
    confidence,
  };
}
