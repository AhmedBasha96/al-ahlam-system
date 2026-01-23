# Documentation Auto-Update System
# نظام التحديث التلقائي للوثائق

## 🎯 Overview

This system ensures that documentation stays synchronized with code changes through automated checks and update guidelines.

## 📋 Documentation Files to Maintain

### Core Documentation
- `README.md` - Quick start and overview
- `BUSINESS_REQUIREMENTS.md` - Business logic and workflows
- `TECHNICAL_DOCUMENTATION.md` - Technical architecture

### AI Agent Files
- `.agent/CONTEXT.md` - System context and quick reference
- `.agent/CODING_GUIDELINES.md` - Coding standards
- `.agent/COMMON_TASKS.md` - Task guides

## 🔄 Auto-Update Triggers

### When to Update Documentation

| Change Type | Files to Update | Priority |
|------------|-----------------|----------|
| **New Database Model** | `TECHNICAL_DOCUMENTATION.md` (Database Schema), `.agent/CONTEXT.md` (Database Models) | 🔴 High |
| **New Server Action** | `TECHNICAL_DOCUMENTATION.md` (API), `.agent/COMMON_TASKS.md` (if common task) | 🟡 Medium |
| **New User Role** | `BUSINESS_REQUIREMENTS.md` (Roles), `.agent/CONTEXT.md` (User Roles), `TECHNICAL_DOCUMENTATION.md` | 🔴 High |
| **New Feature/Page** | `README.md` (Features), `BUSINESS_REQUIREMENTS.md` (Features), `.agent/CONTEXT.md` | 🟡 Medium |
| **New Workflow** | `BUSINESS_REQUIREMENTS.md` (Workflows), `.agent/COMMON_TASKS.md` | 🟡 Medium |
| **Tech Stack Change** | `README.md`, `TECHNICAL_DOCUMENTATION.md`, `.agent/CONTEXT.md` | 🔴 High |
| **Security Change** | `TECHNICAL_DOCUMENTATION.md` (Security), `.agent/CODING_GUIDELINES.md` | 🔴 High |
| **UI Pattern Change** | `TECHNICAL_DOCUMENTATION.md` (UI Patterns), `.agent/CODING_GUIDELINES.md` | 🟢 Low |

## 📝 Update Checklist

### For Database Schema Changes (`prisma/schema.prisma`)

```markdown
- [ ] Update TECHNICAL_DOCUMENTATION.md → Database Schema section
- [ ] Update .agent/CONTEXT.md → Database Models section
- [ ] If new model: Add to entity relationship diagram
- [ ] If new enum: Document in both files
- [ ] Update model count if changed
```

### For New Server Actions (`src/lib/actions.ts`)

```markdown
- [ ] Update TECHNICAL_DOCUMENTATION.md → Server Actions API section
- [ ] If common operation: Add to .agent/COMMON_TASKS.md
- [ ] Update function count in documentation
- [ ] Add TypeScript signature to API docs
```

### For New Features/Pages

```markdown
- [ ] Update README.md → Features section
- [ ] Update BUSINESS_REQUIREMENTS.md → Features section
- [ ] Update .agent/CONTEXT.md → Key Directories (if new directory)
- [ ] Add workflow if applicable to BUSINESS_REQUIREMENTS.md
- [ ] Add task guide to .agent/COMMON_TASKS.md if common
```

### For User Role Changes

```markdown
- [ ] Update BUSINESS_REQUIREMENTS.md → User Roles section
- [ ] Update .agent/CONTEXT.md → User Roles section
- [ ] Update TECHNICAL_DOCUMENTATION.md → Authentication section
- [ ] Update README.md → User Roles table
```

## 🤖 Automated Documentation Update Script

Create a script that checks for documentation updates needed:

### Script: `scripts/check-docs-sync.js`

```javascript
const fs = require('fs');
const path = require('path');

// Files to check
const SCHEMA_FILE = 'prisma/schema.prisma';
const ACTIONS_FILE = 'src/lib/actions.ts';
const DOCS_DIR = '.';

// Documentation files
const DOCS = {
  README: 'README.md',
  BUSINESS: 'BUSINESS_REQUIREMENTS.md',
  TECHNICAL: 'TECHNICAL_DOCUMENTATION.md',
  CONTEXT: '.agent/CONTEXT.md',
  GUIDELINES: '.agent/CODING_GUIDELINES.md',
  TASKS: '.agent/COMMON_TASKS.md'
};

function checkSchemaSync() {
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  const models = schemaContent.match(/model \w+ {/g) || [];
  const modelCount = models.length;
  
  const technicalDoc = fs.readFileSync(DOCS.TECHNICAL, 'utf-8');
  const contextDoc = fs.readFileSync(DOCS.CONTEXT, 'utf-8');
  
  console.log(`\n📊 Database Models: ${modelCount} found in schema`);
  
  // Check if count matches in docs
  const techModelMention = technicalDoc.match(/(\d+) models/i);
  const contextModelMention = contextDoc.match(/(\d+) total/i);
  
  if (techModelMention && parseInt(techModelMention[1]) !== modelCount) {
    console.log(`⚠️  TECHNICAL_DOCUMENTATION.md shows ${techModelMention[1]} models, but schema has ${modelCount}`);
  }
  
  if (contextModelMention && parseInt(contextModelMention[1]) !== modelCount) {
    console.log(`⚠️  CONTEXT.md shows ${contextModelMention[1]} models, but schema has ${modelCount}`);
  }
  
  // List models
  console.log('Models:', models.map(m => m.replace('model ', '').replace(' {', '')).join(', '));
}

function checkActionsSync() {
  const actionsContent = fs.readFileSync(ACTIONS_FILE, 'utf-8');
  const exportedFunctions = actionsContent.match(/export async function \w+/g) || [];
  const functionCount = exportedFunctions.length;
  
  console.log(`\n🔧 Server Actions: ${functionCount} exported functions found`);
  
  const technicalDoc = fs.readFileSync(DOCS.TECHNICAL, 'utf-8');
  const actionMention = technicalDoc.match(/(\d+)\+ server action/i);
  
  if (actionMention && parseInt(actionMention[1]) < functionCount - 5) {
    console.log(`⚠️  TECHNICAL_DOCUMENTATION.md shows ${actionMention[1]}+ actions, but ${functionCount} found`);
  }
  
  console.log(`Functions: ${functionCount} total`);
}

function checkLastUpdate() {
  console.log(`\n📅 Documentation Last Modified:`);
  
  Object.entries(DOCS).forEach(([name, file]) => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const date = stats.mtime.toISOString().split('T')[0];
      console.log(`  ${name.padEnd(12)}: ${date}`);
    }
  });
}

function main() {
  console.log('🔍 Checking Documentation Synchronization...\n');
  console.log('='.repeat(50));
  
  checkSchemaSync();
  checkActionsSync();
  checkLastUpdate();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n💡 Tip: Run this script before committing changes');
  console.log('📝 Update docs manually based on warnings above\n');
}

main();
```

