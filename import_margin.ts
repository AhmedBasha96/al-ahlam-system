import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Importing Margin Agency and Products ---');

  // 1. Create or get the Agency
  const agency = await prisma.agency.upsert({
    where: { name: 'مارجن' },
    update: {},
    create: {
      name: 'مارجن',
      description: 'توكيل مارجن للمواد الغذائية',
    }
  });

  console.log(`Agency created/found: ${agency.name} (${agency.id})`);

  const products = [
    { name: 'ويفر شيكولاته 5 جنيه 10*6', code: 'MXWF0801', factory: 240, retail: 240, wholesale: 220.80, perBox: 60 },
    { name: 'ويفر فراوله 5 جنيه 10*6', code: 'MXWF0802', factory: 240, retail: 240, wholesale: 220.80, perBox: 60 },
    { name: 'ويفر فانيليا 5 جنيه 10*6', code: 'MXWF0803', factory: 240, retail: 240, wholesale: 220.80, perBox: 60 },
    { name: 'ويفر حلاوة بالعسل 5 جنيه 10*6', code: 'MXWF0804', factory: 240, retail: 240, wholesale: 220.80, perBox: 60 },
    { name: 'ويفر فينجرز بكريمة شوكولاتة البندق 8 أصابع 6-10', code: 'MXWF0805', factory: 240, retail: 240, wholesale: 220.80, perBox: 60 },
    { name: 'ماكسيلو ويفر فينجرز بليمون نعناع 8 أصابع 6-10', code: 'MXWF0806', factory: 240, retail: 240, wholesale: 220.80, perBox: 60 },
    { name: 'ماكسيلو ويفر فينجرز بزبدة الفول السوداني 8 أصابع 6-10', code: 'MXWF0807', factory: 240, retail: 240, wholesale: 220.80, perBox: 60 },
    
    { name: 'ويفر شيكولاته جنيه 10*4', code: 'WAMS009', factory: 340, retail: 340, wholesale: 312.80, perBox: 40 },
    { name: 'ويفر فراوله جنيه 10*4', code: 'WAMS010', factory: 340, retail: 340, wholesale: 312.80, perBox: 40 },
    { name: 'ويفر فانيليا جنيه 10*4', code: 'WAMS011', factory: 340, retail: 340, wholesale: 312.80, perBox: 40 },
    { name: 'ويفر حلاوة بالعسل جنيه 10*4', code: 'WAMS012', factory: 340, retail: 340, wholesale: 312.80, perBox: 40 },
    { name: 'ويفر فينجرز بكريمة شوكولاتة البندق 12 أصبع 4-10', code: 'MXWF1215', factory: 340, retail: 340, wholesale: 312.80, perBox: 40 },
    { name: 'ماكسيلو ويفر فينجرز بليمون نعناع 12 أصبع 4-10', code: 'MXWF1216', factory: 340, retail: 340, wholesale: 312.80, perBox: 40 },
    { name: 'ماكسيلو ويفر فينجرز بزبدة الفول السوداني 12 أصبع 4-10', code: 'MXWF1217', factory: 340, retail: 340, wholesale: 312.80, perBox: 40 },

    { name: 'ماكسيلو كيك الشيكولاتة محشو بكريمة الشيكولاتة والبندق كبير 12-8', code: 'MXCKLC34', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },
    { name: 'ماكسيلو كيك الذهبي محشو بجيلي طعم البرتقال والكريمة كبير 12-8', code: 'MXCKLG31', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },
    { name: 'ماكسيلو كيك الذهبي محشو بجيلي طعم الفراولة والكريمة كبير 12-8', code: 'MXCKLG32', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },
    { name: 'ماكسيلو كيك الذهبي المحشو بكريمة الشيكولاتة والبندق كبير 12-8', code: 'MXCKLG33', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },

    { name: 'ماكسيلو كيك الشيكولاتة المحشو بكريمة الشيكولاتة والبندق والمغطى بالشيكولاتة 8x12 XL', code: 'MXCKLC43', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },
    { name: 'ماكسيلو كيك الذهبي والمحشو بجيلي طعم البرتقال والكريمة والمغطى بالشيكولاتة 8x12 XL', code: 'MXCKLG41', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },
    { name: 'ماكسيلو كيك الذهبي والمحشو بجيلي طعم الفراولة والكريمة والمغطى بالشيكولاتة 8x12 XL', code: 'MXCKLG44', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },
    { name: 'ماكسيلو كيك الذهبي والمحشو بالكريمة البيضاء والمغطى بالشيكولاتة 8x12 XL', code: 'MXCKLG42', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },

    { name: 'ماكسيلو بسكويت سادة بالزبدة (حجم 1) ق. 6*6', code: 'MXBCPL31', factory: 300, retail: 300, wholesale: 276.00, perBox: 36 },
    { name: 'ماكسيلو بسكويت سادة بالكاكاو (حجم 1) ق. 6*6', code: 'MXBCPL32', factory: 300, retail: 300, wholesale: 276.00, perBox: 36 },
    { name: 'ماكسيلو بسكويت سادة قهوه (حجم 1) ق. 6*6', code: 'MXBCPL33', factory: 300, retail: 300, wholesale: 276.00, perBox: 36 },

    { name: 'بسكويت زبده 5 جنيه ق. 12*8', code: 'MXBCPL16', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },
    { name: 'ماكسيلو بسكويت سادة قهوه 4 جنيه ق. 12*8', code: 'MXBCPL17', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },
    { name: 'بسكويت كاكاو 5 جنيه ق. 12*8', code: 'MXBCPL18', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },

    { name: 'ماكسيلو بسكويت سادة شاي (حجم 2) ق. 12*6', code: 'MXBCPL51', factory: 300, retail: 300, wholesale: 276.00, perBox: 72 },
    { name: 'ماكسيلو بسكويت سادة شاي (حجم 2) ق. 8*12', code: 'MXBCPL21', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },

    { name: 'ماكسيلو بسكويت سندويتش بالشيكولاتة ومحشو بكريمة الفانيليا 3 قطع 8*12', code: 'MXBCSW13', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },
    { name: 'ماكسيلو بسكويت سندويتش بالشيكولاتة ومحشو بكريمة شيكولاتة 3 قطع 8*12', code: 'MXBCSW14', factory: 400, retail: 400, wholesale: 368.00, perBox: 96 },

    { name: 'كيك الشيكولاتة سويس رول محشو بكريمة الفانيليا ومغطى بالشيكولاتة (صغير) 12-6', code: 'MXCKSC42', factory: 300, retail: 300, wholesale: 276.00, perBox: 72 },
    { name: 'كيك الشيكولاتة سويس رول والمحشو بالشيكولاتة والمغطى بالشيكولاتة (صغير) 12-6', code: 'MXCKSC43', factory: 300, retail: 300, wholesale: 276.00, perBox: 72 },
    { name: 'كيك الشيكولاتة سويس رول المحشو بكريمة القهوة والمغطى بالشيكولاتة (صغير) 12-6', code: 'MXCKSC41', factory: 300, retail: 300, wholesale: 276.00, perBox: 72 },

    { name: 'كيك الشيكولاتة سويس رول محشو بكريمة الفانيليا ومغطى بالشيكولاتة (كبير) 6-6', code: 'MXCKSC52', factory: 300, retail: 300, wholesale: 276.00, perBox: 36 },
    { name: 'كيك الشيكولاتة سويس رول والمحشو بالشيكولاتة والمغطى بالشيكولاتة (كبير) 6-6', code: 'MXCKSC53', factory: 300, retail: 300, wholesale: 276.00, perBox: 36 },
    { name: 'كيك الشيكولاتة سويس رول المحشو بكريمة القهوة والمغطى بالشيكولاتة (كبير) 6-6', code: 'MXCKSC51', factory: 300, retail: 300, wholesale: 276.00, perBox: 36 }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {
        unitFactoryPrice: p.factory,
        unitRetailPrice: p.retail,
        unitWholesalePrice: p.wholesale,
        itemsPerBox: p.perBox,
        agencyId: agency.id
      },
      create: {
        name: p.name,
        code: p.code,
        unitFactoryPrice: p.factory,
        unitRetailPrice: p.retail,
        unitWholesalePrice: p.wholesale,
        itemsPerBox: p.perBox,
        agencyId: agency.id
      }
    });
  }

  console.log(`Successfully imported ${products.length} products for Agency: ${agency.name}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
