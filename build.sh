#!/bin/bash

echo "⚙️ Angular 프로덕션 빌드 시작..."
ng build --configuration production --verbose
if [ $? -ne 0 ]; then
  echo "❌ 빌드 실패. 오류 확인 필요."
  exit 1
fi

echo "=============================="
echo "✅ Angular 빌드 완료: Nginx에서 자동 반영됩니다."
echo "🔗 접속 URL: http://<서버IP 또는 도메인>""
