'use babel';

import * as child from 'child_process';
import {File} from 'atom'
import { $, $$$, ScrollView } from 'atom-space-pen-views'


function getConfig(key) {
  return atom.config.get(`nbviewer.${key}`)
}


export default class NBViewerView extends ScrollView {

  static content() {
    this.div({
      outlet: 'container',
      class: 'nbviewer native-key-bindings',
      background: 'white',
      tabindex: -1
    }, () => {
      this.div({
        outlet: 'container',
        style: 'position: relative'
      });
    });
  }

  constructor(args) {
    super();
    this.editorId = args.editorId;
    this.filePath = args.filePath;
    console.log(111)
    console.log(this.editorId)
    console.log(this.filePath)

    this.container.html('Converting notebook...');

    if (this.editorId) {
      this.resolveEditor(this.editorId);
    } else if (this.filePath) {
      if (atom.workspace) {
        console.log("a")
        this.subscribeToFilePath(this.filePath)
      } else {
        console.log("b")
        this.disposables.add(atom.packages.onDidActivateInitialPackages(() =>
          this.subscribeToFilePath(this.filePath)
        ))
      }
    }
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {}

  subscribeToFilePath(filePath) {
    this.file = new File(filePath)
    this.renderNotebook()
  }

  resolveEditor(editorId) {
    const resolve = () => {
      this.editor = this.editorForId(editorId)

      if (this.editor) {
        this.renderNotebook()
      } else {
        // The editor this preview was created for has been closed so close
        // this preview since a preview cannot be rendered without an editor
        const paneView = this.parents('.pane').view()
        if (paneView) {
          paneView.destroyItem(this)
        }
      }
    }

    if (atom.workspace) {
      resolve()
    } else {
      this.disposables.add(atom.packages.onDidActivateInitialPackages(resolve))
    }
  }

  editorForId(editorId) {
    for (let editor of atom.workspace.getTextEditors()) {
      if (editor.id !== undefined && editor.id.toString() === editorId.toString()) {
        return editor
      }
    }
    return null
  }

  renderNotebook() {
    self = this
    console.log("NBViewer: Source Path: " + this.getPath());

    var nbconvert_bin = getConfig('jupyterNBConvertBin');
    var cmd = nbconvert_bin + " \"" + this.getPath() + "\" --to html --output \"/tmp/" + this.getNBOutputPath() + "\"";
    console.log("NBViewer: CMD: " + cmd);

    var child_ps = child.exec(cmd, {
        cwd: "/tmp"
      },
      function(error, stdout, stderr) {
        if (error !== null) {
          console.log(error)
          self.container.html('Conversion failed with error:<br>' + error);
        }
      });

    child_ps.on('exit', function(status_code, signal) {
      if (status_code === 0) {
        var iframe = document.createElement("iframe");
        iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
        iframe.setAttribute("style", "width: 100%; height: 100%;");
        iframe.src = 'file:///tmp/' + self.getNBOutputPath();
        self.container.html($(iframe));
      }
    });
  }

  getTitle() {
    var title = 'NBViewer'
    if (this.file) {
      title = path.basename(this.getPath())
    } else if (this.editor) {
      title = this.editor.getTitle()
    }

    return `${title} Preview`
  }

  getURI() {
    if (this.file) {
      return `jupyter://${this.getPath()}`
    }
    return `jupyter://editor/${this.editorId}`
  }

  getPath() {
    if (this.file) {
      return this.filePath;
    } else if (this.editor) {
      return this.editor.getPath()
    }
  }

  getNBOutputPath() {
    var baseName = path.parse(this.getPath()).name
    return baseName + ".html"
  }
}
