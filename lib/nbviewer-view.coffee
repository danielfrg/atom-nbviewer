path = require 'path'
exec = require("child_process").exec

{File} = require 'atom'
{$, $$$, ScrollView}  = require 'atom-space-pen-views'


module.exports =
class NbviewerView extends ScrollView
  @content: ->
    @div class: 'nbviewer native-key-bindings', tabindex: -1

  constructor: ({@editorId, @filePath}) ->
    super
    @text('Loading... nbviewer output should replace this text')

    if @editorId?
      @resolveEditor(@editorId)
    else
      if atom.workspace?
        @subscribeToFilePath(@filePath)
      else
        atom.packages.onDidActivatePackage =>
          @subscribeToFilePath(@filePath)

  resolveEditor: (editorId) ->
    resolve = =>
      @editor = @editorForId(editorId)

      if @editor?
        @renderHTML()
      else
        # The editor this preview was created for has been closed so close
        # this preview since a preview cannot be rendered without an editor
        atom.workspace?.paneForItem(this)?.destroyItem(this)

    if atom.workspace?
      resolve()
    else
      atom.packages.onDidActivatePackage =>
        resolve()

  subscribeToFilePath: (filePath) ->
    @file = new File(filePath)
    @renderHTML()

  getURI: ->
    if @file?
      "nbviewer-preview://#{@getPath()}"
    else
      "nbviewer-preview://editor/#{@editorId}"

  getPath: ->
    if @file?
      @file.getPath()
    else
      @editor.getPath()

  getOutputPath: ->
    baseName = path.parse(@getPath()).name
    baseName + '.html'

  editorForId: (editorId) ->
    for editor in atom.workspace.getTextEditors()
      return editor if editor.id?.toString() is editorId.toString()
    null

  getTitle: ->
    if @file?
      "#{path.basename(@getPath())} Preview"
    else if @editor?
      "#{@editor.getTitle()} Preview"
    else
      "Nbviewer Preview"

  renderHTML: ->
    _self = this

    bin = atom.config.get('nbviewer.jupyterConvertBin')
    # bin = atom.config.get('linter.showErrorTabLine')
    cmd = bin + " " + @getPath() + " --to html --output /tmp/" + @getOutputPath()
    child = exec(cmd,
          cwd: "/tmp",
          (error, stdout, stderr) ->
            if error isnt null
              _self.text('Conversion failed:\n' + error)
            return
          )

    child.on('exit', (code, signal) ->
      if code == 0
        iframe = document.createElement("iframe")
        iframe.setAttribute("sandbox", "allow-scripts allow-same-origin")
        iframe.setAttribute("style", "width: 100%; height: 100%;")
        iframe.src = 'file:///tmp/' + _self.getOutputPath()
        _self.html $ iframe
    )
