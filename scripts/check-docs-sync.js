const fs = require('fs');
const path = require('path');

// Files to check
const SCHEMA_FILE = 'prisma/schema.prisma';
const ACTIONS_FILE = 'src/lib/actions.ts';

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
    const modelNames = models.map(m => m.replace('model ', '').replace(' {', ''));
    console.log('Models:', modelNames.join(', '));

    return { count: modelCount, names: modelNames };
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

    const functionNames = exportedFunctions.map(f => f.replace('export async function ', ''));
    console.log(`Functions: ${functionCount} total`);

    return { count: functionCount, names: functionNames };
}

function checkLastUpdate() {
    console.log(`\n📅 Documentation Last Modified:`);

    const updates = {};
    Object.entries(DOCS).forEach(([name, file]) => {
        if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            const date = stats.mtime.toISOString().split('T')[0];
            console.log(`  ${name.padEnd(12)}: ${date}`);
            updates[name] = date;
        } else {
            console.log(`  ${name.padEnd(12)}: ❌ Not found`);
        }
    });

    return updates;
}

function checkPagesSync() {
    const dashboardDir = 'src/app/dashboard';
    if (!fs.existsSync(dashboardDir)) {
        console.log('\n⚠️  Dashboard directory not found');
        return { count: 0, pages: [] };
    }

    const pages = [];

    function findPages(dir) {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                findPages(fullPath);
            } else if (item === 'page.tsx') {
                const relativePath = fullPath.replace('src/app/dashboard/', '').replace('/page.tsx', '');
                pages.push(relativePath || 'home');
            }
        });
    }

    findPages(dashboardDir);

    console.log(`\n📄 Dashboard Pages: ${pages.length} found`);
    console.log('Pages:', pages.join(', '));

    return { count: pages.length, pages };
}

function generateReport() {
    const schema = checkSchemaSync();
    const actions = checkActionsSync();
    const pages = checkPagesSync();
    const updates = checkLastUpdate();

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary Report:');
    console.log(`  Database Models: ${schema.count}`);
    console.log(`  Server Actions: ${actions.count}`);
    console.log(`  Dashboard Pages: ${pages.count}`);
    console.log(`  Documentation Files: ${Object.keys(updates).length}`);

    console.log('\n💡 Recommendations:');

    // Check if docs are outdated (more than 7 days old)
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    Object.entries(updates).forEach(([name, date]) => {
        const docDate = new Date(date);
        if (docDate < weekAgo) {
            console.log(`  ⚠️  ${DOCS[name]} hasn't been updated in over a week`);
        }
    });

    console.log('\n✅ Next Steps:');
    console.log('  1. Review warnings above');
    console.log('  2. Update outdated documentation');
    console.log('  3. Run this script again to verify');
    console.log('  4. Commit documentation updates with code changes');
}

function main() {
    console.log('🔍 Al-Ahlam System - Documentation Sync Check');
    console.log('='.repeat(60));

    try {
        generateReport();

        console.log('\n' + '='.repeat(60));
        console.log('\n📝 For update guidelines, see: .agent/DOC_UPDATE_GUIDE.md\n');
    } catch (error) {
        console.error('\n❌ Error running sync check:', error.message);
        process.exit(1);
    }
}

main();
