# API Reference

## Commands

The following `d2 utils docsite` commands are available:

-   `build [source] [...options]` - Create a static production build of the documentation site
-   `serve [source] [...options]` - Run a local development server with live-reload enabled.
    -   `--port <port>` - Specify the port to use _(default: **3000**)_
    -   `--open`, `--no-open` - Specify whether or not to automatically open a browser window _(default: **true**)_

## Common options

Both `build` and `serve` support the following common options:

-   `source` - the directory from which to source documentation markdown files _(default: **./docs**)_
-   `--dest`, `-o` - the directory in which to place the compiled output _(default: **./dest**)_
-   `--force` - Forcibly re-download cached files _(default: **false**)_
-   `--changelog`, `--no-changelog` - Don't automatically pull in the `CHANGELOG.md` file _(default: **true**)_
-   `--changelogFile` - Specify the source file to copy to `CHANGELOG.md` _(default: **./CHANGELOG.md**)_
-   `--configFile` - Specify the configuration file to use _(default: **d2.config.js**)_

## Example Usage

```sh
> d2-utils-docsite build ./docs
```
