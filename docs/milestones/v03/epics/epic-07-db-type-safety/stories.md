# Epic 07: DB 타입 안전성 (Schema-First 적용)

> 기술 부채 해소. DB 스키마와 TypeScript 코드 간 계약 불일치를 컴파일 타임에 감지한다.
> difficulty 컬럼 제거 누락 사건 재발 방지.

---

## Story 22: difficulty 컬럼 마이그레이션

- [x] Supabase 콘솔에서 `ALTER TABLE scores DROP COLUMN difficulty` 실행 (사람 작업)
- [x] `docs/db-schema.md` 업데이트 — difficulty 컬럼 제거

## Story 23: Supabase 타입 자동화 도입

- [ ] `npm install supabase --save-dev` (supabase CLI 설치)
- [x] `supabase gen types typescript` 스크립트를 `package.json`의 `"gen:types"`로 등록
- [x] `src/types/database.types.ts` 생성 (gen:types 실행 결과)
- [x] `useRanking.ts` INSERT payload를 생성된 타입으로 교체
- [x] `docs/db-schema.md`에 타입 자동화 워크플로우 설명 추가
