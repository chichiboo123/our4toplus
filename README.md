# Photopus - AR 포토부스 🎯

얼굴 인식과 AR 기술을 활용한 어린이 친화적인 포토부스 웹 애플리케이션입니다.

## 기능

- 실시간 얼굴 인식 및 AR 오버레이
- 1컷, 2컷, 4컷 프레임 선택
- 이모지 및 사용자 업로드 토퍼 지원
- 텍스트 오버레이 추가
- 이미지 다운로드 및 클립보드 복사

## 기술 스택

- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI
- **Camera**: WebRTC, MediaPipe
- **State Management**: TanStack Query
- **Routing**: Wouter

## GitHub Pages 배포

### 1. GitHub Pages 활성화

1. GitHub 저장소로 이동
2. **Settings** → **Pages** 클릭
3. **Source**에서 "GitHub Actions" 선택

### 2. 자동 배포

코드를 `main` 또는 `master` 브랜치에 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "배포 준비"
git push origin main
```

### 3. 배포 확인

- **Actions** 탭에서 배포 진행상황 확인
- 완료 후 `https://chichiboo123.github.io/Photopus/`에서 접근 가능

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 브라우저 호환성

- Chrome/Edge (권장)
- Firefox
- Safari (iOS 11+)

> 카메라 접근을 위해 HTTPS 환경이 필요합니다.

## 라이선스

MIT License