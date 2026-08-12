export const BINGO_LINE_COMBINATIONS: number[][] = [
  // 5 Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],

  // 5 Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],

  // 2 Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export interface EvaluationResult {
  completedLinesCount: number;
  completedLines: number[][]; // Array of 5-index arrays
  hasWon: boolean; // >= 5 lines completed
}

export class BingoEvaluator {
  /**
   * Evaluates a player's 5x5 private board against called numbers.
   * @param board 25-number array representing the board layout
   * @param calledNumbers array of numbers called in the game so far
   */
  public static evaluate(board: number[], calledNumbers: number[]): EvaluationResult {
    if (!board || board.length !== 25) {
      return { completedLinesCount: 0, completedLines: [], hasWon: false };
    }

    const calledSet = new Set(calledNumbers);
    
    // Map board position -> isMarked boolean
    const markedMap = board.map((num) => calledSet.has(num));

    const completedLines: number[][] = [];

    for (const combo of BINGO_LINE_COMBINATIONS) {
      const isLineComplete = combo.every((index) => markedMap[index]);
      if (isLineComplete) {
        completedLines.push(combo);
      }
    }

    const completedLinesCount = completedLines.length;

    return {
      completedLinesCount,
      completedLines,
      hasWon: completedLinesCount >= 5,
    };
  }
}
