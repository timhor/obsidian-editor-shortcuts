import { EditorSelectionOrCaret } from 'obsidian';

export type CustomSelectionHandler = (
  selections: EditorSelectionOrCaret[],
) => EditorSelectionOrCaret[];

// For multiple cursors on the same line, the new cursors should be on
// consecutive following lines
export const insertLineBelowHandler: CustomSelectionHandler = (selections) => {
  const seenLines: number[] = [];
  let lineIncrement = 0;
  let processedPos: EditorSelectionOrCaret;

  return selections.reduce((processed, currentPos) => {
    const currentLine = currentPos.anchor.line;
    if (!seenLines.includes(currentLine)) {
      seenLines.push(currentLine);
      lineIncrement = 0;
      processedPos = currentPos;
    } else {
      lineIncrement++;
      processedPos = {
        anchor: {
          line: currentLine + lineIncrement,
          ch: currentPos.anchor.ch,
        },
      };
    }
    processed.push(processedPos);
    return processed;
  }, []);
};
