# atom-nbviewer

View the rendered Jupyter/IPython Notebook in atom

## Installation

```bash
$ apm install nbviewer
```

**Requirements:**

- You need the `jupyter-nbconvert` executable, for example using [anaconda](https://www.continuum.io/downloads)

## Configuration

- **jupyterConvertBin**: Command or path to `jupyter-nbconvert` executable

Example:

```
"*":
  "nbviewer":
    "jupyterConvertBin": "/Users/danielfrg/anaconda/bin/jupyter-nbconvert"

```
