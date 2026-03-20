#!/bin/bash
echo "=== Esparex Health Check ==="

echo ""
echo "1. Backend:"
HEALTH=$(curl -s http://localhost:5001/api/v1/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "   ✅ Running on port 5001"
else
  echo "   ❌ NOT running — start with: cd backend && npm run dev"
fi

echo ""
echo "2. User Frontend:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "   ✅ Running on port 3000"
else
  echo "   ❌ NOT running — start with: cd frontend && npm run dev"
fi

echo ""
echo "3. Admin Frontend:"
if curl -s http://localhost:3001 > /dev/null 2>&1; then
  echo "   ✅ Running on port 3001"
else
  echo "   ❌ NOT running — start with: cd admin-frontend && npm run dev"
fi

echo ""
echo "4. MongoDB:"
MONGO=$(mongosh "mongodb://localhost:27017/esparex_user" --quiet --eval \
  'print("ads:" + db.ads.countDocuments({status:"live"}) + " users:" + db.users.countDocuments())' 2>/dev/null)
if [ -n "$MONGO" ]; then
  echo "   ✅ Connected — $MONGO"
else
  echo "   ❌ NOT running — start with: brew services start mongodb-community@7.0"
fi

echo ""
echo "5. Redis:"
REDIS=$(redis-cli ping 2>/dev/null)
if [ "$REDIS" = "PONG" ]; then
  echo "   ✅ Running"
else
  echo "   ❌ NOT running — start with: brew services start redis"
fi

echo ""
echo "6. Admin Login Test:"
CSRF=$(curl -s -c /tmp/hc_cookies.txt http://localhost:5001/api/v1/admin/csrf-token 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null)
LOGIN=$(curl -s -c /tmp/hc_cookies.txt -b /tmp/hc_cookies.txt \
  -X POST http://localhost:5001/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"email":"admin@esparex.com","password":"Admin@123"}' 2>/dev/null)
if echo "$LOGIN" | grep -q '"success":true'; then
  echo "   ✅ Admin login works"
else
  echo "   ❌ Admin login failed"
  echo "   Response: $(echo $LOGIN | head -c 100)"
fi

echo ""
echo "8. Catalog Integrity:"
mongosh "mongodb://localhost:27017/esparex_admin" --quiet --eval '
const badParts = db.spareparts.countDocuments({categories:{$exists:true}});
const pendingParts = db.spareparts.countDocuments({status:"pending"});
const orphanBrands = db.brands.countDocuments({isActive:true, categoryId:{$exists:false}});
const inactiveCats = db.categories.countDocuments({isActive:false});

if (badParts > 0) print("   ❌ " + badParts + " spare parts use old categories field");
else print("   ✅ Spare parts field: categoryIds correct");

if (pendingParts > 0) print("   ⚠️  " + pendingParts + " spare parts pending");
else print("   ✅ All spare parts active");

if (orphanBrands > 0) print("   ⚠️  " + orphanBrands + " active brands missing categoryId");
else print("   ✅ No orphan brands");

if (inactiveCats > 0) print("   ⚠️  " + inactiveCats + " categories inactive");
else print("   ✅ All categories active");
'

echo ""
echo "9. Service Integrity:"
mongosh "mongodb://localhost:27017/esparex_user" --quiet --eval '
const total = db.services.countDocuments();
const live = db.services.countDocuments({status:"live"});
const noLocation = db.services.countDocuments({locationId:{$exists:false}});
const noQuality = db.services.countDocuments({listingQualityScore:{$exists:false}});

print("   Total services: " + total);
print("   Live services: " + live);
if (noLocation > 0) { print("   ⚠️  " + noLocation + " services missing locationId"); }
else { print("   ✅ All services have locationId"); }
if (noQuality > 0) { print("   ⚠️  " + noQuality + " services missing quality score"); }
else { print("   ✅ All services have quality score"); }
'
mongosh "mongodb://localhost:27017/esparex_admin" --quiet --eval '
const serviceTypes = db.servicetypes.countDocuments({isActive:true, isDeleted:false});
if (serviceTypes === 0) { print("   ❌ No active service types in DB — frontend will use fallbacks"); }
else { print("   ✅ " + serviceTypes + " active service types"); }
'

echo ""
echo "=== Done ==="
