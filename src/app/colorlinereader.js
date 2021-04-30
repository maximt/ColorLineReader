'use strict'

class ColorGradient {
  constructor (l, r) {
    this.left = ColorGradient.hexToRgb(l)
    this.right = ColorGradient.hexToRgb(r)
  }

  getGradient (steps) {
    const list = []
    for (let c = 0; c <= steps; c++) {
      const p = c / steps
      const r = Math.round(this.left.r + (this.right.r - this.left.r) * p)
      const g = Math.round(this.left.g + (this.right.g - this.left.g) * p)
      const b = Math.round(this.left.b + (this.right.b - this.left.b) * p)
      list.push(`rgb(${r}, ${g}, ${b})`)
    }
    return list
  }

  getGradientCyrcle (steps) {
    const list1 = this.getGradient(steps)
    const list2 = list1.slice(1, -2).reverse()
    return list1.concat(list2)
  }

  static hexToRgb (hex) {
    const match = hex.replace(/#/, '').match(/.{1,2}/g)
    return {
      r: parseInt(match[0], 16),
      g: parseInt(match[1], 16),
      b: parseInt(match[2], 16)
    }
  }
}

// eslint-disable-next-line no-unused-vars
class PreviewStyleGenerator {
  constructor (color) {
    this.color = color || '#cccccc'
  }

  inject () {
    const css = '.clr-text-preview{background-color:' + this.color + ';}'

    let customStyles = document.getElementById('clr-text-preview')
    if (!customStyles) {
      customStyles = document.createElement('style')
      customStyles.id = 'clr-text-preview'
      document.getElementsByTagName('head')[0].appendChild(customStyles)
    }
    customStyles.innerHTML = css
  }
}

class StyleGenerator {
  constructor (colorLeft, colorRight, steps, fontSize) {
    this.fontSize = fontSize
    const clr = new ColorGradient(colorLeft, colorRight)
    this.colors = clr.getGradientCyrcle(steps)
  }

  inject () {
    let css = ''

    if (this.fontSize) {
      css += 'clr.clr-text{font-size:' + this.fontSize + '% ;}'
    }

    for (let i = 0; i < this.colors.length; i++) {
      css += 'clr.clr-text clr.clr-text-' + i + '{color: ' + this.colors[i] + ';}'
    }

    let customStyles = document.getElementById('clr-text-styles')
    if (!customStyles) {
      customStyles = document.createElement('style')
      customStyles.id = 'clr-text-styles'
      document.getElementsByTagName('head')[0].appendChild(customStyles)
    }
    customStyles.innerHTML = css
  }
}

class ColorNodeFilter {
  constructor (nodes) {
    this.nodeList = nodes
  }

  getNodes () {
    let nodes = this.nodeList

    if (!(Object.prototype.isPrototypeOf.call(nodes, NodeList) || Array.isArray(nodes))) {
      nodes = [nodes]
    }

    const _nodes = []

    nodes.forEach(node => {
      const _iterator = document.createNodeIterator(node, NodeFilter.SHOW_ALL, {
        acceptNode: ColorNodeFilter.isOKNode
      })

      while (_iterator.nextNode()) {
        _nodes.push(_iterator.referenceNode)
      }
    })

    return _nodes
  }

  static isColoredAlready (node) {
    if (node.isRecolored) return true
    if (node.parentNode) return ColorNodeFilter.isColoredAlready(node.parentNode)
    return false
  }

  static isOKNode (node) {
    return (node.nodeType === Node.TEXT_NODE && !ColorNodeFilter.isColoredAlready(node))
  }
}

class ColorNodes {
  constructor (nodes, colorCount, seed) {
    this.nodes = nodes
    this.colorCount = colorCount
  }

