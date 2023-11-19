# Code Editor Shortcuts

> [!NOTE]
> Due to personal circumstances, active development is **paused** on this project until approximately mid-2024. Please continue to use the existing features, submit issues and contribute pull requests, but expect a delayed response.
>
> Feature requests won't be individually acknowledged but will still be tracked on the [project board](https://github.com/timhor/obsidian-editor-shortcuts/projects/1) as before.

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
| Move cursor up                                   | Not set                    |
| Move cursor down                                 | Not set                    |
| Move cursor left                                 | Not set                    |
| Move cursor right                                | Not set                    |
| Go to previous word                              | Not set                    |
| Go to next word                                  | Not set                    |
| Go to start of line                              | Not set                    |
| Go to end of line                                | Not set                    |
| Go to previous line                              | Not set                    |
| Go to next line                                  | Not set                    |
| Go to first line                                 | Not set                    |
| Go to last line                                  | Not set                    |
| Go to line number                                | Not set                    |
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
| Undo                                             | Not set                    |
| Redo                                             | Not set                    |

\* On macOS, replace `Ctrl` with `Cmd` and `Alt` with `Opt`

### Important notes

- `Ctrl` + `Enter` for 'Insert line below' may conflict with the default shortcut for _Open link under cursor in new tab_; changing/removing one of the bindings is recommended.
- `Ctrl` + `L` for 'Select line' may conflict with the default shortcut for _Toggle checkbox status_; changing/removing one of the bindings is recommended.
- `Ctrl` + `D` for 'Select word or next occurrence of selection' will behave differently depending on how the initial selection was made. If it was also done via `Ctrl` + `D`, the command will only look for the entire word in subsequent matches. However, if the selection was done by hand, it will search within words as well.
- 'Toggle case of selection' will cycle between uppercase, lowercase and title case.
- If you are looking for the `Alt` + `Up` and `Alt` + `Down` shortcuts from VS Code, you can assign those hotkeys to Obsidian's built in actions "Move line up" and "Move line down".

### Multiple Cursors

Most\* of these shortcuts work with [multiple cursors](https://help.obsidian.md/Editing+and+formatting/Multiple+cursors). However, undo and redo will not work intuitively in Live Preview – actions will be handled individually for each cursor, rather than grouped together. Work is underway to incrementally migrate them to the newer Obsidian editor API so they are grouped, and has been completed for the following:

- Insert line above
- Insert line below
- Delete line

As a workaround, you can also switch back to the legacy editor in Settings as all actions will be grouped in that case.

\* These shortcuts currently do not support multiple cursors:

- Expand selection to quotes or brackets
- Go to next/previous heading

## Installing the plugin

Refer to the official installation instructions for third-party plugins [here](https://help.obsidian.md/Extending+Obsidian/Community+plugins) and search for the plugin `Code Editor Shortcuts`.

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
