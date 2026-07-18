import { useEffect, useRef } from 'react'

// Renders third-party embed snippets that include <script> tags (Getty
// Images' embed being the main case). Browsers never execute <script>
// elements inserted via innerHTML/dangerouslySetInnerHTML -- so we set the
// markup, then manually recreate each <script> tag and re-insert it, which
// does force execution. Used here so the admin's own preview actually shows
// the photo instead of just the bare Getty credit link.
//
// The editor page can show two of these at once (featured-image preview +
// thumbnail preview), and SmartFrame's loader script registers a global
// Web Component the first time it runs -- running it a 2nd time on the
// same page breaks it (SmartFrame then shows its own "cannot be fully
// rendered" error instead of the photo). So we track loaded script `src`s
// module-wide and only ever execute a given one once; the actual embed
// markup (e.g. <smartframe-embed>) still gets left in the DOM every time
// and is auto-upgraded by the browser once the custom element is
// registered, so skipping the duplicate script doesn't stop it rendering.
const loadedScriptSrcs = new Set()

function resolveSrc(src) {
  try {
    return new URL(src, document.baseURI).href
  } catch {
    return src
  }
}

export default function EmbedHtml({ html, className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !html) return

    container.innerHTML = html

    const scripts = Array.from(container.querySelectorAll('script'))
    scripts.forEach(oldScript => {
      const src = oldScript.getAttribute('src')

      if (src) {
        const resolved = resolveSrc(src)
        // See note in the frontend copy of this file: don't query the
        // document here -- innerHTML above already inserted this exact
        // inert <script> tag, so a document-wide lookup would always
        // "find" it and wrongly skip the very first real load too.
        if (loadedScriptSrcs.has(resolved)) {
          oldScript.remove()
          return
        }
        loadedScriptSrcs.add(resolved)
      }

      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value))
      newScript.textContent = oldScript.textContent
      oldScript.parentNode.replaceChild(newScript, oldScript)
    })
  }, [html])

  if (!html) return null
  return <div ref={containerRef} className={className} />
}