import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { posterService, Poster } from "@/services/posterService"
import { useAuthStore } from "@/store/useAuthStore"

// 获取平台显示名称
const getPlatformLabel = (platform?: string) => {
  switch (platform) {
    case "youtube":
      return "YouTube (16:9)"
    case "xiaohongshu":
      return "小红书 (3:4)"
    case "douyin":
      return "抖音/TikTok (9:16)"
    case "classic43":
      return "经典 (4:3)"
    default:
      return "未知平台"
  }
}

// 获取aspect ratio对应的CSS类
const getAspectRatioClass = (aspectRatio?: string) => {
  switch (aspectRatio) {
    case "16:9":
      return "aspect-video"
    case "3:4":
      return "aspect-[3/4]"
    case "4:3":
      return "aspect-[4/3]"
    case "9:16":
      return "aspect-[9/16]"
    default:
      return "aspect-video"
  }
}

export default function Workspace() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [posters, setPosters] = useState<Poster[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 12
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({})
  const [historyStats, setHistoryStats] = useState<{
    total: number
    completed: number
    pending: number
    failed: number
  } | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchPosters()
  }, [user, page])

  // 单独拉一次全局历史统计，用于在没有卡片时显示汇总
  useEffect(() => {
    if (!user) return
    const fetchHistoryStats = async () => {
      try {
        const res = await posterService.getHistory(1, 200)
        if (res.code === 0 && res.data) {
          const items = res.data.items || []
          const totalAll = res.data.total || items.length
          let completed = 0
          let pending = 0
          let failed = 0
          items.forEach((p) => {
            if (p.status === 'completed') completed++
            else if (p.status === 'pending') pending++
            else if (p.status === 'failed') failed++
          })
          setHistoryStats({
            total: totalAll,
            completed,
            pending,
            failed,
          })
        }
      } catch (e) {
        console.error('Failed to fetch history stats for workspace', e)
      }
    }
    fetchHistoryStats()
  }, [user])

  const fetchPosters = async () => {
    setLoading(true)
    try {
      const response = await posterService.list(page, pageSize)
      if (response.code === 0 && response.data) {
        // Filter to only show completed posters with valid image URLs
        // Backend already filters by status='completed' and non-empty image_url,
        // but we do an extra check here for safety
        const validPosters = (response.data.items || []).filter((poster: Poster) => {
          return poster.status === 'completed' && 
                 poster.image_url && 
                 poster.image_url.trim() !== '' &&
                 (poster.image_url.startsWith('http') || poster.image_url.startsWith('data:image'))
        })
        setPosters(validPosters)
        // Use backend total since backend already filters by completed status
        setTotal(response.data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch posters:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  // 解析prompt获取平台和aspect ratio信息
  const getPosterInfo = (poster: Poster) => {
    const prompt = poster.prompt || {}
    let platform = prompt.platform as string
    let aspectRatio = prompt.aspect_ratio as string || "16:9"
    
    // 如果没有platform，尝试从aspect_ratio推断
    if (!platform && aspectRatio) {
      switch (aspectRatio) {
        case "16:9":
          platform = "youtube"
          break
        case "3:4":
          platform = "xiaohongshu"
          break
        case "9:16":
          platform = "douyin"
          break
        case "4:3":
          platform = "classic43"
          break
      }
    }
    
    return { platform, aspectRatio }
  }

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#050816] text-white">
      <div className="container mx-auto px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">我的工作区</h1>
          <p className="text-slate-400 text-sm">
            查看和管理您生成的所有封面图。
          </p>
          {historyStats && (
            <p className="mt-2 text-xs text-slate-400">
              共 <span className="font-semibold text-slate-100">{historyStats.total}</span> 次生成，
              其中已完成 <span className="font-semibold text-emerald-400">{historyStats.completed}</span> 次，
              处理中 <span className="font-semibold text-amber-300">{historyStats.pending}</span> 次，
              失败 <span className="font-semibold text-red-400">{historyStats.failed}</span> 次。
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-4" />
            <p className="text-slate-400 text-sm">加载中...</p>
          </div>
        ) : posters.length === 0 ? (
          // 没有可展示的已完成封面图时，仅展示统计信息，不再显示大块占位 UI
          <div className="py-12 text-center text-sm text-slate-400">
            当前没有可展示的已完成封面图，请前往首页生成新的封面。
          </div>
        ) : (
          <>
            {/* Stats for current page */}
            <div className="mb-6 text-sm text-slate-400">
              本页共 {posters.length} 张封面图，第 {page} / {totalPages} 页
            </div>

            {/* Poster Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {posters.map((poster) => {
                const { platform, aspectRatio } = getPosterInfo(poster)
                const aspectClass = getAspectRatioClass(aspectRatio)

                // 图片地址有效性检查：如果无效则不渲染该卡片
                const url = poster.image_url || ""
                const isValidImageUrl =
                  url.trim() !== "" &&
                  (url.startsWith("http://") ||
                    url.startsWith("https://") ||
                    url.startsWith("data:image"))

                if (!isValidImageUrl) {
                  return null
                }

                const hasImageError = !!imageErrorMap[poster.id]

                return (
                  <div
                    key={poster.id}
                    data-poster-card
                    className="group relative rounded-2xl border border-white/10 bg-[#020617] overflow-hidden hover:border-pink-400/50 transition-all"
                  >
                    {/* Image */}
                    <div className={`relative ${aspectClass} overflow-hidden bg-[#050816]`}>
                      {isValidImageUrl && !hasImageError && (
                        <img
                          src={poster.image_url}
                          alt={`封面图 ${poster.id}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // 如果图片加载失败，标记为出错，使用占位符显示
                            setImageErrorMap((prev) => ({
                              ...prev,
                              [poster.id]: true,
                            }))
                          }}
                        />
                      )}
                      {(hasImageError) && (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 bg-slate-800/60">
                          图片加载失败，点击重新生成试试
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      {isValidImageUrl && !hasImageError && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a
                            href={poster.image_url}
                            download={`cover_${poster.id}.png`}
                            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            下载
                          </a>
                        </div>
                      )}

                      {/* Status Badge - 只显示已完成（因为已经过滤了） */}
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-green-500/90 text-xs font-medium text-white">
                        已完成
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {getPlatformLabel(platform)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(poster.created_at)}
                        </span>
                      </div>
                      {poster.prompt && typeof poster.prompt === 'object' && (
                        <div className="text-xs text-slate-300 truncate">
                          {(poster.prompt as any).overlay_text || '无标题'}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">消耗积分: {poster.cost}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`transition-all ${
                    page === 1
                      ? 'text-slate-300 border-slate-500/60 bg-slate-700/50 cursor-not-allowed'
                      : 'text-white border-emerald-500 bg-emerald-500/80 hover:bg-emerald-500 hover:border-emerald-400 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一页
                </Button>
                <span className="text-sm text-slate-300 font-medium min-w-[60px] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`transition-all ${
                    page === totalPages
                      ? 'text-slate-300 border-slate-500/60 bg-slate-700/50 cursor-not-allowed'
                      : 'text-white border-emerald-500 bg-emerald-500/80 hover:bg-emerald-500 hover:border-emerald-400 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  下一页
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
