import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useAuth } from '../../context/AuthContext'
import { getAPI } from '../../utils/api'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import { MdSave, MdPublish, MdArrowBack, MdImage } from 'react-icons/md'
import EmbedHtml from '../../components/ui/EmbedHtml'

// Custom Quill toolbar icon for the "embed" button (a simple bracketed-frame
// glyph, distinct from the built-in image icon it sits next to).
Quill.import('ui/icons').embed =
  '<svg viewBox="0 0 18 18"><rect class="ql-stroke" x="2" y="4" width="14" height="10" rx="1.5"></rect><path class="ql-stroke" d="M6 8l-2 2 2 2M12 8l2 2-2 2"></path></svg>'

// A custom Quill block embed for dropping a raw third-party embed snippet
// (e.g. "Embed from Getty Images", AP Newsroom, or a tweet/Instagram embed)
// into the article BODY, separate from the featured-image embed below.
// Quill's normal HTML model strips <script> tags on save, so the snippet
// gets stored URI-encoded in a data attribute; the public frontend's
// content renderer (splitEmbeds in ArticlePage.jsx) looks for this exact
// div shape and swaps it for a live <EmbedHtml /> at render time.
const BlockEmbed = Quill.import('blots/block/embed')
class InlineEmbedBlot extends BlockEmbed {
  static create(html) {
    const node = super.create()
    // NOTE: setting a static `className` on the blot class does NOT
    // automatically apply it for a custom BlockEmbed -- that's only a real
    // hook for certain built-in Attributor-based formats. Without this
    // explicit classList.add, the saved HTML never actually got
    // class="ql-embed-block" on it, so the frontend's detection regex
    // silently never matched and the raw placeholder text rendered as
    // plain text on the live site instead of being swapped for the embed.
    node.classList.add('ql-embed-block')
    node.setAttribute('data-embed-html', encodeURIComponent(html))
    node.setAttribute('contenteditable', 'false')
    node.textContent = '🔗 Embed (renders live on the site — e.g. a licensed photo or social post)'
    return node
  }
  static value(node) {
    return decodeURIComponent(node.getAttribute('data-embed-html') || '')
  }
}
InlineEmbedBlot.blotName = 'embedBlock'
InlineEmbedBlot.tagName = 'div'
Quill.register(InlineEmbedBlot)

function insertEmbedHandler() {
  const html = window.prompt('Paste the embed code (e.g. the "Embed from Getty Images" snippet, or a tweet/Instagram embed code):')
  if (!html || !html.trim()) return
  // Inside a Quill toolbar handler, `this` is the Toolbar module instance,
  // not the editor -- the editor is reached via `this.quill`. Calling
  // this.getSelection() directly throws "not a function".
  const range = this.quill.getSelection(true)
  this.quill.insertEmbed(range.index, 'embedBlock', html.trim(), 'user')
  this.quill.setSelection(range.index + 1, 0, 'user')
}

const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'embed'],
      ['clean'],
    ],
    handlers: {
      embed: insertEmbedHandler,
    },
  },
}

