import { useEffect, useState } from 'react'
import { createDiary, deleteDiary, fetchDiaries } from './api/diaries.js'

const emotions = [
  { id: 'joy', label: '기쁨', emoji: '😊', chip: 'bg-[#fff0d2] text-[#8a5a08]' },
  { id: 'calm', label: '평온', emoji: '😌', chip: 'bg-[#dff1e9] text-[#23644f]' },
  { id: 'sad', label: '슬픔', emoji: '😢', chip: 'bg-[#e2eff8] text-[#315d7b]' },
  { id: 'angry', label: '화남', emoji: '😠', chip: 'bg-[#ffe4dd] text-[#9b493c]' },
  { id: 'anxious', label: '불안', emoji: '😰', chip: 'bg-[#eee9f8] text-[#655284]' },
]

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

const todayFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})
const todayLabel = todayFormatter.format(new Date())

function getErrorMessage(error) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : typeof error?.message === 'string'
          ? error.message
          : ''

  if (message.includes('Supabase 설정이 없습니다')) return message
  if (/err_name_not_resolved|enotfound|eai_again|name_not_resolved/i.test(message)) {
    return 'Supabase 서버 주소를 찾을 수 없습니다. .env.local의 VITE_SUPABASE_URL을 확인해 주세요.'
  }
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return '네트워크에 연결할 수 없습니다. 인터넷 연결과 Supabase 프로젝트 상태를 확인해 주세요.'
  }
  if (/permission denied|row-level security|violates row-level/i.test(message)) {
    return '데이터베이스 권한이 없습니다. Supabase의 diaries 테이블 권한과 RLS 정책을 확인해 주세요.'
  }
  if (/relation .* does not exist|could not find the table/i.test(message)) {
    return 'diaries 테이블을 찾을 수 없습니다. Supabase에 테이블이 생성되어 있는지 확인해 주세요.'
  }

  return message
    ? `일기를 불러오거나 저장하지 못했습니다. ${message}`
    : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

async function refreshDiaryList(setDiaries, setError, setLoading, showLoading = false) {
  if (showLoading) setLoading(true)
  setError('')

  try {
    setDiaries(await fetchDiaries())
  } catch (error) {
    setError(getErrorMessage(error))
  } finally {
    if (showLoading) setLoading(false)
  }
}

