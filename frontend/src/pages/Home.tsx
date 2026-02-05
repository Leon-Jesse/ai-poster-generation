import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Monitor, Smartphone, Upload, Image as ImageIcon, ChevronUp } from "lucide-react"

// 导入真实图片
import youtube1 from "@/assets/images/16_9_1.png"
import youtube2 from "@/assets/images/16_9_2.png"
import youtube3 from "@/assets/images/16_9_3.png"
import vertical1 from "@/assets/images/3_4_1.png"
import vertical2 from "@/assets/images/4_3_2.png"
import vertical3 from "@/assets/images/4_3_3.png"
import vertical4 from "@/assets/images/4_3_4.png"

const youtubeExamples = [
  { title: "从印度和尚到最赚钱创作者", image: youtube1 },
  { title: "不升级的人正在被淘汰", image: youtube2 },
  { title: "人人能做软件 残酷真相", image: youtube3 },
]

const verticalExamples = [
  { title: "未来十年钱该怎么赚", image: vertical1 },
  { title: "2026年上哪找机会", image: vertical2 },
  { title: "用 AI 做营销 卖爆全球", image: vertical3 },
  { title: "不听话的人正在改变世界", image: vertical4 },
]

export default function Home() {
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'xiaohongshu' | 'douyin'>('youtube')
  const [selectedEmotion, setSelectedEmotion] = useState('震惊')
  const [customEmotion, setCustomEmotion] = useState('')
  const [customEmotions, setCustomEmotions] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [titleText, setTitleText] = useState('')
  const [backgroundText, setBackgroundText] = useState('')
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [stylePreview, setStylePreview] = useState<string | null>(null)

  // 预设表情列表
  const presetEmotions = ["震惊", "灿烂微笑", "怀疑", "无语", "坚定", "兴奋", "困惑", "胜利"]
  
  // 所有可用的表情（预设 + 自定义）
  const allEmotions = [...presetEmotions, ...customEmotions, "自定义..."]

  // 表单验证：检查必填字段
  const isFormValid = () => {
    // 封面大字必填
    if (!titleText.trim()) return false
    
    // 表情必填：如果选的是自定义，则自定义输入必须有值；否则预设表情已选中即可
    if (selectedEmotion === "自定义...") {
      if (!customEmotion.trim()) return false
    }
    
    // 上传照片必填
    if (!coverPreview) return false
    
    return true
  }

  // 添加自定义表情
  const handleAddCustomEmotion = () => {
    if (customEmotion.trim() && !customEmotions.includes(customEmotion.trim())) {
      setCustomEmotions([...customEmotions, customEmotion.trim()])
      setSelectedEmotion(customEmotion.trim())
      setCustomEmotion('')
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#050816] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-10 lg:px-0 lg:pb-24 lg:pt-16">
        {/* Logo & hero copy */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101828]/80 px-4 py-1 text-xs font-medium text-slate-300 border border-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            即刻生成高点击率爆款封面图
          </div>
          <h1 className="bg-gradient-to-r from-[#7dd3fc] via-[#c4b5fd] to-[#f9a8d4] bg-clip-text text-4xl font-extrabold tracking-[0.3em] text-transparent sm:text-5xl lg:text-[56px]">
            COVERMAGIC
          </h1>
          <p className="text-sm text-slate-300 sm:text-base">
            免费试用：<span className="font-semibold text-emerald-400">2/3</span> 剩余免费次数
          </p>
        </header>

        {/* Main creation panel */}
        <section className="rounded-3xl border border-white/10 bg-[#050816]/60 p-6 shadow-[0_0_60px_rgba(0,0,0,0.7)] backdrop-blur-md lg:p-8">
          {/* Step 1: 选择平台 */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-xs font-medium text-pink-200">
                1
              </span>
              <span className="text-sm font-medium text-white">选择平台</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setSelectedPlatform('youtube')}
                className={`flex flex-col items-center justify-center rounded-2xl p-6 transition-all ${
                  selectedPlatform === 'youtube'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-2 border-pink-400'
                    : 'bg-[#1a1f3a] border border-white/10 hover:border-white/20'
                }`}
              >
                <Monitor className={`h-8 w-8 mb-2 ${selectedPlatform === 'youtube' ? 'text-white' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium mb-1 ${selectedPlatform === 'youtube' ? 'text-white' : 'text-slate-300'}`}>
                  YouTube
                </span>
                <span className={`text-xs ${selectedPlatform === 'youtube' ? 'text-white/80' : 'text-slate-400'}`}>16:9</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('xiaohongshu')}
                className={`flex flex-col items-center justify-center rounded-2xl p-6 transition-all ${
                  selectedPlatform === 'xiaohongshu'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-2 border-pink-400'
                    : 'bg-[#1a1f3a] border border-white/10 hover:border-white/20'
                }`}
              >
                <Smartphone className={`h-8 w-8 mb-2 ${selectedPlatform === 'xiaohongshu' ? 'text-white' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium mb-1 ${selectedPlatform === 'xiaohongshu' ? 'text-white' : 'text-slate-300'}`}>
                  小红书
                </span>
                <span className={`text-xs ${selectedPlatform === 'xiaohongshu' ? 'text-white/80' : 'text-slate-400'}`}>3:4</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('douyin')}
                className={`flex flex-col items-center justify-center rounded-2xl p-6 transition-all ${
                  selectedPlatform === 'douyin'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-2 border-pink-400'
                    : 'bg-[#1a1f3a] border border-white/10 hover:border-white/20'
                }`}
              >
                <Smartphone className={`h-8 w-8 mb-2 ${selectedPlatform === 'douyin' ? 'text-white' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium mb-1 ${selectedPlatform === 'douyin' ? 'text-white' : 'text-slate-300'}`}>
                  抖音/TikTok
                </span>
                <span className={`text-xs ${selectedPlatform === 'douyin' ? 'text-white/80' : 'text-slate-400'}`}>9:16</span>
              </button>
            </div>
          </div>

          {/* Step 2: 填写封面内容 */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-xs font-medium text-pink-200">
                2
              </span>
              <span className="text-sm font-medium text-white">填写封面内容</span>
              <span className="text-xs text-pink-400">* 必填</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-slate-300">封面大字</label>
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  placeholder="我靠这个赚了100万/这个秘密改变了一切"
                  className="w-full rounded-xl border border-white/15 bg-[#020617]/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-pink-400 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-300">背景场景</label>
                <input
                  type="text"
                  value={backgroundText}
                  onChange={(e) => setBackgroundText(e.target.value)}
                  placeholder="豪华办公室/未来科技感/金色财富主题"
                  className="w-full rounded-xl border border-white/15 bg-[#020617]/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-pink-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 3: 选择表情 */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-medium text-yellow-200">
                3
              </span>
              <span className="text-sm font-medium text-white">选择表情</span>
              <span className="text-xs text-pink-400">* 必填</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allEmotions.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => setSelectedEmotion(emotion)}
                  className={`rounded-full px-4 py-2 text-sm transition-all ${
                    selectedEmotion === emotion
                      ? 'bg-yellow-500 text-gray-900 font-medium'
                      : 'bg-[#1a1f3a] border border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
            {selectedEmotion === "自定义..." && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={customEmotion}
                  onChange={(e) => setCustomEmotion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customEmotion.trim()) {
                      handleAddCustomEmotion()
                    }
                  }}
                  placeholder="输入你想要的自定义表情描述"
                  className="flex-1 rounded-xl border border-white/15 bg-[#020617]/60 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-pink-400 focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomEmotion}
                  disabled={!customEmotion.trim()}
                  className="rounded-xl bg-yellow-500 text-gray-900 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加
                </Button>
              </div>
            )}
          </div>

          {/* Step 4: 上传照片 */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-xs font-medium text-pink-200">
                4
              </span>
              <span className="text-sm font-medium text-white">上传照片</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* 主照片上传 */}
              <label
                htmlFor="cover-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-[#020617]/60 p-8 text-center hover:border-pink-400/80 transition-colors"
              >
                {coverPreview ? (
                  <div className="mb-3 w-full max-w-xs overflow-hidden rounded-xl border border-white/20">
                    <img
                      src={coverPreview}
                      alt="封面预览"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : (
                  <Upload className="h-10 w-10 mb-3 text-slate-400" />
                )}
                <p className="text-sm font-medium text-white mb-1">上传你的照片</p>
                <p className="text-xs text-pink-400 mb-1">*必填</p>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setCoverPreview(url)
                    } else {
                      setCoverPreview(null)
                    }
                  }}
                />
              </label>

              {/* 风格参考图上传 */}
              <label
                htmlFor="style-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#020617]/40 p-8 text-center relative hover:border-pink-400/80 transition-colors"
              >
                {stylePreview ? (
                  <div className="mb-3 w-full max-w-xs overflow-hidden rounded-xl border border-white/20">
                    <img
                      src={stylePreview}
                      alt="风格参考预览"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : (
                  <ImageIcon className="h-8 w-8 mb-3 text-slate-400" />
                )}
                <p className="text-sm font-medium text白 mb-1">风格参考图</p>
                <p className="text-xs text-slate-400">(可选)</p>
                <input
                  id="style-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setStylePreview(url)
                    } else {
                      setStylePreview(null)
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* 高级选项 */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mb-4 flex w-full items-center justify-between text-sm font-medium text-white"
            >
              <span>高级选项</span>
              <ChevronUp className={`h-4 w-4 transition-transform ${showAdvanced ? '' : 'rotate-180'}`} />
            </button>
            {showAdvanced && (
              <textarea
                placeholder='自定义风格指令(如"使用蓝金配色"、"更戏剧化")'
                className="w-full rounded-xl border border-white/15 bg-[#020617]/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-pink-400 focus:outline-none min-h-[100px] resize-none"
              />
            )}
          </div>

          {/* 生成按钮 */}
          <div className="pt-4">
            <Link to="/workspace">
              <Button 
                disabled={!isFormValid()}
                className={`h-12 w-full rounded-full text-sm font-semibold shadow-lg transition-all ${
                  isFormValid()
                    ? 'bg-gradient-to-r from-pink-500 via-violet-500 to-sky-400 shadow-pink-500/30 hover:brightness-110'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                开始生成封面图
              </Button>
            </Link>
          </div>
        </section>

        {/* Example galleries */}
        <section className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium tracking-wide">YOUTUBE (16:9)</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {youtubeExamples.map((example) => (
                <div
                  key={example.title}
                  className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#020617]"
                >
                  <img
                    src={example.image}
                    alt={example.title}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium tracking-wide">小红书 / 抖音 / TIKTOK (3:4)</span>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {verticalExamples.map((example) => (
                <div
                  key={example.title}
                  className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#020617]"
                >
                  <img
                    src={example.image}
                    alt={example.title}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