## 🔧 Git Hooks for Documentation

### Pre-commit Hook (`.git/hooks/pre-commit`)

```bash
#!/bin/sh

echo "🔍 Checking for documentation updates needed..."

# Check if schema changed
if git diff --cached --name-only | grep -q "prisma/schema.prisma"; then
  echo "⚠️  Database schema changed!"
  echo "📝 Please update:"
  echo "   - TECHNICAL_DOCUMENTATION.md (Database Schema)"
  echo "   - .agent/CONTEXT.md (Database Models)"
  echo ""
fi

# Check if actions changed
if git diff --cached --name-only | grep -q "src/lib/actions.ts"; then
  echo "⚠️  Server actions changed!"
  echo "📝 Please update:"
  echo "   - TECHNICAL_DOCUMENTATION.md (Server Actions API)"
  echo "   - .agent/COMMON_TASKS.md (if new common task)"
  echo ""
fi

# Check if new pages added
if git diff --cached --name-only | grep -q "src/app/.*page.tsx"; then
  echo "⚠️  Pages changed!"
  echo "📝 Please update:"
  echo "   - README.md (Features)"
  echo "   - BUSINESS_REQUIREMENTS.md (if new feature)"
  echo ""
fi

# Run documentation sync check
if command -v node &> /dev/null; then
  node scripts/check-docs-sync.js
fi

echo ""
read -p "Have you updated the documentation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Commit aborted. Please update documentation first."
  exit 1
fi
```

## 📋 Documentation Update Workflow

### Step-by-Step Process

1. **Make Code Changes**
   - Modify code as needed
   - Note what type of change it is

2. **Run Documentation Check**
   ```bash
   node scripts/check-docs-sync.js
   ```

3. **Update Relevant Documentation**
   - Follow the update checklist above
   - Update version numbers if needed
   - Update "Last Updated" dates

4. **Verify Updates**
   - Re-run documentation check
   - Review changed documentation files
   - Ensure consistency across all docs

5. **Commit Changes**
   - Commit code and documentation together
   - Use descriptive commit message mentioning doc updates

## 🎯 Quick Update Templates

### Adding a New Model

**Files to update:**
1. `TECHNICAL_DOCUMENTATION.md`
   ```markdown
   ### X. **ModelName** (الاسم بالعربية)
   ```prisma
   model ModelName {
     // schema
   }
   ```
   ```

2. `.agent/CONTEXT.md`
   ```markdown
   X. **ModelName** - Description
   ```

### Adding a New Server Action

**Files to update:**
1. `TECHNICAL_DOCUMENTATION.md`
   ```markdown
   ### Category Actions
   ```typescript
   actionName(params) → ReturnType
   ```
   ```

2. `.agent/COMMON_TASKS.md` (if common task)
   ```markdown
   ## 📦 Task Name
   
   ### Steps:
   1. ...
   
   ### Code Example:
   ```typescript
   // code
   ```
   ```

## 🔔 Reminders for AI Agents

When making changes, AI agents should:

1. ✅ **Identify** what type of change is being made
2. ✅ **Check** the update triggers table above
3. ✅ **Update** all relevant documentation files
4. ✅ **Verify** consistency across all docs
5. ✅ **Update** "Last Updated" dates

### Auto-Update Prompt for AI Agents

```
When making changes to the codebase, always:
1. Check .agent/DOC_UPDATE_GUIDE.md for update requirements
2. Update all relevant documentation files
3. Maintain consistency across README, BUSINESS_REQUIREMENTS, TECHNICAL_DOCUMENTATION, and .agent files
4. Update version numbers and dates
5. Run scripts/check-docs-sync.js to verify
```

## 📊 Documentation Health Metrics

Track these metrics to ensure docs stay current:

- **Model Count Accuracy**: Schema models = Documented models
- **Action Count Accuracy**: Exported functions ≈ Documented actions
- **Last Update Recency**: All docs updated within last 30 days of code changes
- **Consistency Score**: Same information across all relevant docs

## 🚀 Future Enhancements

Potential improvements:
- [ ] Automated doc generation from code comments
- [ ] CI/CD integration for doc checks
- [ ] Automated changelog generation
- [ ] Documentation coverage reports
- [ ] Auto-update version numbers

---

**Created**: January 2026  
**Last Updated**: January 2026
