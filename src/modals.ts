import { App, SuggestModal } from 'obsidian';

export class GoToLineModal extends SuggestModal<string> {
  private lineCount;
  private onSubmit;

  constructor(
    app: App,
    lineCount: number,
    onSubmit: (lineNumber: number) => void,
  ) {
    super(app);
    this.lineCount = lineCount;
    this.onSubmit = onSubmit;

    const PROMPT_TEXT = `Enter a line number between 1 and ${lineCount}`;
    this.limit = 1;
    this.setPlaceholder(PROMPT_TEXT);
    this.emptyStateText = PROMPT_TEXT;
  }

  getSuggestions(line: string): string[] {
    const lineNumber = parseInt(line);
    if (line.length > 0 && lineNumber > 0 && lineNumber <= this.lineCount) {
      return [line];
    }
    return [];
  }

  renderSuggestion(line: string, el: HTMLElement) {
    el.createEl('div', { text: line });
  }

  onChooseSuggestion(line: string) {
    // Subtract 1 as line numbers are zero-indexed
    this.onSubmit(parseInt(line) - 1);
  }
}
