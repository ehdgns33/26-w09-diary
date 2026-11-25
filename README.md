# 감정 일기

하루의 감정과 생각을 기록하고, Supabase에 저장된 기록을 기기와 브라우저에 관계없이 확인하는 반응형 웹앱입니다. 감정별 필터, 최신순 목록, 삭제 확인을 지원합니다.

## 실행 방법

1. Supabase 프로젝트에 `guide.md`의 `diaries` 테이블과 RLS 정책을 설정합니다.
2. 프로젝트 루트에 `.env.local` 파일을 만들고 다음 값을 입력합니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

3. 의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

검증은 `npm run lint`와 `npm run build`로 실행합니다.

## 저장 및 보안

일기 본문, 감정, 자동 생성 ID와 작성 시각은 Supabase `diaries` 테이블에 저장됩니다. 따라서 같은 Supabase 프로젝트를 사용하는 기기에서는 새로고침 후 동일한 기록을 조회할 수 있습니다. 앱은 저장·삭제 뒤 목록을 다시 가져오며 Realtime 구독은 사용하지 않습니다.

`.env.local`은 Git에 커밋하지 않습니다. 브라우저 앱에서 사용하는 publishable key는 사용자에게 노출되는 공개 키이며, 비밀 키나 `service_role` 키를 프론트엔드에 넣으면 안 됩니다. 이 실습의 anon RLS 정책은 누구나 기록을 읽고 추가하고 삭제할 수 있게 하므로, 데이터는 비공개가 아닙니다. 실제 개인 일기 서비스로 배포하기 전에는 인증과 사용자별 RLS 정책을 적용해야 합니다.

자세한 데이터베이스 설정은 [guide.md](./guide.md)를 참고하세요.
