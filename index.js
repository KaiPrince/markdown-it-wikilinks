'use strict'

const Plugin = require('markdown-it-regexp')
const extend = require('extend')
const sanitize = require('sanitize-filename')

module.exports = (options) => {

  const defaults = {
    linkPattern: /\[\[([^|\]\n]+)(\|([^\]\n]+))?\]\]/,
    baseURL: '/',
    relativeBaseURL: './',
    makeAllLinksAbsolute: false,
    uriSuffix: '.html',
    htmlAttributes: {
    },
    htmlTag: 'a',
    hrefAttribute: 'href',
    generatePageNameFromLabel: (label) => {
      return label
    },
    postProcessPageName: (pageName) => {
      pageName = pageName.trim()
      pageName = pageName.split('/').map(sanitize).join('/')
      pageName = pageName.replace(/\s+/, '_')
      return pageName
    },
    postProcessLabel: (label) => {
      label = label.trim()
      return label
    }
  }

  options = extend(true, defaults, options)

  function isJumpLink(pageName) {
    return String(pageName).charAt(0) === '#'
  }

  function isAbsolute(pageName) {
    return (
      options.makeAllLinksAbsolute ||
      pageName.charCodeAt(0) === 0x2f /* / */
    )
  }

  function removeInitialSlashes(str) {
    return str.replace(/^\/+/g, '')
  }

  return Plugin(
    options.linkPattern,
    (match, utils) => {
      let label = ''
      let pageName = ''
      let href = ''
      let htmlAttrs = []
      let htmlAttrsString = ''
      const isSplit = !!match[3]
      if (isSplit) {
        label = match[3]
        pageName = options.generatePageNameFromLabel(match[1])
      }
      else {
        label = match[1]
        pageName = options.generatePageNameFromLabel(label)
      }

      label = options.postProcessLabel(label)
      pageName = options.postProcessPageName(pageName)

      // make sure none of the values are empty
      if (!label || !pageName) {
        return match.input
      }

      if (isJumpLink(pageName)) {
        href = pageName + options.uriSuffix
      }
      else if (isAbsolute(pageName)) {
        pageName = removeInitialSlashes(pageName)
        href = options.baseURL + pageName + options.uriSuffix
      }
      else {
        href = options.relativeBaseURL + pageName + options.uriSuffix
      }
      href = utils.escape(href)

      htmlAttrs.push(`${options.hrefAttribute}="${href}"`)
      for (let attrName in options.htmlAttributes) {
        const attrValue = options.htmlAttributes[attrName]
        htmlAttrs.push(`${attrName}="${attrValue}"`)
      }
      htmlAttrsString = htmlAttrs.join(' ')

      return `<${options.htmlTag} ${htmlAttrsString}>${label}</${options.htmlTag}>`
    }
  )
}
