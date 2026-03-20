# Safe File Move / Rename Prompt

You are moving or renaming a file in the Esparex marketplace
platform. Follow every step exactly. Do not skip any step.
Do not move more than one file per session.

PROJECT: /Users/admin/Desktop/EsparexAdmin
CONVENTION: camelCase fields, PascalCase components,
            camelCase hooks starting with "use"
BUILD CMD: cd /Users/admin/Desktop/EsparexAdmin/frontend
           && npm run build

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE TO MOVE / RENAME:
[paste the source path and destination path here]

FROM: [old path]
TO:   [new path]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — READ THE ENTIRE SOURCE FILE
Read the complete file before touching anything.
List every:
  - Import it uses
  - Type it exports
  - Function it exports
  - Interface it exports

STEP 2 — FIND EVERY FILE THAT IMPORTS FROM THE OLD PATH
Search the entire codebase for all import patterns:
  from '@/old/path'
  from '../old/path'
  from '../../old/path'
  from './old/path'
  require('./old/path')

List every importer file with its current import line.
If zero files import it — state that clearly.

STEP 3 — CHECK FOR STUB FILES AT OLD LOCATION
Search for any previously created stub at the old path.
If a stub exists — read it and note its content.
The stub will be deleted in Step 6.

STEP 4 — CREATE THE NEW FILE WITH COMPLETE CONTENT
Copy the FULL content of the source file to the new path.
Rules:
  - Do NOT create a stub
  - Do NOT simplify or remove any logic
  - Do NOT change any function signatures
  - Do NOT change any exported types
  - The new file must be 100% identical to the source
    except for relative import paths inside it that
    need updating to reflect the new location

STEP 5 — FIX RELATIVE IMPORTS INSIDE THE MOVED FILE
If the moved file uses relative imports like:
  from '../something'
  from '../../something'
Update these paths to be correct from the new location.
Do NOT change @/ alias imports — they stay identical.

STEP 6 — UPDATE EVERY IMPORTER
For every file found in Step 2:
  Replace the old import path with the new path.
  Show each change:
    BEFORE: import X from '@/old/path/file'
    AFTER:  import X from '@/new/path/file'

STEP 7 — DELETE THE OLD FILE AND EMPTY FOLDERS
Delete the original source file.
If the original folder is now empty — delete the folder.
If any stub file exists at the old path — delete it.
Confirm what was deleted.

STEP 8 — VERIFY NO OLD IMPORTS REMAIN
Search the entire codebase one final time for any
remaining reference to the old file path.
Patterns to search:
  old/path/filename
  old/path/filename.ts
  old/path/filename.tsx
If any are found — fix them before proceeding.

STEP 9 — RUN THE BUILD AND FIX ALL ERRORS
Run: cd /Users/admin/Desktop/EsparexAdmin/frontend
     && npm run build

If build PASSES:
  Show the success output.
  State: "File move complete. Build passing."
  Done.

If build FAILS:
  Read the EXACT error message.
  Fix ONLY that specific error.
  Run the build again.
  Repeat until the build passes with zero errors.
  Do not move any other files until this build is clean.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES — NEVER BREAK THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ONE FILE PER PROMPT
   Never move multiple files in one session.
   Move one file → verify build passes → come back
   for the next file. Every file moved without a
   build check is a potential cascade of 15+ errors.

2. NEVER CREATE STUBS
   A stub is a file with empty functions, TODO comments,
   useState with no setter, or useCallback(() => {}, []).
   Stubs cause type mismatches that cascade across every
   file that imports from them. The new file must always
   contain the complete real logic.

3. NEVER LEAVE OLD FILES BEHIND
   Every moved file must be deleted from its old location.
   Every empty folder left behind must be deleted.
   Stubs and old files at old paths cause "module not
   found" and type mismatch errors that are hard to trace.

4. TYPES MUST TRAVEL WITH THE FILE
   If the moved file exports types that other files import,
   those types must exist at the new location.
   Never remove or stub out exported types during a move.
   If a type no longer exists after the move, find where
   it should live and define it properly there.

5. ALWAYS VERIFY THE BUILD
   The build is the only truth. A file move is not
   complete until npm run build passes with zero errors.
   Warnings are acceptable. Errors are not.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT CAUSED PREVIOUS BUILD FAILURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
In a previous session, moving 7 hooks caused 15+ build
errors because:
  - New files were created as stubs not real content
  - Old stub files were left at old paths
  - Type exports like SmartAlertActionResult were lost
  - Import paths inside moved files were not updated
  - Build was not run after each individual file move

This prompt prevents all of those mistakes.

---

# How to use it

Every time you want to move or rename a file, paste this prompt into Cursor, fill in the FROM and TO lines, and run it. The 9 steps guarantee the build stays clean after every single move.

Save this as MOVE_FILE_PROMPT.md in your project root alongside ESPAREX_RULES.md and PROJECT_OVERVIEW.md so you always have it ready.
