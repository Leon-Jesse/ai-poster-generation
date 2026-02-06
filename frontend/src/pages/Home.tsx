import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Monitor, Smartphone, Upload, Image as ImageIcon, ChevronUp, Loader2, Download } from "lucide-react"
import { posterService, GeneratedThumbnail } from "@/services/posterService"
import { useAuthStore } from "@/store/useAuthStore"

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
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'xiaohongshu' | 'douyin' | 'classic43'>('youtube')
  const [selectedEmotion, setSelectedEmotion] = useState('震惊')
  const [customEmotion, setCustomEmotion] = useState('')
  const [customEmotions, setCustomEmotions] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [titleText, setTitleText] = useState('')
  const [backgroundText, setBackgroundText] = useState('')
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [stylePreview, setStylePreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [styleFile, setStyleFile] = useState<File | null>(null)
  const [advancedStyleText, setAdvancedStyleText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedThumbnails, setGeneratedThumbnails] = useState<GeneratedThumbnail[]>([])
  const [lastGeneratedPlatform, setLastGeneratedPlatform] = useState<'youtube' | 'xiaohongshu' | 'douyin' | 'classic43' | null>(null)
  
  const navigate = useNavigate()
  const { user, fetchUser } = useAuthStore()

  // 页面加载时获取用户信息（包括免费试用次数）
  useEffect(() => {
    if (user) {
      fetchUser()
    }
  }, []) // 只在组件挂载时执行一次

  // 预设表情列表
  const presetEmotions = ["震惊", "灿烂微笑", "怀疑", "无语", "坚定", "兴奋", "困惑", "胜利"]
  
  // 所有可用的表情（预设 + 自定义）
  const allEmotions = [...presetEmotions, ...customEmotions, "自定义..."]

  // 生成风格文案映射（英文 style -> 中文显示）
  const getStyleLabel = (style?: string) => {
    switch (style) {
      case "Viral Pop":
        return "爆款流量风格"
      case "Cinematic Drama":
        return "电影质感风格"
      case "Luxury Prestige":
        return "高端奢华风格"
      default:
        return "爆款封面"
    }
  }

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

  // 将文件转换为 base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 处理生成封面图
  const handleGenerate = async () => {
    // 验证表单和用户状态
    if (!isFormValid()) {
      alert('请填写所有必填字段（封面大字、表情、上传照片）')
      return
    }

    if (!user) {
      alert('请先登录后再生成封面图')
      navigate('/login')
      return
    }

    // 检查免费试用次数和余额
    const remainingFreeTrials = user.remaining_free_trials ?? 0
    const userBalance = user.balance ?? 0
    const generationCost = 10 // 每次生成消耗10积分

    if (remainingFreeTrials === 0 && userBalance < generationCost) {
      alert(`免费试用次数已用完，且余额不足（当前余额：${userBalance}，需要：${generationCost}）。请前往充值页面购买积分。`)
      navigate('/pricing')
      return
    }

    if (isGenerating) {
      return // 防止重复提交
    }

    // 清空上一次的结果，进入生成中状态
    setGeneratedThumbnails([])
    setIsGenerating(true)
    try {
      // 转换图片为 base64
      let selfieBase64: string | undefined
      let styleRefBase64: string | undefined

      if (coverFile) {
        selfieBase64 = await fileToBase64(coverFile)
      }
      if (styleFile) {
        styleRefBase64 = await fileToBase64(styleFile)
      }

      // 确定表情（如果是自定义，使用自定义值）
      const finalEmotion = selectedEmotion === "自定义..." ? customEmotion : selectedEmotion

      if (!finalEmotion || finalEmotion.trim() === '') {
        alert('请选择或输入表情')
        setIsGenerating(false)
        return
      }

      // 调用后端 API 生成封面
      const response = await posterService.generate({
        platform: selectedPlatform,
        title_text: titleText.trim(),
        background_text: backgroundText.trim() || undefined,
        emotion: finalEmotion.trim(),
        selfie_base64: selfieBase64,
        style_ref_base64: styleRefBase64,
        advanced_style: advancedStyleText.trim() || undefined,
      })

      // 检查响应
      if (response && response.code === 0 && response.data) {
        console.log('Generate poster success:', response.data)
        // 记录这次生成使用的平台，便于下面决定展示哪种尺寸
        setLastGeneratedPlatform(selectedPlatform)
        // 保存后端返回的 3 张封面图
        if (response.data.thumbnails && response.data.thumbnails.length > 0) {
          setGeneratedThumbnails(response.data.thumbnails)
        } else if (response.data.image_url) {
          // 兼容只有一张图的情况
          setGeneratedThumbnails([{ url: response.data.image_url, style: 'Default' }])
        }
        // 刷新用户信息以更新免费试用次数
        await fetchUser()
      } else {
        // API 返回错误
        const errorMsg = response?.message || '生成失败，请重试'
        alert(errorMsg)
        console.error('Generate failed:', response)
      }
    } catch (error: any) {
      // 网络错误或其他异常
      console.error('Generate error:', error)
      const errorMsg = error?.response?.data?.message ||
        error?.message ||
        '网络错误，请检查网络连接后重试'
      alert(errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#050816] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-10 lg:px-0 lg:pb-24 lg:pt-16">
        {/* Logo & hero copy */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101828]/80 px-4 py-1 text-xs font-medium text-slate-300 border border-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            即刻生成高点击率爆款封面图
          </div>
          <p className="text-sm text-slate-300 sm:text-base">
            免费试用：<span className="font-semibold text-emerald-400">
              {user?.remaining_free_trials ?? 0}/3
            </span> 剩余免费次数
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                onClick={() => setSelectedPlatform('classic43')}
                className={`flex flex-col items-center justify-center rounded-2xl p-6 transition-all ${
                  selectedPlatform === 'classic43'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-2 border-pink-400'
                    : 'bg-[#1a1f3a] border border-white/10 hover:border-white/20'
                }`}
              >
                <Monitor className={`h-8 w-8 mb-2 ${selectedPlatform === 'classic43' ? 'text-white' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium mb-1 ${selectedPlatform === 'classic43' ? 'text-white' : 'text-slate-300'}`}>
                  经典
                </span>
                <span className={`text-xs ${selectedPlatform === 'classic43' ? 'text-white/80' : 'text-slate-400'}`}>4:3</span>
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
                      setCoverFile(file)
                    } else {
                      setCoverPreview(null)
                      setCoverFile(null)
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
                      setStyleFile(file)
                    } else {
                      setStylePreview(null)
                      setStyleFile(null)
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* 生成进度（结果展示在下方示例区域） */}
          <div className="mb-8">
            {isGenerating && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-purple-500/40 bg-[#020617]/80 px-6 py-8 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <p className="text-sm font-medium text-slate-100">
                  正在生成 <span className="text-pink-400">3</span> 张封面图…
                </p>
                <p className="text-xs text-slate-400">
                  大概需要 5–15 秒，请不要关闭页面。
                </p>
              </div>
            )}
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
                value={advancedStyleText}
                onChange={(e) => setAdvancedStyleText(e.target.value)}
                placeholder='自定义风格指令(如"使用蓝金配色"、"更戏剧化")'
                className="w-full rounded-xl border border-white/15 bg-[#020617]/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-pink-400 focus:outline-none min-h-[100px] resize-none"
              />
            )}
          </div>

          {/* 生成按钮 */}
          <div className="pt-4">
            <Button 
              onClick={handleGenerate}
              disabled={!isFormValid() || isGenerating || !user}
              className={`h-12 w-full rounded-full text-sm font-semibold shadow-lg transition-all ${
                isFormValid() && !isGenerating && user
                  ? 'bg-gradient-to-r from-pink-500 via-violet-500 to-sky-400 shadow-pink-500/30 hover:brightness-110'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                '开始生成封面图'
              )}
            </Button>
            {!user && (
              <p className="mt-2 text-center text-xs text-pink-400">
                请先登录后再生成封面图
              </p>
            )}
          </div>
        </section>

        {/* Example / Generated galleries */}
        <section className="space-y-6">
          {/* 16:9 区域：有生成结果且用户生成的是 16:9（YouTube）时，用用户新图；否则用默认示例 */}
          {(generatedThumbnails.length === 0 || lastGeneratedPlatform === 'youtube') && (
          <div>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium tracking-wide">YOUTUBE (16:9)</span>
              {generatedThumbnails.length > 0 && lastGeneratedPlatform === 'youtube' && (
                <span>已生成 {generatedThumbnails.length} 张不同风格封面</span>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {generatedThumbnails.length > 0 && lastGeneratedPlatform === 'youtube'
                ? generatedThumbnails.map((thumb, index) => (
                    <div
                      key={thumb.style + index}
                      className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#020617]"
                    >
                      <img
                        src={thumb.url}
                        alt={getStyleLabel(thumb.style) || `封面图 ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-3 py-2 text-xs text-slate-100">
                        <span className="truncate">{getStyleLabel(thumb.style)}</span>
                        <a
                          href={thumb.url}
                          download={`cover_${index + 1}.png`}
                          className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-900 hover:bg-white"
                        >
                          <Download className="h-3 w-3" />
                          下载
                        </a>
                      </div>
                    </div>
                  ))
                : youtubeExamples.map((example) => (
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
          )}

          {/* 3:4 区域：有生成结果且用户生成的是 3:4（小红书）时，用用户新图；否则用默认示例 */}
          {(generatedThumbnails.length === 0 || lastGeneratedPlatform === 'xiaohongshu') && (
          <div>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium tracking-wide">小红书 (3:4)</span>
              {generatedThumbnails.length > 0 && lastGeneratedPlatform === 'xiaohongshu' && (
                <span>已生成 {generatedThumbnails.length} 张不同风格封面</span>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {generatedThumbnails.length > 0 && lastGeneratedPlatform === 'xiaohongshu'
                ? generatedThumbnails.map((thumb, index) => (
                    <div
                      key={thumb.style + index + '-34'}
                      className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#020617]"
                    >
                      <img
                        src={thumb.url}
                        alt={getStyleLabel(thumb.style) || `封面图 ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-3 py-2 text-xs text-slate-100">
                        <span className="truncate">{getStyleLabel(thumb.style)}</span>
                        <a
                          href={thumb.url}
                          download={`cover_${index + 1}_34.png`}
                          className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-900 hover:bg-white"
                        >
                          <Download className="h-3 w-3" />
                          下载
                        </a>
                      </div>
                    </div>
                  ))
                : verticalExamples.map((example) => (
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
          )}

          {/* 4:3 区域：只在用户生成了 4:3（经典）图片时显示 */}
          {lastGeneratedPlatform === 'classic43' && generatedThumbnails.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium tracking-wide">经典 (4:3)</span>
              <span>已生成 {generatedThumbnails.length} 张不同风格封面</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {generatedThumbnails.map((thumb, index) => (
                <div
                  key={thumb.style + index + '-43'}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#020617]"
                >
                  <img
                    src={thumb.url}
                    alt={getStyleLabel(thumb.style) || `封面图 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-3 py-2 text-xs text-slate-100">
                    <span className="truncate">{getStyleLabel(thumb.style)}</span>
                    <a
                      href={thumb.url}
                      download={`cover_${index + 1}_43.png`}
                      className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-900 hover:bg-white"
                    >
                      <Download className="h-3 w-3" />
                      下载
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* 9:16 区域：只在用户生成了 9:16（抖音/TikTok）图片时显示 */}
          {lastGeneratedPlatform === 'douyin' && generatedThumbnails.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium tracking-wide">抖音 / TIKTOK (9:16)</span>
              <span>已生成 {generatedThumbnails.length} 张不同风格封面</span>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {generatedThumbnails.map((thumb, index) => (
                <div
                  key={thumb.style + index + '-916'}
                  className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-[#020617]"
                >
                  <img
                    src={thumb.url}
                    alt={getStyleLabel(thumb.style) || `封面图 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-3 py-2 text-xs text-slate-100">
                    <span className="truncate">{getStyleLabel(thumb.style)}</span>
                    <a
                      href={thumb.url}
                      download={`cover_${index + 1}_916.png`}
                      className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-900 hover:bg-white"
                    >
                      <Download className="h-3 w-3" />
                      下载
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </section>
      </div>
    </div>
  )
}
