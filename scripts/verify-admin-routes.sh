#!/bin/bash
echo "=== Verifying Admin Route Contract ==="

SHARED="/Users/admin/Desktop/EsparexAdmin/shared/contracts/api/adminRoutes.ts"
BACKEND="/Users/admin/Desktop/EsparexAdmin/backend/src/routes/adminRoutes.ts"

echo ""
echo "Shared contract LOGIN path:"
grep "LOGIN:" $SHARED

echo ""
echo "Backend public router login route:"
grep "login" $BACKEND

echo ""
echo "Backend cookie path setting:"
grep "path:" /Users/admin/Desktop/EsparexAdmin/backend/src/utils/cookieHelper.ts

echo ""
echo "Admin cookie self-clear bug check:"
SELFCLEAR=$(grep -c "clearCookie.*admin_token.*getAuthCookieOptions" /Users/admin/Desktop/EsparexAdmin/backend/src/middleware/adminAuth.ts)
if [ "$SELFCLEAR" -gt "0" ]; then
  echo "❌ SELF-CLEAR BUG STILL EXISTS — requireAdmin clears its own token"
else
  echo "✅ No self-clear bug"
fi

echo ""
echo "Admin .env.local URL:"
grep "NEXT_PUBLIC_ADMIN_API_URL" /Users/admin/Desktop/EsparexAdmin/admin-frontend/.env.local

echo ""
echo "Admin isActive in DB:"
mongosh "mongodb://localhost:27017/esparex_admin" --quiet --eval \
  'db.admins.find({},{email:1,isActive:1,status:1,_id:0}).forEach(printjson)'

echo ""
echo "=== Done ==="
