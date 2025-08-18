# pm2 start npm --name "web" -- start -- --host 0.0.0.0

#!/bin/bash

DIST_DIR="./dist"

echo "=============================="
read -p "의존성(npm install)을 재설치하시겠습니까? (y/n): " reinstall

if [[ "$reinstall" == "y" || "$reinstall" == "Y" ]]; then
  echo "🔁 의존성 및 dist 초기화 중..."
  rm -rf node_modules package-lock.json "$DIST_DIR"
  echo "📦 npm install 시작..."
  npm install
else
  echo "🧹 기존 dist 삭제 중..."
  rm -rf "$DIST_DIR"
fi

echo "=============================="
echo "⚙️ Angular 프로덕션 빌드 시작..."
ng build --configuration production --verbose

if [ $? -ne 0 ]; then
  echo "❌ 빌드 실패. 오류 확인 필요."
  exit 1
fi

echo "=============================="
echo "✅ Angular 빌드 완료: Nginx에서 자동 반영됩니다."
echo "🔗 접속 URL: http://<서버IP 또는 도메인>"