  makeColor () {
    this.nodes.forEach(node => {
      const parentNode = node.parentNode
      if (!parentNode) return

      const nodeColored = document.createElement('clr')
      nodeColored.className = (node.className ? node.className : '') + ' clr-text'
      nodeColored.isRecolored = true

      const text = node.textContent
      let textColored = ''
      let colorIndex = 0
      let direction = 1
      let maxColor = this.colorCount

      for (let charIndex = 0; charIndex < text.length; charIndex++) {
        const char = text[charIndex]
        textColored += '<clr class="clr-text-' + colorIndex + '">' + char + '</clr>'

        colorIndex += direction

        if (colorIndex <= 0) {
          direction = 1
        } else if (colorIndex >= (maxColor - 1)) {
          direction = -1
          const _seed = parseInt(Math.random() * Math.ceil(this.colorCount / 2))
          maxColor = this.colorCount - _seed
        }
      }

      nodeColored.innerHTML = textColored

      parentNode.replaceChild(nodeColored, node)
    })
  }
}

class NodeSelection {
  getSelectedArea () {
    const sel = window.getSelection()
    if (sel.rangeCount && sel.getRangeAt) {
      return sel.getRangeAt(0)
    }
    return null
  }

  getNodes () {
    throw new Error('NotImplementedException')
  }
}

class TextSelection extends NodeSelection {
  findSelectedNodes (range) {
    if (!range) { return null }

    const _iterator = document.createNodeIterator(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ALL, {
        acceptNode: function (node) {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
        }
      })

    const _nodes = []
    while (_iterator.nextNode()) {
      if (_nodes.length === 0 && _iterator.referenceNode !== range.startContainer) continue
      _nodes.push(_iterator.referenceNode)
      if (_iterator.referenceNode === range.endContainer) break
    }

    return _nodes
  }

  getNodes () {
    const range = this.getSelectedArea()
    return this.findSelectedNodes(range)
  }
}

class ParentSelection extends NodeSelection {
  findParentNode (range) {
    const node = range.commonAncestorContainer
    return node
  }

  getNodes () {
    const range = this.getSelectedArea()
    return this.findParentNode(range)
  }
}

class SimilarSelection extends NodeSelection {
  findSimilarNodes (range) {
    const node = range.endContainer.parentNode
    if (!(node && node.className)) return
    const filterClass = '.' + node.className
    const nodes = document.querySelectorAll(filterClass)
    return nodes
  }

  getNodes () {
    const range = this.getSelectedArea()
    return this.findSimilarNodes(range)
  }
}

// eslint-disable-next-line no-unused-vars
class ColorLineReader {
  constructor (startColor, endColor, fontSize) {
    this.startColor = startColor || '#ff0000'
    this.endColor = endColor || '#0000ff'
    this.fontSize = fontSize
  }

  createColorStyles (startColor, endColor, fontSize) {
    const style = new StyleGenerator(startColor, endColor, 10, fontSize)
    style.inject()
    return style
  }

  colorSelectedText () {
    const style = this.createColorStyles(this.startColor, this.endColor, this.fontSize)
    const sl = new TextSelection()
    this.colorize(sl, style)
  }

  colorParentNode () {
    const style = this.createColorStyles(this.startColor, this.endColor, this.fontSize)
    const sl = new ParentSelection()
    this.colorize(sl, style)
  }

  colorSimilarNodes () {
    const style = this.createColorStyles(this.startColor, this.endColor, this.fontSize)
    const sl = new SimilarSelection()
    this.colorize(sl, style)
  }

  colorize (selector, style) {
    const n = selector.getNodes()
    if (!n) return

    const f = new ColorNodeFilter(n)
    const tn = f.getNodes()
    if (!tn) return

    const clr = new ColorNodes(tn, style.colors.length)
    clr.makeColor()
  }
}

// eslint-disable-next-line no-unused-vars
class PreviewContent {
  constructor (color) {
    this.color = color

    const styles = new PreviewStyleGenerator(color)
    styles.inject()
  }

  selectedText () {
    const sl = new TextSelection()
    this.show(sl)
  }

  parentNode () {
    const sl = new ParentSelection()
    this.show(sl)
  }

  similarNodes () {
    const sl = new SimilarSelection()
    this.show(sl)
  }

  show (selector) {
    this.clear()

    const n = selector.getNodes()
    if (!n) return

    const f = new ColorNodeFilter(n)
    const tn = f.getNodes()
    if (!tn) return

    tn.forEach(node => {
      const p = node.parentNode
      if (p && p.classList) { p.classList.add('clr-text-preview') }
    })
  }

  clear () {
    const nodes = document.querySelectorAll('.clr-text-preview')

    if (!nodes) return

    nodes.forEach(node => {
      node.classList.remove('clr-text-preview')
    })
  }
}
