# Markdown in a right panel — an Agents Hub plugin

A click on a link to an `.md` file in a session's conversation opens the file in a panel to the right of the feed, not
in a new tab: you read a session's report or plan without leaving the conversation and without losing your place in
the feed.

- Inside is the hub's "Files" in an embedded window: rendered view and source, editing, comments on a selected passage
  (the session answers), Finder and VS Code.
- The panel is the hub's own panel to the right of the session: the same rounded window as the chat; drag its edge to
  change the width.
- Close it with ✕ or Esc. ⌘/Ctrl-click works as without the plugin, in a new tab. ↗ opens the file in "Files" separately.
- On a phone the file opens over the feed.

It catches links to `.md` files in "Files" (`/open?path=…`, `/#/<root>/<path>.md`) and `file:///…/*.md` while a session
is open.

The UI text is in English by default and in Russian for a hub whose language is Russian (`hub.lang`).

Place — `session.aside`, needs Plugin API 1.14 (`ctx.open()`); the embedded window without the folder list is "Files"
with `embed=1`.

## Install

"Settings" → "Plugins" → find "md-panel" or paste the link to this repo → "Check and install".
