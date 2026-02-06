import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronLeft, ChevronRight, Coins, Calendar, Monitor, Smartphone, CheckCircle, XCircle, Clock } from "lucide-react"
import { posterService, Poster } from "@/services/posterService"
import { useAuthStore } from "@/store/useAuthStore"

// 获取平台显示名称
const getPlatformLabel = (platform?: string) => {
  switch (platform) {
    case "youtube":
      return "YouTube"
    case "xiaohongshu":
      return "小红书"
    case "douyin":
      return "抖音/TikTok"
    case "classic43":
      return "经典"
    default:
      return "未知平台"
  }
}

// 获取平台图标
const getPlatformIcon = (platform?: string) => {
  switch (platform) {
    case "youtube":
      return <Monitor className="h-4 w-4" />
    case "xiaohongshu":
    case "douyin":
    case "classic43":
      return <Smartphone className="h-4 w-4" />
    default:
      return <Monitor className="h-4 w-4" />
  }
}

// 获取状态显示
const getStatusDisplay = (status: string) => {
  switch (status) {
    case "completed":
      return {
        label: "已完成",
        icon: <CheckCircle className="h-4 w-4" />,
        className: "text-green-400 bg-green-500/20 border-green-500/50"
      }
    case "pending":
      return {
        label: "处理中",
        icon: <Clock className="h-4 w-4" />,
        className: "text-yellow-400 bg-yellow-500/20 border-yellow-500/50"
      }
    case "failed":
      return {
        label: "失败",
        icon: <XCircle className="h-4 w-4" />,
        className: "text-red-400 bg-red-500/20 border-red-500/50"
      }
    default:
      return {
        label: status,
        icon: <Clock className="h-4 w-4" />,
        className: "text-slate-400 bg-slate-500/20 border-slate-500/50"
      }
  }
}

export default function Gallery() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [posters, setPosters] = useState<Poster[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const [platformFilter, setPlatformFilter] = useState<'all' | 'youtube' | 'xiaohongshu' | 'douyin' | 'classic43'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchHistory()
  }, [user, page])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await posterService.getHistory(page, pageSize)
      if (response.code === 0 && response.data) {
        setPosters(response.data.items || [])
        setTotal(response.data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  // 解析prompt获取平台和相关信息
  const getPosterInfo = (poster: Poster) => {
    const prompt = poster.prompt || {}
    const platform = prompt.platform as string
    const overlayText = prompt.overlay_text as string || '无标题'
    const contextPrompt = prompt.context_prompt as string || ''
    const emotion = prompt.emotion as string || ''
    const aspectRatio = prompt.aspect_ratio as string || "16:9"
    return { platform, overlayText, contextPrompt, emotion, aspectRatio }
  }

  // 根据筛选条件过滤当前页数据
  const filteredPosters = posters.filter((poster) => {
    const { platform } = getPosterInfo(poster)
    if (platformFilter !== 'all' && platform !== platformFilter) return false
    if (statusFilter !== 'all' && poster.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.ceil(total / pageSize)

  // 统计当前页（筛选后）消费数据
  const pageTotalCost = filteredPosters.reduce((sum, poster) => sum + (poster.cost || 0), 0)
  const statusTotals = filteredPosters.reduce((acc, poster) => {
    const key = poster.status || 'unknown'
    if (!acc[key]) {
      acc[key] = { count: 0, cost: 0 }
    }
    acc[key].count += 1
    acc[key].cost += poster.cost || 0
    return acc
  }, {} as Record<string, { count: number; cost: number }>)

  const completedStats = statusTotals['completed'] || { count: 0, cost: 0 }
  const pendingStats = statusTotals['pending'] || { count: 0, cost: 0 }
  const failedStats = statusTotals['failed'] || { count: 0, cost: 0 }

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
      second: '2-digit',
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#050816] text-white">
      <div className="container mx-auto px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">消费历史</h1>
          <p className="text-slate-400 text-sm">
            查看您的所有生成记录和消费明细。共 <span className="text-emerald-400 font-medium">{total}</span> 条记录，
            当前页（已按筛选后）共消耗 <span className="text-emerald-400 font-medium">{pageTotalCost}</span> 积分。
            状态统计：已完成 <span className="font-medium text-slate-200">{completedStats.count}</span> 笔 /
            <span className="font-medium text-emerald-400"> {completedStats.cost}</span> 积分；
            处理中 <span className="font-medium text-slate-200">{pendingStats.count}</span> 笔 /
            <span className="font-medium text-emerald-400"> {pendingStats.cost}</span> 积分；
            失败 <span className="font-medium text-slate-200">{failedStats.count}</span> 笔 /
            <span className="font-medium text-emerald-400"> {failedStats.cost}</span> 积分。
          </p>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">平台</span>
              <select
                value={platformFilter}
                onChange={(e) => {
                  setPage(1)
                  setPlatformFilter(e.target.value as any)
                }}
                className="bg-[#020617] border border-white/10 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">全部</option>
                <option value="youtube">YouTube (16:9)</option>
                <option value="xiaohongshu">小红书 (3:4)</option>
                <option value="douyin">抖音/TikTok (9:16)</option>
                <option value="classic43">经典 (4:3)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">状态</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1)
                  setStatusFilter(e.target.value as any)
                }}
                className="bg-[#020617] border border-white/10 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">全部</option>
                <option value="completed">已完成</option>
                <option value="pending">处理中</option>
                <option value="failed">失败</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-4" />
            <p className="text-slate-400">加载中...</p>
          </div>
        ) : posters.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <Coins className="h-16 w-16 text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">还没有消费记录</h2>
            <p className="text-slate-400 mb-6">开始生成您的第一张封面图吧！</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110"
            >
              开始生成
            </Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 text-sm text-slate-400">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </div>

            {/* History Table */}
            <div className="rounded-2xl border border-white/10 bg-[#020617] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#050816] border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">平台 / 尺寸</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">封面标题</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">背景场景</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">表情</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">消耗积分</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">生成时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredPosters.map((poster) => {
                      const { platform, overlayText, contextPrompt, emotion, aspectRatio } = getPosterInfo(poster)
                      const statusDisplay = getStatusDisplay(poster.status)
                      
                      return (
                        <tr key={poster.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            #{poster.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                {getPlatformIcon(platform)}
                                <span>{getPlatformLabel(platform)}</span>
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {aspectRatio || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate" title={overlayText}>
                            {overlayText}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate" title={contextPrompt}>
                            {contextPrompt || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {emotion || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusDisplay.className}`}>
                              {statusDisplay.icon}
                              {statusDisplay.label}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                              <Coins className="h-4 w-4" />
                              {poster.cost}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {formatDate(poster.created_at)}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
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
