// Serializable Playwright page function; keep dependencies inside the function.
export function inspectLayout() {
  const styleKeys = [
    'display',
    'width',
    'min-width',
    'max-width',
    'padding-left',
    'padding-right',
    'gap',
    'flex',
    'flex-shrink',
    'grid-template-columns',
    'white-space',
    'overflow-wrap',
    'overflow-x',
    'position',
    'font-family',
    'font-size',
    'font-weight',
    'letter-spacing',
    'line-height',
  ]
  const path = (element) => {
    const parts = []
    for (let e = element; e && e !== document.documentElement; e = e.parentElement) {
      const index = e.parentElement ? [...e.parentElement.children].indexOf(e) + 1 : 1
      parts.unshift(`${e.tagName.toLowerCase()}:nth-child(${index})`)
    }
    return 'html > ' + parts.join(' > ')
  }
  const describe = (element) => {
    const r = element.getBoundingClientRect(),
      css = getComputedStyle(element)
    return {
      path: path(element),
      tag: element.tagName,
      class: element.getAttribute('class'),
      text: element.textContent?.trim().slice(0, 80),
      rect: { left: r.left, right: r.right, width: r.width, top: r.top, height: r.height },
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      styles: Object.fromEntries(styleKeys.map((key) => [key, css.getPropertyValue(key)])),
    }
  }
  const width = innerWidth
  return {
    url: location.href,
    viewport: { width, height: innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    devicePixelRatio,
    fonts: document.fonts.status,
    rootFont: getComputedStyle(document.documentElement).fontFamily,
    mobileRules: matchMedia('(max-width: 720px)').matches,
    elements: [...document.querySelectorAll('body *')]
      .flatMap((element) => {
        const r = element.getBoundingClientRect()
        if (!r.width || (r.left >= 0 && r.right <= width)) return []
        const parents = []
        for (let p = element.parentElement; p && parents.length < 4; p = p.parentElement)
          parents.push(describe(p))
        return [{ ...describe(element), parents }]
      })
      .slice(0, 40),
  }
}
