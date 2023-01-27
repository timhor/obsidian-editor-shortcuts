# Code Editor Shortcuts

This [Obsidian](https://obsidian.md) plugin adds keyboard shortcuts (hotkeys) commonly found in code editors such as Visual Studio Code or Sublime Text.

| Command                                          | Shortcut \*                |
| ------------------------------------------------ | -------------------------- |
| Insert line below                                | `Ctrl` + `Enter`           |
| Insert line above                                | `Ctrl` + `Shift` + `Enter` |
| Delete line                                      | `Ctrl` + `Shift` + `K`     |
| Duplicate line                                   | `Ctrl` + `Shift` + `D`     |
| Copy line up                                     | `Alt` + `Shift` + `Up`     |
| Copy line down                                   | `Alt` + `Shift` + `Down`   |
| Join line below to current line                  | `Ctrl` + `J`               |
| Select line (repeat to keep expanding selection) | `Ctrl` + `L`               |
| Add cursors to selection ends                    | `Alt` + `Shift` + `I`      |
| Select word or next occurrence of selection      | `Ctrl` + `D`               |
| Select all occurrences of selection              | `Ctrl` + `Shift` + `L`     |
| Move cursor left                                 | Not set                    |
| Move cursor right                                | Not set                    |
| Go to start of line                              | Not set                    |
| Go to end of line                                | Not set                    |
| Go to previous line                              | Not set                    |
| Go to next line                                  | Not set                    |
| Go to first line                                 | Not set                    |
| Go to last line                                  | Not set                    |
| Delete to start of line                          | Not set                    |
| Delete to end of line                            | Not set                    |
| Transform selection to uppercase                 | Not set                    |
| Transform selection to lowercase                 | Not set                    |
| Transform selection to title case                | Not set                    |
| Toggle case of selection                         | Not set                    |
| Expand selection to brackets                     | Not set                    |
| Expand selection to quotes                       | Not set                    |
| Expand selection to quotes or brackets           | Not set                    |
| Insert cursor above                              | Not set                    |
| Insert cursor below                              | Not set                    |
| Go to next heading                               | Not set                    |
| Go to previous heading                           | Not set                    |
| Toggle line numbers                              | Not set                    |
| Indent using tabs                                | Not set                    |
| Indent using spaces                              | Not set                    |

\* On macOS, replace `Ctrl` with `Cmd` and `Alt` with `Opt`

### Important notes

- `Ctrl` + `Enter` for 'Insert line below' may conflict with the default shortcut for _Open link under cursor in new tab_; changing/removing one of the bindings is recommended.
- `Ctrl` + `L` for 'Select line' may conflict with the default shortcut for _Toggle checkbox status_; changing/removing one of the bindings is recommended.
- `Ctrl` + `D` for 'Select word or next occurrence of selection' will behave differently depending on how the initial selection was made. If it was also done via `Ctrl` + `D`, the command will only look for the entire word in subsequent matches. However, if the selection was done by hand, it will search within words as well.
- 'Toggle case of selection' will cycle between uppercase, lowercase and title case
- If you are looking for the `Alt` + `Up` and `Alt` + `Down` shortcuts from VS Code, you can assign those hotkeys to Obsidian's built in actions "Move line up" and "Move line down".

### Multiple Cursors

These shortcuts also work with [multiple cursors](https://help.obsidian.md/How+to/Working+with+multiple+cursors), with the exception of:

- Expand selection to quotes or brackets
- Go to next/previous heading

However, if you're using Live Preview, undo and redo will not work intuitively – actions will be handled individually for each cursor, rather than grouped together. If this becomes an issue for you, you can switch back to the legacy editor in Settings as a workaround as actions will be grouped in that case.

## Installing the plugin

Refer to the official installation instructions for third-party plugins [here](https://help.obsidian.md/Extending+Obsidian/Community+plugins).

## Configuring settings

Go to Settings → Hotkeys to customise the keyboard shortcut for each action.

The following behaviour can be configured via the settings tab for this plugin:

| Setting                 | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| Auto insert list prefix | Automatically insert list prefix when inserting a line above or below |

## Contributing

Contributions and suggestions are welcome – feel free to open an issue or raise a pull request.

To get started:

- Switch to the specified Node version: `nvm use`
- Install dependencies: `yarn install`
- Run the extension: `yarn start`
- Run tests: `yarn test` (use `--watch` for watch mode)

## Support

This plugin is completely free to use, but if you'd like to say thanks, consider buying me a coffee! 😄

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/timhor)
