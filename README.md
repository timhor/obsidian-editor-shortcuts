# Code Editor Shortcuts

This [Obsidian](https://obsidian.md) plugin adds keyboard shortcuts (hotkeys) commonly found in code editors such as Visual Studio Code or Sublime Text.

| Command                                          | Shortcut \*                |
| ------------------------------------------------ | -------------------------- |
| Insert line below                                | `Ctrl` + `Enter` \*\*      |
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
| Delete to end of line                            | Not set                    |
| Transform selection to uppercase                 | Not set                    |
| Transform selection to lowercase                 | Not set                    |
| Transform selection to title case                | Not set                    |
| Expand selection to brackets                     | Not set                    |
| Expand selection to quotes                       | Not set                    |
| Expand selection to quotes or brackets           | Not set                    |
| Go to next heading                               | Not set                    |
| Go to previous heading                           | Not set                    |

\* On macOS, replace `Ctrl` with `Cmd` and `Alt` with `Opt`

\*\* This may conflict with the default shortcut for _Toggle checklist status_; changing/removing one of the bindings is recommended

_Note:_ If you are looking for the `Alt` + `Up` and `Alt` + `Down` shortcuts from VS Code, you can assign those hotkeys to Obsidian's built in actions "Move line up" and "Move line down".

### Multiple Cursors

These shortcuts also work with [multiple cursors](https://help.obsidian.md/How+to/Working+with+multiple+cursors), with the exception of:

- Expand selection to quotes or brackets
- Go to next/previous heading

However, if you're using Live Preview, undo and redo will not work intuitively – actions will be handled individually for each cursor, rather than grouped together. If this becomes an issue for you, you can switch back to the legacy editor in Settings as a workaround.

## Installing the plugin

Refer to the official installation instructions for third-party plugins [here](https://help.obsidian.md/Advanced+topics/Community+plugins).

## Configuring settings

Go to Settings → Hotkeys to customise the keyboard shortcut for each action.

## Contributing

Contributions and suggestions are welcome – feel free to open an issue or raise a pull request.

To get started:

- Switch to the specified Node version: `nvm use`
- Install dependencies: `yarn install`
- Run the extension: `yarn start`
- Run tests: `yarn test` (use `--watch` for watch mode)

## Support

This plugin is completely free to use, but if you'd like to say thanks, consider buying me a coffee! 😄

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/C0C59A43G)
