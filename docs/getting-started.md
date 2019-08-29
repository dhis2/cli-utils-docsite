# Getting Started

`d2-utils-docsite` allows you to generate and serve standardized DHIS2 developer documentation.

## Installation

Install the tool as a dev dependency:

```sh
> yarn add --dev @dhis2/cli-utils-docsite
```

## Usage

Then add build and serve scripts to your `package.json`:

```json
{
    "name": "my-sample-library",
    "version": "1.0.0",
    "description": "A simple sample library",
    "repository": "https://github.com/me/sample-library",
    "devDependencies": {
        "@dhis2/cli-utils-docsite": "latest"
    },
    "scripts": {
        "build": "d2-utils-docsite build ./docs -o ./dest",
        "start": "d2-utils-docsite serve ./docs -o ./dest"
    }
}
```

Optionally, you can then [configure](config) the generator's [template variables](variables)
