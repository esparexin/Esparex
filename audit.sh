#!/bin/bash
echo "======================================"
echo "ESPAREX CODEBASE AUDIT"
echo "Run date: $(date)"
echo "======================================"

echo ""
echo "=== 1. FILE COUNTS ==="
echo "Backend ts/js files:"
find backend -type f \( -name "*.ts" -o -name "*.js" \) ! -path "*/node_modules/*" | wc -l
echo "User frontend files:"
find user_frontend -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" 2>/dev/null | wc -l
echo "Admin frontend files:"
find admin_frontend -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" 2>/dev/null | wc -l
echo "Shared files:"
find shared -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" 2>/dev/null | wc -l

echo ""
echo "=== 2. LEGACY / BACKUP FILENAMES ==="
find . -type f \( -name "*_old*" -o -name "*_v2*" -o -name "*_new*" \
  -o -name "*_backup*" -o -name "*_copy*" -o -name "*_temp*" \
  -o -name "*.bak" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" | sort

echo ""
echo "=== 3. DUPLICATE FILENAMES ACROSS FOLDERS ==="
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" \
  ! -path "*/dist/*" ! -path "*/.next/*" \
  -exec basename {} \; | sort | uniq -d

echo ""
echo "=== 4. FIELD NAMING — userId vs user_id ==="
echo "-- Files using userId (camelCase):"
grep -rl "userId" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null | grep -v "\.d\.ts" | sort

echo "-- Files using user_id (snake_case):"
grep -rl "user_id" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null | grep -v "\.d\.ts" | sort

echo ""
echo "=== 5. FIELD NAMING — listingType vs listing_type ==="
echo "-- Files using listingType:"
grep -rl "listingType" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null | sort

echo "-- Files using listing_type:"
grep -rl "listing_type" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null | sort

echo ""
echo "=== 6. FIELD NAMING — brandId vs brand_id ==="
echo "-- Files using brandId:"
grep -rl "brandId" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null | sort

echo "-- Files using brand_id:"
grep -rl "brand_id" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null | sort

echo ""
echo "=== 7. FIELD NAMING — categoryId vs category_id ==="
echo "-- Files using categoryId:"
grep -rl "categoryId" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null | sort

echo "-- Files using category_id:"
grep -rl "category_id" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null | sort

echo ""
echo "=== 8. DIRECT FETCH IN COMPONENT FILES ==="
grep -rl "fetch(" \
  --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null \
  | grep -v "hooks\|services\|api\|lib\|utils" | sort

echo ""
echo "=== 9. DEEP RELATIVE IMPORTS (3+ levels) ==="
grep -rn "\.\./\.\./\.\." \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null | head -60

echo ""
echo "=== 10. TODO / FIXME / LEGACY COMMENTS ==="
grep -rn "TODO\|FIXME\|HACK\|LEGACY\|@deprecated\|// old\|// unused" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=dist --exclude-dir=.next . 2>/dev/null \
  | grep -v "\.d\.ts" | sort

echo ""
echo "=== 11. ALL ROUTE FILES ==="
find backend -name "*.routes.ts" -o -name "*.routes.js" \
  -o -name "*Routes.ts" -o -name "*Routes.js" \
  -o -name "*router.ts" -o -name "*router.js" 2>/dev/null \
  ! -path "*/node_modules/*" | sort

echo ""
echo "=== 12. ALL CONTROLLER FILES ==="
find backend -name "*controller*" -o -name "*Controller*" 2>/dev/null \
  ! -path "*/node_modules/*" | sort

echo ""
echo "=== 13. ALL SERVICE FILES ==="
find backend -name "*service*" -o -name "*Service*" 2>/dev/null \
  ! -path "*/node_modules/*" | sort

echo ""
echo "=== 14. ALL HOOK FILES ==="
find . -name "use*.ts" -o -name "use*.tsx" 2>/dev/null \
  ! -path "*/node_modules/*" ! -path "*/.git/*" | sort

echo ""
echo "=== 15. COMPONENT FILENAME vs EXPORT MISMATCH CHECK ==="
echo "(Files whose name starts lowercase but likely export PascalCase)"
find . -type f \( -name "*.tsx" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/.next/*" \
  | xargs grep -l "export default" 2>/dev/null \
  | while read f; do
      base=$(basename "$f" | sed 's/\.[^.]*$//')
      first_char=$(echo "$base" | cut -c1)
      if echo "$first_char" | grep -q "[a-z]"; then
        echo "POSSIBLE MISMATCH: $f (filename starts lowercase)"
      fi
    done

echo ""
echo "======================================"
echo "AUDIT COMPLETE"
echo "File: audit-results.txt"
echo "======================================"
