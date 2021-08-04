# Template Variables

The following template variables are used to automatically generate the
documentation site. They can be [configured](config) in several
different ways, including in `package.json` and on the command line.

| Name            | Type     | Default           | Description                                                             |
| --------------- | -------- | ----------------- | ----------------------------------------------------------------------- |
| **name**        | _string_ | `pkg.name`        | The name of the package or library, displayed in the docsite sidebar    |
| **title**       | _string_ | `name`            | The HTML title text                                                     |
| **description** | _string_ | `pkg.description` | A description of the package or library, for HTML meta and landing page |
| **repo**        | _string_ | `pkg.repository`  | The base URL of the GitHub repository, for links and badges             |