export default function ArticleEditor() {
  const { id } = useParams()
  const { activeSite } = useAuth()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '', subheading: '', excerpt: '', content: '', category: '',
    tags: '', source: '', status: 'draft', isFeatured: false, isBreaking: false,
    isHero: false, isTopStory: false,
    embeddedVideo: '',
    seo: { metaTitle: '', metaDescription: '', keywords: '' },
    featuredImage: { url: '', publicId: '', alt: '', embedHtml: '', thumbnailUrl: '', thumbnailPublicId: '', thumbnailEmbedHtml: '' },
  })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [imageMode, setImageMode] = useState('upload') // 'upload' | 'embed'
  const [thumbnailMode, setThumbnailMode] = useState('upload') // 'upload' | 'embed'
  const [activeTab, setActiveTab] = useState('content')

  useEffect(() => {
    const api = getAPI(activeSite)
    api.get('/categories').then(res => setCategories(res.data.data || []))
    if (isEdit) {
      api.get(`/articles/admin/all?limit=100`).then(res => {
        const article = res.data.data?.find(a => a._id === id)
        if (article) {
          setForm({
            title: article.title || '',
            subheading: article.subheading || '',
            excerpt: article.excerpt || '',
            content: article.content || '',
            category: article.category?._id || '',
            tags: article.tags?.join(', ') || '',
            source: article.source || '',
            status: article.status || 'draft',
            isFeatured: article.isFeatured || false,
            isBreaking: article.isBreaking || false,
            isHero: article.isHero || false,
            isTopStory: article.isTopStory || false,
            embeddedVideo: article.embeddedVideo || '',
            featuredImage: article.featuredImage || { url: '', publicId: '', alt: '', embedHtml: '', thumbnailUrl: '', thumbnailPublicId: '', thumbnailEmbedHtml: '' },
            seo: {
              metaTitle: article.seo?.metaTitle || '',
              metaDescription: article.seo?.metaDescription || '',
              keywords: article.seo?.keywords?.join(', ') || '',
            },
          })
          setImageMode(article.featuredImage?.embedHtml ? 'embed' : 'upload')
          setThumbnailMode(article.featuredImage?.thumbnailEmbedHtml ? 'embed' : 'upload')
        }
      })
    }
  }, [activeSite, id])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await getAPI(activeSite).post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm(f => ({ ...f, featuredImage: { ...f.featuredImage, url: res.data.data.url, publicId: res.data.data.publicId, alt: f.title, embedHtml: '' } }))
      toast.success('Image uploaded')
    } catch (e) { toast.error('Image upload failed') }
    finally { setUploading(false) }
  }

  const handleEmbedHtmlChange = (html) => {
    // Embed and upload are mutually exclusive for a given featured image --
    // pasting embed code clears any previously uploaded file so the two
    // don't conflict on the frontend.
    setForm(f => ({ ...f, featuredImage: { ...f.featuredImage, url: '', publicId: '', embedHtml: html } }))
  }

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await getAPI(activeSite).post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm(f => ({ ...f, featuredImage: { ...f.featuredImage, thumbnailUrl: res.data.data.url, thumbnailPublicId: res.data.data.publicId, thumbnailEmbedHtml: '' } }))
      toast.success('Thumbnail uploaded')
    } catch (e) { toast.error('Thumbnail upload failed') }
    finally { setUploadingThumb(false) }
  }

  const handleThumbnailEmbedChange = (html) => {
    // Same mutual-exclusivity as above, but for the thumbnail specifically:
    // pasting a thumbnail embed (e.g. SmartFrame) clears any uploaded
    // thumbnail file.
    setForm(f => ({ ...f, featuredImage: { ...f.featuredImage, thumbnailUrl: '', thumbnailPublicId: '', thumbnailEmbedHtml: html } }))
  }

  const handleSave = async (status) => {
    if (!form.title || !form.excerpt || !form.content || !form.category) {
      toast.error('Please fill in title, excerpt, content and category')
      return
    }
    setLoading(true)
    try {
      const api = getAPI(activeSite)
      const payload = {
        ...form,
        status,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        seo: { ...form.seo, keywords: form.seo.keywords.split(',').map(k => k.trim()).filter(Boolean) },
      }
      if (isEdit) {
        await api.put(`/articles/${id}`, payload)
        toast.success('Article updated')
      } else {
        await api.post('/articles', payload)
        toast.success('Article created')
      }
      navigate('/articles')
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save') }
    finally { setLoading(false) }
  }

  const tabs = ['content', 'media', 'seo', 'settings']

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/articles')}><MdArrowBack size={16} /> Back</Button>
          <h1 className="text-white text-xl font-bold">{isEdit ? 'Edit Article' : 'New Article'}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleSave('draft')} disabled={loading}><MdSave size={16} /> Save Draft</Button>
          <Button onClick={() => handleSave('published')} disabled={loading}><MdPublish size={16} /> Publish</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-4">
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Article title..."
            className="w-full bg-gray-800 text-white text-xl font-bold border border-gray-700 rounded-xl px-5 py-4 outline-none focus:border-yellow-400 placeholder-gray-600"
          />
          <input
            value={form.subheading}
            onChange={e => setForm(f => ({ ...f, subheading: e.target.value }))}
            placeholder="Sub-heading (optional)..."
            className="w-full bg-gray-800 text-white text-sm border border-gray-700 rounded-xl px-5 py-3 outline-none focus:border-yellow-400 placeholder-gray-600"
          />
          <textarea
            value={form.excerpt}
            onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
            placeholder="Short excerpt (max 300 characters)..."
            maxLength={300}
            rows={3}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-5 py-4 outline-none focus:border-yellow-400 resize-none text-sm placeholder-gray-600"
          />

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900 p-1 rounded-lg">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-md text-xs font-semibold capitalize transition-all ${
                  activeTab === tab ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'content' && (
            <div>
              <div className="bg-white rounded-xl overflow-hidden">
                <ReactQuill
                  value={form.content}
                  onChange={val => setForm(f => ({ ...f, content: val }))}
                  modules={modules}
                  theme="snow"
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Need a photo mid-article that isn't yours to upload? Use the <strong className="text-gray-400">embed</strong> button
                in the toolbar (next to the image icon) and paste a licensed embed snippet instead.
              </p>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="bg-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Featured Image</h3>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-300">Before you upload:</strong> only use a photo you have the right to use —
                your own photo, a licensed wire/stock photo (Getty, AP, Reuters, a paid stock library), or
                something under Creative Commons / Unsplash / Pexels with its license terms followed.
                For an actual news photo you don't own, use <strong className="text-gray-300">"Licensed Photo Embed"</strong> below
                instead of downloading and re-uploading the file — the embed keeps the image on the license
                holder's own servers under their terms, rather than copying it onto ours.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${imageMode === 'upload' ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('embed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${imageMode === 'embed' ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  Licensed Photo Embed
                </button>
              </div>

              {imageMode === 'upload' && (
                <>
                  {form.featuredImage.url && (
                    <img src={form.featuredImage.url} alt="Featured" className="w-full h-48 object-cover rounded-lg" />
                  )}
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-3 text-sm transition-all w-fit">
                    <MdImage size={18} />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </>
              )}

              {imageMode === 'embed' && (
                <>
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">
                      Embed Code
                    </label>
                    <p className="text-gray-500 text-xs mb-2">
                      On gettyimages.com or apimages.com, search for the photo, click the <code className="text-gray-400">&lt;/&gt;</code> / "Embed"
                      option, and paste the snippet it gives you here. Editorial use only — don't paste a downloaded image URL, paste the embed
                      snippet itself.
                    </p>
                    <textarea
                      value={form.featuredImage.embedHtml}
                      onChange={e => handleEmbedHtmlChange(e.target.value)}
                      rows={6}
                      placeholder='<iframe src="https://embed.gettyimages.com/embed/..." ...></iframe>'
                      className="w-full bg-gray-950 text-green-400 font-mono border border-gray-600 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-yellow-400 resize-y"
                    />
                  </div>
                  {form.featuredImage.embedHtml && (
                    <div>
                      <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Preview</label>
                      <div className="bg-white rounded-lg p-2 max-w-sm">
                        <EmbedHtml html={form.featuredImage.embedHtml} />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-700">
                    <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">
                      Card Thumbnail (optional)
                    </label>
                    <p className="text-gray-500 text-xs mb-2">
                      A licensed embed can't be cropped into a small homepage/list card, but a
                      responsive embed (e.g. SmartFrame) can. Upload a normal image, paste a
                      thumbnail-safe embed code, or leave empty and the card will show "No Image".
                    </p>

                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setThumbnailMode('upload')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${thumbnailMode === 'upload' ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                        Upload Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailMode('embed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${thumbnailMode === 'embed' ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                        Embed Code
                      </button>
                    </div>

                    {thumbnailMode === 'upload' ? (
                      <>
                        {form.featuredImage.thumbnailUrl && (
                          <img src={form.featuredImage.thumbnailUrl} alt="Thumbnail" className="w-full max-w-xs h-32 object-cover rounded-lg mb-2" />
                        )}
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2.5 text-sm transition-all w-fit">
                          <MdImage size={16} />
                          {uploadingThumb ? 'Uploading...' : 'Upload Thumbnail'}
                          <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" disabled={uploadingThumb} />
                        </label>
                      </>
                    ) : (
                      <>
                        <textarea
                          value={form.featuredImage.thumbnailEmbedHtml}
                          onChange={e => handleThumbnailEmbedChange(e.target.value)}
                          rows={4}
                          placeholder='<script async src="https://embed.smartframe.io/..."></script><smart-frame-embed ...></smart-frame-embed>'
                          className="w-full bg-gray-950 text-green-400 font-mono border border-gray-600 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-yellow-400 resize-y"
                        />
                        {form.featuredImage.thumbnailEmbedHtml && (
                          <div className="mt-2">
                            <label className="text-gray-500 text-xs block mb-1">Preview (actual card is smaller than this)</label>
                            <div className="bg-white rounded-lg p-2 max-w-[200px]">
                              <EmbedHtml html={form.featuredImage.thumbnailEmbedHtml} />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">YouTube Embed URL</label>
                <input
                  value={form.embeddedVideo}
                  onChange={e => setForm(f => ({ ...f, embeddedVideo: e.target.value }))}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="bg-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">SEO Settings</h3>
              {[
                { label: 'Meta Title', key: 'metaTitle', placeholder: 'SEO title (50-60 chars)' },
                { label: 'Meta Description', key: 'metaDescription', placeholder: 'SEO description (150-160 chars)' },
                { label: 'Keywords', key: 'keywords', placeholder: 'keyword1, keyword2, keyword3' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">{field.label}</label>
                  <input
                    value={form.seo[field.key]}
                    onChange={e => setForm(f => ({ ...f, seo: { ...f.seo, [field.key]: e.target.value } }))}
                    placeholder={field.placeholder}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Article Settings</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 accent-yellow-400" />
                <span className="text-white text-sm">Featured article</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isBreaking} onChange={e => setForm(f => ({ ...f, isBreaking: e.target.checked }))} className="w-4 h-4 accent-yellow-400" />
                <span className="text-white text-sm">Breaking news</span>
              </label>
              <div className="pt-4 border-t border-gray-700 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isHero} onChange={e => setForm(f => ({ ...f, isHero: e.target.checked }))} className="w-4 h-4 accent-yellow-400" />
                  <span className="text-white text-sm">Set as homepage hero</span>
                </label>
                <p className="text-gray-500 text-xs pl-7 -mt-2">
                  Publishing this as hero automatically pushes whatever is currently the hero down into the side news rail. To pin an article into a specific side-news slot instead, use the Home Page manager.
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isTopStory} onChange={e => setForm(f => ({ ...f, isTopStory: e.target.checked }))} className="w-4 h-4 accent-yellow-400" />
                  <span className="text-white text-sm">Pin to Top Stories for its category</span>
                </label>
                <p className="text-gray-500 text-xs pl-7 -mt-2">
                  Each category tab on the homepage shows its top 6 stories. Pinned stories always appear there; the rest fill in automatically with the most recent articles.
                </p>
              </div>
            </div>
            
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-semibold border-b border-gray-700 pb-3">Details</h3>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Tags</label>
              <input
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="football, transfer, premier league"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
              />
              <p className="text-gray-600 text-xs mt-1">Comma separated</p>
            </div>
            <div>
  <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Byline / Source</label>
  <input
    value={form.source}
    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
    placeholder="e.g. Admin, BBC News, Reuters, Punch Newspapers"
    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
  />
  <p className="text-gray-500 text-xs mt-1">Leave blank to default to your account name.</p>
</div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full justify-center" onClick={() => handleSave('published')} disabled={loading}>
              <MdPublish size={16} /> {loading ? 'Saving...' : 'Publish Now'}
            </Button>
            <Button variant="secondary" className="w-full justify-center" onClick={() => handleSave('draft')} disabled={loading}>
              <MdSave size={16} /> Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
