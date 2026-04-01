# Epic 06: 마일스톤 기반 문서 구조 개편

> **원칙 (B안)**: 루트 = 항상 현재 최신 버전. 마일스톤 폴더 = 과거 버전 스냅샷.
> PRD/TRD/UI 스펙 변경 시 기존 루트 파일을 마일스톤 폴더에 복사한 뒤 루트를 업데이트한다.
> 에이전트는 항상 루트 파일(prd.md, docs/ui-spec.md 등)을 읽으면 현재 버전을 얻는다.

---

## 목표 구조

```
prd.md                        ← 루트 = 항상 현재 (v0.3+)
trd.md                        ← 루트 = 항상 현재
docs/
  ui-spec.md                  ← 루트 = 항상 현재 (v0.3 내용)
  game-logic.md               ← 루트 = 항상 현재
  milestones/
    v01/                      ← Epic 01~04 기준 스냅샷
      prd.md                  ✅ 완료 (git 히스토리 복원)
      trd.md                  ✅ 완료 (git 히스토리 복원)
      ui-spec.md              ✅ 완료
      epics/
        epic-01-game-core/    ✅ 완료
        epic-02-backend/      ✅ 완료
        epic-03-ads/          ✅ 완료
        epic-04-screens/      ✅ 완료
    v03/                      ← Epic 05~06 기준 스냅샷
      prd.md                  ✅ 완료
      trd.md                  ✅ 완료
      ui-spec.md              ✅ 완료
      game-logic.md           ✅ 완료
      epics/
        epic-05-mechanic-v03/ ✅ 완료
        epic-06-milestone-docs/ ✅ 완료
```

---

## Story 19: 마일스톤 폴더 생성 및 스냅샷 보관

- [x] `docs/milestones/v01/prd.md` — v0.1 스냅샷 (git 히스토리 복원)
- [x] `docs/milestones/v01/trd.md` — v0.1 스냅샷 (git 히스토리 복원)
- [x] `docs/milestones/v01/ui-spec.md` — v0.1 UI 스펙 스냅샷
- [x] `docs/milestones/v03/prd.md` — v0.3 스냅샷
- [x] `docs/milestones/v03/trd.md` — v0.3 스냅샷
- [x] `docs/milestones/v03/ui-spec.md` — v0.3 UI 스펙 스냅샷
- [x] `docs/milestones/v03/game-logic.md` — v0.3 게임 로직 스냅샷
- [x] 루트 `docs/ui-spec.md` → v0.3 내용으로 교체 (B안: 루트 = 현재)
- [x] `docs/ui-spec-v03.md` 삭제 (마일스톤으로 이전 완료)

---

## Story 20: 에픽 폴더 마일스톤 이동

- [x] Epic 01~04 → `docs/milestones/v01/epics/`
- [x] Epic 05~06 → `docs/milestones/v03/epics/`
- [x] `docs/epics/` 폴더 삭제 (마일스톤으로 이전 완료)
- [x] `backlog.md` 링크 경로 업데이트
- [x] `CLAUDE.md` 모듈 테이블 + 문서 테이블 경로 업데이트

---

## Story 21: 참조 경로 정리

- [x] `CLAUDE.md` "현재 마일스톤" 섹션: 마일스톤 구조 및 B안 운영 원칙 명시
- [x] Epic 05 impl `17-combo-ui.md`, `18-result-update.md`: 참고 문서 경로 `docs/ui-spec.md`로 정규화

