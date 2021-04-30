function showPreview (mode, color) {
  const preview = new PreviewContent(color)

  switch (mode) {
    case 'previewSelectedText':
      preview.selectedText()
      break
    case 'previewParentNode':
      preview.parentNode()
      break
    case 'previewSimilarNodes':
      preview.similarNodes()
      break
  }
}

function clearPreview () {
  /* global PreviewContent */
  const preview = new PreviewContent()
  preview.clear()
}

function makeColor (mode, startColor, endColor, fontSize) {
  /* global ColorLineReader */
  const reader = new ColorLineReader(startColor, endColor, fontSize)

  switch (mode) {
    case 'colorSelectedText':
      reader.colorSelectedText()
      break
    case 'colorParentNode':
      reader.colorParentNode()
      break
    case 'colorSimilarNodes':
      reader.colorSimilarNodes()
      break
  }
}

function updateStyles (startColor, endColor, fontSize) {
  const reader = new ColorLineReader()
  reader.createColorStyles(startColor, endColor, fontSize)
}

function __onMessages (request, sender, sendResponse) {
  switch (request.action) {
    case 'makeColor':
      makeColor(request.mode, request.startColor, request.endColor, request.fontSize)
      break
    case 'showPreview':
      showPreview(request.mode, request.previewColor)
      break
    case 'clearPreview':
      clearPreview()
      break
    case 'updateStyles':
      updateStyles(request.startColor, request.endColor, request.fontSize)
      break
  }
}
/* global chrome */
chrome.runtime.onMessage.addListener(__onMessages)
