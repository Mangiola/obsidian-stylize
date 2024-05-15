# Obsidian Stylize Plugin

Some assorted features that are useful for using CSS in your vault.

- **Folder CSS**
    - Pages receive CSS classes that match the names of the folder(s) they're in, if any
- **Tag CSS**
    - Pages receive CSS classes that match their tags, if any
    - Paragraphs with a tag receive a CSS class that matches the tag name
- **Vector Image CSS**
    - Embedded SVG images can now be styled with CSS

This allows you dynamically style pages without requiring you to manually add a `cssclass` property to every page. See the list of use cases on the [wiki](https://github.com/Mangiola/obsidian-stylize/wiki/Example-Plugin-Usage).

![Plugin example animation](assets/BasicExample.gif)

## Development Setup

```
npm i
npm run dev
```