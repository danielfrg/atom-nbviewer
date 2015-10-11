url = require 'url'
{CompositeDisposable} = require 'atom'

NbviewerView = require './nbviewer-view'

module.exports =
  config:
    jupyterConvertBin:
      type: 'string'
      default: 'jupyter-nbconvert'
      description: 'Command or path to jupyter-convert executable'

  nbviewerView: null
  subscriptions: null

  activate: (state) ->
    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable
    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'nbviewer:toggle': => @toggle()

    # @subscriptions.add atom.commands.add '.tree-view .file .name[data-name$=\\.ipynb]', 'nbviewer:preview-file': => @previewFile
    previewFile = @previewFile.bind(this)
    atom.commands.add '.tree-view .file .name[data-name$=\\.ipynb]', 'nbviewer:preview-file', previewFile

    atom.workspace.addOpener (uriToOpen) ->
      try
        {protocol, host, pathname} = url.parse(uriToOpen)
      catch error
        console.log error
        return

      return unless protocol is 'nbviewer-preview:'

      try
        pathname = decodeURI(pathname) if pathname
      catch error
        console.log error
        return

      if host is 'editor'
        new NbviewerView(editorId: pathname.substring(1))
      else
        new NbviewerView(filePath: pathname)

  previewFile: ({target}) ->
    filePath = target.dataset.path
    return unless filePath

    for editor in atom.workspace.getTextEditors() when editor.getPath() is filePath
      @addPreviewForEditor(editor)
      return

    atom.workspace.open "nbviewer-preview://#{encodeURI(filePath)}", searchAllPanes: true

  toggle: ->
    editor = atom.workspace.getActiveTextEditor()
    return unless editor?
    @addPreviewForEditor(editor) unless @removePreviewForEditor(editor)

  uriForEditor: (editor) ->
    "nbviewer-preview://editor/#{editor.id}"

  addPreviewForEditor: (editor) ->
    uri = @uriForEditor(editor)
    previousActivePane = atom.workspace.getActivePane()
    options =
      searchAllPanes: true,
      split: 'right'

    atom.workspace.open(uri, options).then (nbviewerView) ->
      if nbviewerView instanceof NbviewerView
        nbviewerView.renderHTML()
        # previousActivePane.activate()

  removePreviewForEditor: (editor) ->
    uri = @uriForEditor(editor)
    previewPane = atom.workspace.paneForURI(uri)
    if previewPane?
      previewPane.destroyItem(previewPane.itemForURI(uri))
      true
    else
      false
