/* global chrome */

function sendMessage (data) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, data)
  })
}

function getConfigInputs () {
  const cfg = {}
  const inputs = document.querySelectorAll('input[data-config=true')
  inputs.forEach(inp => {
    cfg[inp.id] = inp.value
  })
  return cfg
}

function setConfigInputs (cfg) {
  const inputs = document.querySelectorAll('input[data-config=true')
  inputs.forEach(inp => {
    if (cfg[inp.id]) { inp.value = cfg[inp.id] }
  })
}

function saveSettings () {
  const cfg = getConfigInputs()
  chrome.storage.sync.set(cfg, () => updateStyles())
}

function loadSettings () {
  const keys = Object.keys(getConfigInputs())
  chrome.storage.sync.get(keys, data => setConfigInputs(data))
}

function showPreview (m) {
  const cfg = getConfigInputs()
  sendMessage({
    action: 'showPreview',
    mode: m,
    ...cfg
  })
}

function clearPreview () {
  sendMessage({ action: 'clearPreview' })
}

function makeColor (mode) {
  const cfg = getConfigInputs()
  sendMessage({
    action: 'makeColor',
    mode: mode,
    ...cfg
  })
}

function updateStyles () {
  const cfg = getConfigInputs()
  sendMessage({
    action: 'updateStyles',
    ...cfg
  })
}

function addEventListeners () {
  document.getElementById('previewSelectedText').addEventListener('mouseenter', showPreview.bind(this, 'previewSelectedText'))
  document.getElementById('previewParentNode').addEventListener('mouseenter', showPreview.bind(this, 'previewParentNode'))
  document.getElementById('previewSimilarNodes').addEventListener('mouseenter', showPreview.bind(this, 'previewSimilarNodes'))

  document.getElementById('previewSelectedText').addEventListener('mouseleave', clearPreview)
  document.getElementById('previewParentNode').addEventListener('mouseleave', clearPreview)
  document.getElementById('previewSimilarNodes').addEventListener('mouseleave', clearPreview)

  document.getElementById('previewSelectedText').addEventListener('click', makeColor.bind(this, 'colorSelectedText'))
  document.getElementById('previewParentNode').addEventListener('click', makeColor.bind(this, 'colorParentNode'))
  document.getElementById('previewSimilarNodes').addEventListener('click', makeColor.bind(this, 'colorSimilarNodes'))

  const inputs = document.querySelectorAll('input[data-config=true')
  inputs.forEach(inp => {
    inp.addEventListener('change', saveSettings)
    inp.addEventListener('keypress', saveSettings)
  })
}

document.addEventListener('DOMContentLoaded', function () {
  loadSettings()
  addEventListeners()
})
