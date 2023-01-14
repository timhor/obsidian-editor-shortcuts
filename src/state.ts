type CodeEditorShortcutsState = {
  autoInsertListPrefix: boolean;
};

/**
 * Simple state object used to hold information from saved settings (accessible
 * anywhere it's imported without needing to thread it down to dependent
 * functions as an argument)
 */
export const SettingsState: CodeEditorShortcutsState = {
  autoInsertListPrefix: true,
};
