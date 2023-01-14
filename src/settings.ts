import { PluginSettingTab, App, Setting, ToggleComponent } from 'obsidian';
import CodeEditorShortcuts from './main';

export interface PluginSettings {
  autoInsertListPrefix: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  autoInsertListPrefix: true,
};

export class SettingTab extends PluginSettingTab {
  plugin: CodeEditorShortcuts;

  constructor(app: App, plugin: CodeEditorShortcuts) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Code Editor Shortcuts' });

    const listPrefixSetting = new Setting(containerEl)
      .setName('Auto insert list prefix')
      .setDesc(
        'Automatically insert list prefix when inserting a line above or below',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoInsertListPrefix)
          .onChange(async (value) => {
            this.plugin.settings.autoInsertListPrefix = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl).setName('Reset defaults').addButton((btn) => {
      btn.setButtonText('Reset').onClick(async () => {
        this.plugin.settings = { ...DEFAULT_SETTINGS };
        (listPrefixSetting.components[0] as ToggleComponent).setValue(
          DEFAULT_SETTINGS.autoInsertListPrefix,
        );
        await this.plugin.saveSettings();
      });
    });
  }
}
