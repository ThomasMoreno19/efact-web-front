export interface BarcodeImageRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function estimateBarcodeRegion(image: ImageData): BarcodeImageRegion | null {
  const horizontalBars = estimateHorizontalBarcodeRegion(image);
  if (horizontalBars) return horizontalBars;

  const rotatedBars = estimateHorizontalBarcodeRegion(transposeImageData(image));
  if (!rotatedBars) return null;
  return {
    left: rotatedBars.top,
    top: rotatedBars.left,
    width: rotatedBars.height,
    height: rotatedBars.width,
  };
}

function estimateHorizontalBarcodeRegion(image: ImageData): BarcodeImageRegion | null {
  const { width, height, data } = image;
  if (width < 40 || height < 8) return null;

  const luminance = new Uint8Array(width * height);
  for (let pixel = 0, offset = 0; pixel < luminance.length; pixel += 1, offset += 4) {
    luminance[pixel] =
      (data[offset] * 77 + data[offset + 1] * 150 + data[offset + 2] * 29) >> 8;
  }

  const rowTransitions = new Uint16Array(height);
  const edgeThreshold = 20;
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width;
    for (let x = 1; x < width; x += 1) {
      if (Math.abs(luminance[rowOffset + x] - luminance[rowOffset + x - 1]) >= edgeThreshold) {
        rowTransitions[y] += 1;
      }
    }
  }

  const rowScores = new Float32Array(height);
  for (let y = 1; y < height - 1; y += 1) {
    rowScores[y] = (rowTransitions[y - 1] + rowTransitions[y] + rowTransitions[y + 1]) / 3;
  }

  const minimumTransitions = Math.max(8, Math.round(width * 0.015));
  const minimumActiveRows = Math.max(4, Math.round(height * 0.045));
  const bestRunState: {
    value: { start: number; end: number; activeRows: number; score: number } | null;
  } = { value: null };
  let runStart = -1;
  let lastActiveRow = -1;
  let activeRows = 0;
  let runScore = 0;

  function finishRun() {
    if (runStart >= 0 && activeRows >= minimumActiveRows) {
      const score = runScore * Math.sqrt(activeRows);
      if (!bestRunState.value || score > bestRunState.value.score) {
        bestRunState.value = { start: runStart, end: lastActiveRow, activeRows, score };
      }
    }
    runStart = -1;
    lastActiveRow = -1;
    activeRows = 0;
    runScore = 0;
  }

  for (let y = 1; y < height - 1; y += 1) {
    if (rowScores[y] >= minimumTransitions) {
      if (runStart < 0) runStart = y;
      lastActiveRow = y;
      activeRows += 1;
      runScore += rowScores[y];
    } else if (runStart >= 0 && y - lastActiveRow > 2) {
      finishRun();
    }
  }
  finishRun();
  const bestRun = bestRunState.value;
  if (!bestRun) return null;

  const columnTransitions = new Uint16Array(width);
  for (let y = bestRun.start; y <= bestRun.end; y += 1) {
    if (rowScores[y] < minimumTransitions) continue;
    const rowOffset = y * width;
    for (let x = 1; x < width; x += 1) {
      if (Math.abs(luminance[rowOffset + x] - luminance[rowOffset + x - 1]) >= edgeThreshold) {
        columnTransitions[x] += 1;
      }
    }
  }

  const minimumColumnTransitions = Math.max(2, Math.round(bestRun.activeRows * 0.08));
  const maximumColumnGap = Math.max(3, Math.round(width * 0.04));
  const bestColumnsState: { value: { start: number; end: number; score: number } | null } = {
    value: null,
  };
  let columnStart = -1;
  let lastActiveColumn = -1;
  let columnScore = 0;

  function finishColumns() {
    if (columnStart >= 0) {
      const score = columnScore * (lastActiveColumn - columnStart + 1);
      if (!bestColumnsState.value || score > bestColumnsState.value.score) {
        bestColumnsState.value = { start: columnStart, end: lastActiveColumn, score };
      }
    }
    columnStart = -1;
    lastActiveColumn = -1;
    columnScore = 0;
  }

  for (let x = 1; x < width; x += 1) {
    if (columnTransitions[x] >= minimumColumnTransitions) {
      if (columnStart < 0) columnStart = x;
      lastActiveColumn = x;
      columnScore += columnTransitions[x];
    } else if (columnStart >= 0 && x - lastActiveColumn > maximumColumnGap) {
      finishColumns();
    }
  }
  finishColumns();
  const bestColumns = bestColumnsState.value;
  if (!bestColumns) return null;

  const candidateWidth = bestColumns.end - bestColumns.start + 1;
  if (candidateWidth < Math.max(24, width * 0.08)) return null;

  const horizontalPadding = Math.max(4, Math.round(candidateWidth * 0.06));
  const verticalPadding = Math.max(2, Math.round((bestRun.end - bestRun.start + 1) * 0.05));
  const left = Math.max(0, bestColumns.start - horizontalPadding);
  const top = Math.max(0, bestRun.start - verticalPadding);
  const right = Math.min(width, bestColumns.end + 1 + horizontalPadding);
  const bottom = Math.min(height, bestRun.end + 1 + verticalPadding);

  return { left, top, width: right - left, height: bottom - top };
}

function transposeImageData(image: ImageData) {
  const { width, height, data } = image;
  const transposedData = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceOffset = (y * width + x) * 4;
      const targetOffset = (x * height + y) * 4;
      transposedData[targetOffset] = data[sourceOffset];
      transposedData[targetOffset + 1] = data[sourceOffset + 1];
      transposedData[targetOffset + 2] = data[sourceOffset + 2];
      transposedData[targetOffset + 3] = data[sourceOffset + 3];
    }
  }
  return new ImageData(transposedData, height, width);
}