function App() {
  const [diaries, setDiaries] = useState([])
  const [content, setContent] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState('calm')
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void refreshDiaryList(setDiaries, setError, setLoading, true)
  }, [])

  const filteredDiaries =
    activeFilter === 'all'
      ? diaries
      : diaries.filter((diary) => diary.emotion === activeFilter)

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedContent = content.trim()
    if (!trimmedContent || saving) return

    setSaving(true)
    setError('')

    try {
      await createDiary({ content: trimmedContent, emotion: selectedEmotion })
      setContent('')
      setActiveFilter('all')
      await refreshDiaryList(setDiaries, setError, setLoading)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(diary) {
    const emotion = emotions.find((item) => item.id === diary.emotion)
    const confirmed = window.confirm(
      `${emotion?.label ?? '이'} 일기를 삭제할까요? 삭제 후에는 복구할 수 없습니다.`,
    )
    if (!confirmed || deletingId !== null) return

    setDeletingId(diary.id)
    setError('')

    try {
      await deleteDiary(diary.id)
      await refreshDiaryList(setDiaries, setError, setLoading)
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setDeletingId(null)
    }
  }

  const selectedEmotionDetails = emotions.find((item) => item.id === selectedEmotion)

  return (
    <div className="page-pattern min-h-screen bg-paper text-ink">
      <header className="border-b border-line/80 bg-paper/90">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <a className="flex items-center gap-3 text-ink no-underline" href="#top">
            <span className="grid size-10 place-items-center rounded-lg bg-leaf text-xl text-white" aria-hidden="true">
              ✳
            </span>
            <span className="font-display text-xl font-semibold">마음 기록</span>
          </a>
          <div className="text-right">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted">MY DAILY JOURNAL</p>
            <p className="mt-1 text-sm text-ink">{todayLabel}</p>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1240px] px-5 pb-12 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        <div className="enter-view grid items-start gap-10 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
          <section aria-labelledby="composer-title" className="lg:sticky lg:top-8">
            <div className="mb-6">
              <p className="text-sm font-semibold text-leaf">오늘의 마음을 천천히</p>
              <h1 id="composer-title" className="mt-2 font-display text-[38px] font-medium leading-[1.08] sm:text-[44px]">
                마음이 머문 자리
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                지금 느끼는 감정과 생각을 있는 그대로 적어보세요.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-white/90 p-5 shadow-[0_12px_34px_rgba(30,48,45,0.06)] sm:p-6">
              <fieldset>
                <legend className="text-sm font-semibold">지금 내 기분은</legend>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {emotions.map((emotion) => {
                    const selected = selectedEmotion === emotion.id
                    return (
                      <button
                        key={emotion.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedEmotion(emotion.id)}
                        className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-md border px-1 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${selected ? 'border-leaf bg-[#edf6f1] ring-2 ring-leaf/15' : 'border-line bg-white hover:border-leaf/50 hover:bg-paper'}`}
                      >
                        <span className="text-[25px] leading-none" aria-hidden="true">{emotion.emoji}</span>
                        <span className={`text-xs font-medium ${selected ? 'text-leaf' : 'text-muted'}`}>{emotion.label}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label htmlFor="diary-content" className="mt-6 block text-sm font-semibold">오늘의 기록</label>
              <textarea
                id="diary-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="마음에 남은 순간이나 생각을 적어보세요..."
                maxLength={5000}
                rows={7}
                required
                className="mt-3 w-full resize-y rounded-md border border-line bg-[#fbfcfa] px-4 py-3 text-[15px] leading-7 text-ink outline-none transition placeholder:text-[#9aa8a1] focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${selectedEmotionDetails.chip}`}>
                  <span aria-hidden="true">{selectedEmotionDetails.emoji}</span>
                  {selectedEmotionDetails.label}
                </span>
                <span className="text-xs tabular-nums text-muted">{content.length} / 5000</span>
              </div>
              <button
                type="submit"
                disabled={saving || !content.trim()}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-leaf px-5 text-sm font-semibold text-white transition hover:bg-[#205e55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-[#aabbb3]"
              >
                {saving ? '저장 중...' : '일기 저장하기'}
              </button>
              <p className="mt-4 text-xs leading-5 text-muted">
                이 기록은 공개 접근이 허용된 실습용 데이터베이스에 저장됩니다. 민감한 개인정보는 적지 마세요.
              </p>
            </form>
          </section>

          <section aria-labelledby="entries-title" className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-muted">YOUR MOMENTS</p>
                <h2 id="entries-title" className="mt-1 font-display text-3xl font-medium">감정 기록</h2>
              </div>
              <p className="text-sm text-muted"><span className="font-semibold tabular-nums text-ink">{diaries.length}</span>개의 기록</p>
            </div>

            <div role="group" aria-label="감정별 기록 필터" className="mt-5 flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                aria-pressed={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${activeFilter === 'all' ? 'border-ink bg-ink text-white' : 'border-line bg-white/70 text-muted hover:border-ink/40 hover:text-ink'}`}
              >
                전체 보기
              </button>
              {emotions.map((emotion) => (
                <button
                  key={emotion.id}
                  type="button"
                  aria-pressed={activeFilter === emotion.id}
                  onClick={() => setActiveFilter(emotion.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${activeFilter === emotion.id ? 'border-ink bg-ink text-white' : 'border-line bg-white/70 text-muted hover:border-ink/40 hover:text-ink'}`}
                >
                  <span aria-hidden="true">{emotion.emoji}</span>
                  {emotion.label}
                </button>
              ))}
            </div>

            {error && (
              <div role="alert" className="mt-5 rounded-md border border-[#efc5b9] bg-[#fff3ef] px-4 py-3 text-sm leading-6 text-[#8f4438]">
                {error}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {loading ? (
                <div role="status" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-line bg-white/70 text-sm text-muted">
                  <span className="size-6 animate-spin rounded-full border-2 border-line border-t-leaf" aria-hidden="true" />
                  <span>일기를 불러오는 중...</span>
                </div>
              ) : filteredDiaries.length > 0 ? (
                filteredDiaries.map((diary) => {
                  const emotion = emotions.find((item) => item.id === diary.emotion) ?? emotions[1]
                  return (
                    <article key={diary.id} className="diary-entry rounded-lg border border-line bg-white/90 p-5 shadow-[0_5px_18px_rgba(30,48,45,0.035)] sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`grid size-11 shrink-0 place-items-center rounded-md text-[24px] ${emotion.chip}`} aria-hidden="true">
                            {emotion.emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{emotion.label}</p>
                            <time className="mt-1 block text-xs text-muted" dateTime={diary.created_at}>
                              {dateFormatter.format(new Date(diary.created_at))}
                            </time>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDelete(diary)}
                          disabled={deletingId !== null}
                          aria-label={`${emotion.label} 일기 삭제`}
                          className="shrink-0 rounded px-2 py-1 text-sm text-muted transition hover:bg-[#fff0ed] hover:text-[#aa493c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aa493c] disabled:cursor-wait disabled:opacity-50"
                        >
                          {deletingId === diary.id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-[#33423e]">{diary.content}</p>
                    </article>
                  )
                })
              ) : (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white/50 px-6 text-center">
                  <span className="text-3xl" aria-hidden="true">{activeFilter === 'all' ? '✍️' : emotions.find((item) => item.id === activeFilter)?.emoji}</span>
                  <p className="mt-3 text-sm font-semibold text-ink">
                    {error
                      ? '연결이 되면 기록을 불러올 수 있어요.'
                      : activeFilter === 'all'
                        ? '아직 작성된 일기가 없어요.'
                        : `${emotions.find((item) => item.id === activeFilter)?.label} 기록이 아직 없어요.`}
                  </p>
                  {!error && activeFilter === 'all' && (
                    <p className="mt-1 text-sm text-muted">왼쪽에서 오늘의 첫 마음을 남겨보세요.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
