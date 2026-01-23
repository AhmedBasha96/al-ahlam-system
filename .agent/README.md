# AI Agent Helper Files
# ملفات مساعدة للوكلاء الذكاء الاصطناعي

This directory contains documentation specifically designed to help AI agents understand and work with the Al-Ahlam Commercial Agencies Management System codebase.

## 📚 Files Overview

### 1. [CONTEXT.md](./CONTEXT.md)
**Quick System Context & Reference**

Essential information for understanding the system:
- System purpose and tech stack
- Database models and key concepts
- User roles and permissions
- Common conventions and patterns
- Quick reference for frequent operations
- Demo accounts

**Use this when**: You need a quick overview or reference while working on any task.

---

### 2. [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
**Coding Standards & Best Practices**

Detailed guidelines for writing code:
- Naming conventions
- Architecture patterns (Server Actions, Pages, Modals)
- Database operation patterns
- UI/Styling guidelines
- Security patterns
- Error handling
- Testing checklist

**Use this when**: Writing new code or modifying existing code to ensure consistency.

---

### 3. [COMMON_TASKS.md](./COMMON_TASKS.md)
**Step-by-Step Task Guides**

Practical guides for frequent operations:
- Adding products, agencies, users, customers
- Stock supply and management
- Loading stock to representatives
- Performing representative audits
- Viewing reports
- Modifying database schema
- Debugging common issues

**Use this when**: Implementing specific features or fixing issues.

---

### 4. [DOC_UPDATE_GUIDE.md](./DOC_UPDATE_GUIDE.md)
**Documentation Auto-Update System**

Guidelines for keeping documentation synchronized:
- Update triggers and checklists
- Automated sync check script
- Git hooks for documentation
- Update workflow and templates
- Documentation health metrics

**Use this when**: Making changes to ensure docs stay current.

---

## 🎯 How to Use These Files

### For New AI Agents
1. **Start with** [CONTEXT.md](./CONTEXT.md) to understand the system
2. **Review** [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) for coding standards
3. **Reference** [COMMON_TASKS.md](./COMMON_TASKS.md) for specific implementations

### For Specific Tasks
- **Bug fixing**: Check COMMON_TASKS.md debugging section
- **New feature**: Review CODING_GUIDELINES.md patterns
- **Understanding code**: Use CONTEXT.md for quick reference
- **Database changes**: See COMMON_TASKS.md schema modification

### Quick Lookup
- **User roles**: CONTEXT.md → User Roles section
- **Database models**: CONTEXT.md → Database Models section
- **Server actions**: CODING_GUIDELINES.md → Server Actions Pattern
- **Stock operations**: COMMON_TASKS.md → Stock-related tasks

---

## 📖 Additional Documentation

For comprehensive documentation, see:
- **[../README.md](../README.md)** - Quick start and overview
- **[../BUSINESS_REQUIREMENTS.md](../BUSINESS_REQUIREMENTS.md)** - Business logic and workflows
- **[../TECHNICAL_DOCUMENTATION.md](../TECHNICAL_DOCUMENTATION.md)** - Full technical architecture

---

## 🔑 Key Reminders

### Always Remember:
1. ✅ **Arabic First** - All UI text must be in Arabic
2. ✅ **Transactions** - Use database transactions for stock operations
3. ✅ **Permissions** - Check user permissions in server actions
4. ✅ **Revalidation** - Call `revalidatePath()` after mutations
5. ✅ **Virtual Warehouses** - Sales reps have warehouse ID = user ID

### Common Pitfalls:
1. ❌ Forgetting to use transactions for stock changes
2. ❌ Not checking permissions before operations
3. ❌ Missing revalidation after data changes
4. ❌ Using English text in UI
5. ❌ Not validating stock quantities before operations

---

## 🚀 Quick Start for AI Agents

```typescript
// 1. Get current user
const user = await getCurrentUser();

// 2. Check permissions
if (user.role !== 'ADMIN') throw new Error('Unauthorized');

// 3. Perform operation with transaction
await prisma.$transaction(async (tx) => {
  // Your operations here
});

// 4. Revalidate
revalidatePath('/dashboard/page');
```

---

## 📝 File Structure

```
.agent/
├── README.md              # This file
├── CONTEXT.md             # System context & quick reference
├── CODING_GUIDELINES.md   # Coding standards & patterns
├── COMMON_TASKS.md        # Task-specific guides
└── DOC_UPDATE_GUIDE.md    # Documentation auto-update system
```

---

## 🔄 Keeping Files Updated

These files should be updated when:
- New features are added
- Architecture patterns change
- Common issues are discovered
- Best practices evolve

---

**Created**: January 2026  
**Last Updated**: January 2026  
**Maintained by**: Development Team
