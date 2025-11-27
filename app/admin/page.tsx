"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, RefreshCw, Mail, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ContactSubmission = {
  id: string
  name: string
  phone: string | null
  email: string | null
  message: string
  status: "new" | "in_progress" | "completed"
  created_at: string
  updated_at: string
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<ContactSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchSubmissions = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setSubmissions(data || [])
      setFilteredSubmissions(data || [])
    } catch (error) {
      console.error("[v0] Error fetching submissions:", error)
      toast({
        title: "데이터를 불러오는데 실패했습니다",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  useEffect(() => {
    let filtered = submissions

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(
        (sub) =>
          sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.phone?.includes(searchQuery),
      )
    }

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === statusFilter)
    }

    setFilteredSubmissions(filtered)
  }, [searchQuery, statusFilter, submissions])

  const updateStatus = async (id: string, newStatus: string) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("contact_submissions").update({ status: newStatus }).eq("id", id)

      if (error) throw error

      toast({
        title: "상태가 업데이트되었습니다",
      })

      fetchSubmissions()
      if (selectedSubmission?.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status: newStatus as any })
      }
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast({
        title: "상태 업데이트에 실패했습니다",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "신규", variant: "default" },
      in_progress: { label: "진행중", variant: "secondary" },
      completed: { label: "완료", variant: "outline" },
    }

    const config = variants[status] || variants.new
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const stats = {
    total: submissions.length,
    new: submissions.filter((s) => s.status === "new").length,
    inProgress: submissions.filter((s) => s.status === "in_progress").length,
    completed: submissions.filter((s) => s.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">문의 관리</h1>
            <p className="text-muted-foreground mt-1">고객 문의를 확인하고 관리하세요</p>
          </div>
          <Button onClick={fetchSubmissions} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>전체 문의</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>신규 문의</CardDescription>
              <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">{stats.new}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>진행 중</CardDescription>
              <CardTitle className="text-3xl text-amber-600 dark:text-amber-400">{stats.inProgress}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>처리 완료</CardDescription>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">{stats.completed}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* 필터 & 검색 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름, 이메일, 전화번호로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="new">신규</SelectItem>
                  <SelectItem value="in_progress">진행중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">데이터를 불러오는 중...</div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">문의 내역이 없습니다</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>상태</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead>문의 내용</TableHead>
                      <TableHead>제출일</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell className="font-medium">{submission.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {submission.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {submission.email}
                              </div>
                            )}
                            {submission.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {submission.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{submission.message}</TableCell>
                        <TableCell>{new Date(submission.created_at).toLocaleString("ko-KR")}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 상세보기 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>문의 상세 정보</DialogTitle>
            <DialogDescription>문의 내용을 확인하고 상태를 변경할 수 있습니다</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">이름</Label>
                  <p className="mt-1">{selectedSubmission.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">상태</Label>
                  <div className="mt-1">
                    <Select
                      value={selectedSubmission.status}
                      onValueChange={(value) => updateStatus(selectedSubmission.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">신규</SelectItem>
                        <SelectItem value="in_progress">진행중</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {selectedSubmission.email && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">이메일</Label>
                  <p className="mt-1">{selectedSubmission.email}</p>
                </div>
              )}

              {selectedSubmission.phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">전화번호</Label>
                  <p className="mt-1">{selectedSubmission.phone}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">문의 내용</Label>
                <p className="mt-1 whitespace-pre-wrap bg-muted p-4 rounded-md">{selectedSubmission.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">제출일</Label>
                  <p className="mt-1">{new Date(selectedSubmission.created_at).toLocaleString("ko-KR")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">최종 수정일</Label>
                  <p className="mt-1">{new Date(selectedSubmission.updated_at).toLocaleString("ko-KR")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={className} {...props} />
}
