# web1

## HVAC Ops Risk Triage MVP

`ops_dashboard.html`은 HVAC 제조 운영에서 작업(Job) 위험도를 rule-based로 점수화하는 데모 도구입니다.

### 실행
- 브라우저에서 `ops_dashboard.html` 열기
- 또는 간단 서버 실행: `python -m http.server 8000`

### 테스트
```bash
node ops-risk.test.js
```

### 입력 CSV 필드
- `job_id`
- `part_num`
- `due_date`
- `qty_required`
- `qty_on_hand`
- `supplier_confirmed` (`yes/no`)
- `engineering_ready` (`yes/no`)
- `work_center_load` (퍼센트)

### 출력
- 리스크 점수(0~100)
- 리스크 밴드(RED/AMBER/GREEN)
- 부족 수량
- 설명 가능한 사유(reasons)
- CSV 다운로드
