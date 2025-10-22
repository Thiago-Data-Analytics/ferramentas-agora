import React, { useMemo, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/test_XXXXXXXXXXXXX"

const LANGS = {
  pt: { app: "Ferramentas Agora", search: "Buscar ferramentas...", upgrade: "Assinar Premium", sections: { popular: "Populares", pdf: "PDF", image: "Imagens", data: "Dados", social: "Social (IA)" }, copy: "Copiar", copied: "Copiado!", download: "Baixar", process: "Processar", generate: "Gerar" },
  en: { app: "Ferramentas Agora", search: "Search tools...", upgrade: "Upgrade", sections: { popular: "Popular", pdf: "PDF", image: "Images", data: "Data", social: "Social (AI)" }, copy: "Copy", copied: "Copied!", download: "Download", process: "Process", generate: "Generate" },
  es: { app: "Ferramentas Agora", search: "Buscar herramientas...", upgrade: "Premium", sections: { popular: "Populares", pdf: "PDF", image: "Imágenes", data: "Datos", social: "Social (IA)" }, copy: "Copiar", copied: "¡Copiado!", download: "Descargar", process: "Procesar", generate: "Generar" }
}

function useI18n(){
  const [lang, setLang] = useState('pt')
  const t = useMemo(()=>LANGS[lang], [lang])
  return { t, lang, setLang }
}

async function callAI(purpose, input){
  const r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ purpose, input }) })
  if(!r.ok) throw new Error('AI error')
  const j = await r.json()
  return j.output || ''
}

function Copy({ value, t }){
  const [ok,setOk] = useState(false)
  return <button onClick={async()=>{await navigator.clipboard.writeText(value||''); setOk(true); setTimeout(()=>setOk(false),1200)}} className="px-3 py-2 rounded-lg border">{ok?t.copied:t.copy}</button>
}

function QRTool({ t }){
  const [text,setText] = useState('https://ferramentasagora.com')
  const [img,setImg] = useState('')
  const make = async()=> setImg(await QRCode.toDataURL(text,{margin:1,scale:6}))
  return (
    <div className="bg-white rounded-2xl border p-4 mb-4">
      <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">QR Code</h3><button onClick={make} className="px-3 py-2 bg-black text-white rounded-lg">{t.generate}</button></div>
      <input value={text} onChange={e=>setText(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
      {img && <div className="flex items-center gap-3"><img src={img} width={160}/><a href={img} download="qrcode.png" className="px-3 py-2 rounded-lg border">{t.download}</a></div>}
    </div>
  )
}

function PdfMerge({ t }){
  const [files,setFiles]=useState([])
  const merge = async()=>{
    const out = await PDFDocument.create()
    for(const f of files){
      const bytes = new Uint8Array(await f.arrayBuffer())
      const src = await PDFDocument.load(bytes)
      const pages = await out.copyPages(src, src.getPageIndices())
      pages.forEach(p=>out.addPage(p))
    }
    const pdfBytes = await out.save()
    const blob = new Blob([pdfBytes], {type:'application/pdf'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'merged.pdf'; a.click()
  }
  return (
    <div className="bg-white rounded-2xl border p-4 mb-4">
      <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">Mesclar PDFs</h3><button onClick={merge} className="px-3 py-2 bg-black text-white rounded-lg">{t.process}</button></div>
      <input type="file" accept="application/pdf" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))}/>
    </div>
  )
}

function ImageResize({ t }){
  const [file,setFile]=useState(null)
  const [w,setW]=useState(1080)
  const [q,setQ]=useState(0.8)
  const run = ()=>{
    if(!file) return
    const img = new Image()
    img.onload = ()=>{
      const scale = w / img.width; const h = Math.round(img.height*scale)
      const c=document.createElement('canvas'); c.width=w; c.height=h
      const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,w,h)
      c.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=file.name.replace(/\.[^.]+$/,'')+'-resized.jpg'; a.click() }, 'image/jpeg', q)
    }
    img.src = URL.createObjectURL(file)
  }
  return (
    <div className="bg-white rounded-2xl border p-4 mb-4">
      <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">Redimensionar Imagem</h3><button onClick={run} className="px-3 py-2 bg-black text-white rounded-lg">{t.process}</button></div>
      <div className="flex items-center gap-3 mb-2"><label>Largura <input type="number" value={w} onChange={e=>setW(+e.target.value)} className="border rounded p-1 w-24 ml-2"/></label><label>Qualidade <input type="range" min="0.2" max="1" step="0.05" value={q} onChange={e=>setQ(+e.target.value)} className="ml-2"/></label></div>
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])}/>
    </div>
  )
}

function SocialAI({ t }){
  const [input,setInput]=useState('Texto para o post sobre viagem, praia e drone…')
  const [out,setOut]=useState('')
  const run = async()=>{
    setOut('Gerando…')
    try { setOut(await callAI('hashtags', input)) } catch(e){ setOut('Erro de IA. Configure OPENAI_API_KEY na Vercel.') }
  }
  return (
    <div className="bg-white rounded-2xl border p-4 mb-4">
      <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">Hashtags / Títulos (IA)</h3><button onClick={run} className="px-3 py-2 bg-black text-white rounded-lg">{t.generate}</button></div>
      <textarea value={input} onChange={e=>setInput(e.target.value)} className="w-full border rounded-lg p-2 h-24 mb-2"/>
      <pre className="bg-zinc-50 border rounded-lg p-3 text-sm whitespace-pre-wrap">{out}</pre>
    </div>
  )
}

export default function App(){
  const { t, lang, setLang } = useI18n()
  const [q,setQ]=useState('')

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-xl">⚙️ {t.app}</div>
          <div className="flex items-center gap-2">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t.search} className="px-3 py-2 border rounded-lg"/>
            <select value={lang} onChange={e=>setLang(e.target.value)} className="px-2 py-2 border rounded-lg"><option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option></select>
            <a href={STRIPE_CHECKOUT_URL} className="px-3 py-2 bg-amber-400 rounded-lg font-semibold"> {t.upgrade} </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold mb-2">{t.sections.popular}</h2>
        <QRTool t={t} />
        <ImageResize t={t} />
        <PdfMerge t={t} />
        <h2 className="text-lg font-semibold mt-6 mb-2">{t.sections.social}</h2>
        <SocialAI t={t} />
      </main>

      <footer className="text-center text-sm text-zinc-500 py-6 border-t">© {new Date().getFullYear()} Ferramentas Agora</footer>
    </div>
  )
}
