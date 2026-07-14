# 공책 속 우리 반 친구 만들기

2000~2010년 초등학교 시절의 공책 낙서 감성을 담은 모바일 우선 캐릭터 조합 게임 데모입니다.

## 데모 흐름

1. 남학생 모습, 여학생 모습 또는 모든 파츠 랜덤 모드 선택
2. 얼굴 → 눈 → 코 → 입 → 머리 순서로 멈춤 버튼 5번 누르기
3. 완성된 캐릭터와 닮은 친구 이름 입력
4. 1080×1080 PNG 친구 카드 다운로드

친구 이름은 서버나 `localStorage`에 저장되지 않으며 다운로드 이미지에만 합성됩니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 검증

```bash
npm test
npm run test:e2e
npm run build
npm run preview
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 Vite 빌드 결과를 GitHub Pages에 배포합니다.

- 저장소: `lifedesigner88/ep_youthfestival`
- 배포 URL: `https://lifedesigner88.github.io/ep_youthfestival/`

## 글꼴

친구 이름에는 Google Fonts의 **Nanum Pen Script**를 자체 호스팅해 사용합니다. 글꼴 라이선스는 `src/assets/fonts/OFL.txt`에서 확인할 수 있습니다.
