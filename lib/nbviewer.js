'use babel';

import url from 'url'
import MyPackageView from './nbviewer-view';
import { CompositeDisposable } from 'atom';

function isMyPackageView(object) {
  return object instanceof MyPackageView
}

function getConfig(key) {
  return atom.config.get(`nbviewer.${key}`)
}

export default {

  config: require('./config'),

  subscriptions: null,

  activate(state) {
    // This method is called when an invocation-command of the package is called

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    // Create an instance of the CompositeDisposable class so it can register all the commands that
    // can be called from the plugin so other plugins could subscribe to these events.
    this.subscriptions = new CompositeDisposable();

    // Register a new opener for jupyter://
    this.subscriptions.add(
      atom.workspace.addOpener((uriToOpen) => this.onOpenUri(uriToOpen))
    )

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nbviewer:toggle': () => this.toggle()
    }));

    // Register the context menu on the tree view
    atom.commands.add('.tree-view .file .name[data-name$=\\.ipynb]', 'nbviewer:preview-file', this.previewFile);
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  onOpenUri(uriToOpen) {
    var protocol, host, filePath;

    try {
      const urlObjs = url.parse(uriToOpen);

      protocol = urlObjs.protocol;
      host = urlObjs.host;
      filePath = urlObjs.pathname;

      if (protocol !== 'jupyter:') {
        return
      }
      if (filePath) {
        filePath = decodeURI(filePath);
      }

    } catch (error) {
      console.log("NBViewer error: " + error);
      return
    }

    if (host === 'editor') {
      return new MyPackageView({editorId: filePath.substring(1)})
    }

    return new MyPackageView({filePath: filePath})
  },

  toggle() {
    // Destroy if NBViewer is active
    if (isMyPackageView(atom.workspace.getActivePaneItem())) {
      atom.workspace.destroyActivePaneItem()
      return
    }

    const editor = atom.workspace.getActiveTextEditor()
    if (editor == null) { return }

    if (!this.removePreviewForEditor(editor)) {
      return this.addPreviewForEditor(editor)
    }
  },

  previewFile(args) {
    var target = args.target;
    var filePath = target.dataset.path;
    console.log(filePath);
    if (!filePath) {
      return;
    }

    const uri = "jupyter://" + encodeURI(filePath)
    const options = {
      searchAllPanes: true,
      activatePane: true
    }

    atom.workspace.open(uri, options)
  },

  async addPreviewForEditor (editor) {
    const uri = this.uriForEditor(editor)
    const options = {
      searchAllPanes: true,
      activatePane: false
    }

    const MyPackageView = await atom.workspace.open(uri, options)
  },

  removePreviewForEditor (editor) {
    const uri = this.uriForEditor(editor)
    const previewPane = atom.workspace.paneForURI(uri)

    if (previewPane) {
      previewPane.destroyItem(previewPane.itemForURI(uri))
      return true
    }

    return false
  },

  uriForEditor (editor) {
   return `jupyter://editor/${editor.id}`
 },

};
