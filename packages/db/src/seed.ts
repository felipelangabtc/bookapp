import { PrismaClient, UserRole, ShelfType, WorkType, WorkStatus, ChapterStatus, SubscriptionPlan } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.audioFile.deleteMany();
  await prisma.audioJob.deleteMany();
  await prisma.chapterProgress.deleteMany();
  await prisma.chapterComment.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.work.deleteMany();
  await prisma.reviewComment.deleteMany();
  await prisma.reviewLike.deleteMany();
  await prisma.review.deleteMany();
  await prisma.readingGoal.deleteMany();
  await prisma.shelfEntry.deleteMany();
  await prisma.bookCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.book.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create Categories
  console.log('📚 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Fiction', slug: 'fiction', description: 'Fictional works including novels and short stories' },
    }),
    prisma.category.create({
      data: { name: 'Non-Fiction', slug: 'non-fiction', description: 'Non-fictional works including biographies and essays' },
    }),
    prisma.category.create({
      data: { name: 'Science Fiction', slug: 'science-fiction', description: 'Science fiction and futuristic stories' },
    }),
    prisma.category.create({
      data: { name: 'Fantasy', slug: 'fantasy', description: 'Fantasy and magical realism' },
    }),
    prisma.category.create({
      data: { name: 'Romance', slug: 'romance', description: 'Romance and love stories' },
    }),
    prisma.category.create({
      data: { name: 'Mystery', slug: 'mystery', description: 'Mystery and detective fiction' },
    }),
    prisma.category.create({
      data: { name: 'Thriller', slug: 'thriller', description: 'Thrillers and suspense' },
    }),
    prisma.category.create({
      data: { name: 'Horror', slug: 'horror', description: 'Horror and supernatural fiction' },
    }),
    prisma.category.create({
      data: { name: 'Biography', slug: 'biography', description: 'Biographies and memoirs' },
    }),
    prisma.category.create({
      data: { name: 'Self-Help', slug: 'self-help', description: 'Self-improvement and personal development' },
    }),
    prisma.category.create({
      data: { name: 'Young Adult', slug: 'young-adult', description: 'Young adult fiction' },
    }),
    prisma.category.create({
      data: { name: 'Poetry', slug: 'poetry', description: 'Poetry collections' },
    }),
  ]);

  // Create Users
  console.log('👤 Creating users...');
  const passwordHash = await hash('Password123!', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bookapp.com',
      emailVerified: new Date(),
      passwordHash,
      username: 'admin',
      displayName: 'Admin User',
      bio: 'Platform administrator',
      preferredLanguage: 'en',
      country: 'US',
      role: UserRole.ADMIN,
    },
  });

  const authorUser = await prisma.user.create({
    data: {
      email: 'author@bookapp.com',
      emailVerified: new Date(),
      passwordHash,
      username: 'janewriter',
      displayName: 'Jane Writer',
      bio: 'Aspiring author who loves to write fantasy and science fiction stories.',
      preferredLanguage: 'en',
      country: 'US',
      role: UserRole.AUTHOR,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@bookapp.com',
      emailVerified: new Date(),
      passwordHash,
      username: 'booklover42',
      displayName: 'Book Lover',
      bio: 'Avid reader who enjoys discovering new authors and genres.',
      preferredLanguage: 'en',
      country: 'US',
      role: UserRole.USER,
    },
  });

  const brazilianUser = await prisma.user.create({
    data: {
      email: 'leitor@bookapp.com',
      emailVerified: new Date(),
      passwordHash,
      username: 'leitorbrasileiro',
      displayName: 'Leitor Brasileiro',
      bio: 'Apaixonado por literatura brasileira e internacional.',
      preferredLanguage: 'pt-BR',
      country: 'BR',
      role: UserRole.USER,
    },
  });

  // Create subscriptions
  console.log('💳 Creating subscriptions...');
  await prisma.subscription.create({
    data: {
      userId: adminUser.id,
      plan: SubscriptionPlan.PRO,
      status: 'ACTIVE',
    },
  });

  await prisma.subscription.create({
    data: {
      userId: authorUser.id,
      plan: SubscriptionPlan.PRO,
      status: 'ACTIVE',
    },
  });

  await prisma.subscription.create({
    data: {
      userId: regularUser.id,
      plan: SubscriptionPlan.FREE,
      status: 'ACTIVE',
    },
  });

  await prisma.subscription.create({
    data: {
      userId: brazilianUser.id,
      plan: SubscriptionPlan.FREE,
      status: 'ACTIVE',
    },
  });

  // Create Books
  console.log('📖 Creating books...');
  const books = await Promise.all([
    prisma.book.create({
      data: {
        title: '1984',
        subtitle: 'A Novel',
        description: 'Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its futuristic purgatory becomes more real.',
        authors: ['George Orwell'],
        coverImage: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
        language: 'en',
        publishedDate: new Date('1949-06-08'),
        isbn13: '9780451524935',
        pageCount: 328,
        publisher: 'Signet Classic',
        averageRating: 4.5,
        ratingsCount: 1250,
        reviewsCount: 89,
        categories: {
          create: [
            { category: { connect: { id: categories[0]!.id } } },
            { category: { connect: { id: categories[2]!.id } } },
          ],
        },
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Hitchhiker\'s Guide to the Galaxy',
        description: 'Seconds before the Earth is demolished to make way for a galactic freeway, Arthur Dent is plucked off the planet by his friend Ford Prefect.',
        authors: ['Douglas Adams'],
        coverImage: 'https://covers.openlibrary.org/b/id/8775116-L.jpg',
        language: 'en',
        publishedDate: new Date('1979-10-12'),
        isbn13: '9780345391803',
        pageCount: 224,
        publisher: 'Del Rey',
        averageRating: 4.2,
        ratingsCount: 980,
        reviewsCount: 67,
        categories: {
          create: [
            { category: { connect: { id: categories[0]!.id } } },
            { category: { connect: { id: categories[2]!.id } } },
          ],
        },
      },
    }),
    prisma.book.create({
      data: {
        title: 'Pride and Prejudice',
        description: 'Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language.',
        authors: ['Jane Austen'],
        coverImage: 'https://covers.openlibrary.org/b/id/8231994-L.jpg',
        language: 'en',
        publishedDate: new Date('1813-01-28'),
        isbn13: '9780141439518',
        pageCount: 432,
        publisher: 'Penguin Classics',
        averageRating: 4.3,
        ratingsCount: 1500,
        reviewsCount: 120,
        categories: {
          create: [
            { category: { connect: { id: categories[0]!.id } } },
            { category: { connect: { id: categories[4]!.id } } },
          ],
        },
      },
    }),
    prisma.book.create({
      data: {
        title: 'Dom Casmurro',
        description: 'Um dos maiores clássicos da literatura brasileira, conta a história de Bentinho e Capitu através da perspectiva do narrador.',
        authors: ['Machado de Assis'],
        coverImage: 'https://covers.openlibrary.org/b/id/8289911-L.jpg',
        language: 'pt',
        publishedDate: new Date('1899-01-01'),
        isbn13: '9788535902778',
        pageCount: 256,
        publisher: 'Companhia das Letras',
        averageRating: 4.6,
        ratingsCount: 450,
        reviewsCount: 45,
        categories: {
          create: [
            { category: { connect: { id: categories[0]!.id } } },
          ],
        },
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Lord of the Rings',
        description: 'One Ring to rule them all, One Ring to find them, One Ring to bring them all and in the darkness bind them.',
        authors: ['J.R.R. Tolkien'],
        coverImage: 'https://covers.openlibrary.org/b/id/8406786-L.jpg',
        language: 'en',
        publishedDate: new Date('1954-07-29'),
        isbn13: '9780618640157',
        pageCount: 1178,
        publisher: 'Mariner Books',
        averageRating: 4.8,
        ratingsCount: 2500,
        reviewsCount: 200,
        categories: {
          create: [
            { category: { connect: { id: categories[0]!.id } } },
            { category: { connect: { id: categories[3]!.id } } },
          ],
        },
      },
    }),
  ]);

  // Create Shelf Entries
  console.log('📚 Creating shelf entries...');
  await prisma.shelfEntry.createMany({
    data: [
      {
        userId: regularUser.id,
        bookId: books[0]!.id,
        shelfType: ShelfType.READ,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
        progressPercent: 100,
        notes: 'Amazing classic that still feels relevant today.',
        tags: ['classic', 'dystopia', 'favorite'],
      },
      {
        userId: regularUser.id,
        bookId: books[1]!.id,
        shelfType: ShelfType.READ,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-05'),
        progressPercent: 100,
        notes: 'So funny! Loved every page.',
        tags: ['comedy', 'sci-fi'],
      },
      {
        userId: regularUser.id,
        bookId: books[4]!.id,
        shelfType: ShelfType.READING,
        startDate: new Date('2024-03-01'),
        progressPercent: 45,
        progressPages: 530,
        notes: 'Taking my time with this epic.',
        tags: ['fantasy', 'epic'],
      },
      {
        userId: regularUser.id,
        bookId: books[2]!.id,
        shelfType: ShelfType.WANT_TO_READ,
        tags: ['classic', 'romance'],
      },
      {
        userId: brazilianUser.id,
        bookId: books[3]!.id,
        shelfType: ShelfType.READ,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-20'),
        progressPercent: 100,
        notes: 'Obra prima da literatura brasileira!',
        tags: ['brasileiro', 'clássico'],
      },
      {
        userId: brazilianUser.id,
        bookId: books[0]!.id,
        shelfType: ShelfType.WANT_TO_READ,
        tags: ['dystopia'],
      },
    ],
  });

  // Create Reviews
  console.log('⭐ Creating reviews...');
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: regularUser.id,
        bookId: books[0]!.id,
        rating: 4.5,
        title: 'A Timeless Warning',
        body: `George Orwell's *1984* remains one of the most powerful political novels ever written. The world of Oceania, with its omnipresent surveillance and manipulation of truth, feels eerily relevant today.

The relationship between Winston and Julia provides a human core to the political horror. The ending is devastating and unforgettable.

**Highly recommended** for anyone interested in dystopian fiction or political commentary.`,
        hasSpoilers: false,
        detectedLanguage: 'en',
      },
    }),
    prisma.review.create({
      data: {
        userId: regularUser.id,
        bookId: books[1]!.id,
        rating: 4.0,
        title: 'Don\'t Panic! A Hilarious Ride',
        body: `Douglas Adams created something truly unique with this book. The humor is absurdist, the plot is wild, and yet it all somehow makes perfect sense.

Ford Prefect, Arthur Dent, and the depressed robot Marvin are unforgettable characters. The writing is quotable on almost every page.

If you like British humor and don't mind some silliness in your sci-fi, this is a must-read.`,
        hasSpoilers: false,
        detectedLanguage: 'en',
      },
    }),
    prisma.review.create({
      data: {
        userId: brazilianUser.id,
        bookId: books[3]!.id,
        rating: 5.0,
        title: 'Uma obra-prima da literatura brasileira',
        body: `Machado de Assis demonstra neste livro toda sua genialidade como escritor. A forma como Bentinho narra sua história, com suas incertezas e ciúmes, nos deixa constantemente questionando a verdade.

Capitu é uma das personagens mais fascinantes da literatura. Seus "olhos de ressaca" são descritos de forma memorável.

Este livro é leitura obrigatória para quem quer entender a literatura brasileira. Um clássico atemporal.`,
        hasSpoilers: false,
        detectedLanguage: 'pt',
      },
    }),
  ]);

  // Create Review Likes
  console.log('👍 Creating review likes...');
  await prisma.reviewLike.createMany({
    data: [
      { userId: authorUser.id, reviewId: reviews[0]!.id },
      { userId: brazilianUser.id, reviewId: reviews[0]!.id },
      { userId: adminUser.id, reviewId: reviews[0]!.id },
      { userId: authorUser.id, reviewId: reviews[2]!.id },
    ],
  });

  // Update like counts
  await prisma.review.update({
    where: { id: reviews[0]!.id },
    data: { likesCount: 3 },
  });
  await prisma.review.update({
    where: { id: reviews[2]!.id },
    data: { likesCount: 1 },
  });

  // Create Review Comments
  console.log('💬 Creating review comments...');
  await prisma.reviewComment.create({
    data: {
      userId: authorUser.id,
      reviewId: reviews[0]!.id,
      body: 'Great review! I completely agree about the ending. It haunted me for days.',
      detectedLanguage: 'en',
    },
  });

  // Create Reading Goals
  console.log('🎯 Creating reading goals...');
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  await prisma.readingGoal.createMany({
    data: [
      {
        userId: regularUser.id,
        year: currentYear,
        month: currentMonth,
        targetBooks: 4,
        completed: 2,
      },
      {
        userId: brazilianUser.id,
        year: currentYear,
        month: currentMonth,
        targetBooks: 3,
        completed: 1,
      },
    ],
  });

  // Create Works (User-written content)
  console.log('✍️ Creating works...');
  const work = await prisma.work.create({
    data: {
      authorId: authorUser.id,
      type: WorkType.BOOK,
      title: 'The Crystal Kingdoms',
      synopsis: `In a world where magic flows through crystals, young Aria discovers she has the rare ability to communicate with the ancient stones. When the kingdom's ruling crystal begins to fade, threatening all magic, Aria must journey to the forbidden mountains to find a new source of power.

But the mountains hold secrets darker than anyone imagined, and Aria will have to choose between saving her world and protecting those she loves.

*A fantasy adventure about courage, sacrifice, and the power of belief.*`,
      coverImage: 'https://via.placeholder.com/400x600/6366f1/ffffff?text=Crystal+Kingdoms',
      language: 'en',
      tags: ['fantasy', 'adventure', 'young-adult', 'magic'],
      status: WorkStatus.PUBLISHED,
      publishedAt: new Date('2024-01-01'),
      viewsCount: 1250,
      likesCount: 89,
      chaptersCount: 3,
    },
  });

  // Create Chapters
  console.log('📝 Creating chapters...');
  const chapters = await Promise.all([
    prisma.chapter.create({
      data: {
        workId: work.id,
        title: 'The Awakening',
        content: `# Chapter 1: The Awakening

The morning sun filtered through Aria's window, casting rainbow patterns across her small room. She stretched, feeling the familiar warmth of the crystal pendant against her chest—a gift from her grandmother on her sixteenth birthday.

"Aria! Breakfast!" her mother called from downstairs.

She swung her legs out of bed and paused. The pendant was warm, warmer than it should be. And there was something else—a faint hum, like a distant voice trying to break through silence.

*Can you hear us?*

Aria gasped and clutched the crystal. "Who's there?"

But the voice had faded, leaving only the pendant's gentle warmth and the ordinary sounds of morning.

---

The village of Crystalbrook sat in a valley surrounded by rolling hills, each dotted with crystal formations that glowed softly at night. Magic was everywhere here—in the floating lanterns that lit the streets, in the self-warming stoves, in the healing waters of the central fountain.

But lately, something had changed. The crystals seemed dimmer. The magic, weaker.

"Did you hear about the Miller's heating stone?" her friend Tomas asked as they walked to school. "Went completely dark last night. First time in fifty years."

Aria nodded, only half listening. She couldn't stop thinking about the voice.

"My father says it's the Great Crystal," Tomas continued, lowering his voice. "Says it's dying."

The Great Crystal. It sat in the palace, the source of all magic in the kingdom. Legend said it had been there since the beginning of time, a gift from the gods themselves.

"Crystals don't die," Aria said automatically, but her hand went to her pendant again.

And this time, she could swear she heard it whisper: *Help us.*`,
        order: 1,
        status: ChapterStatus.PUBLISHED,
        publishedAt: new Date('2024-01-01'),
        wordCount: 320,
        viewsCount: 850,
        likesCount: 45,
      },
    }),
    prisma.chapter.create({
      data: {
        workId: work.id,
        title: 'The Council\'s Warning',
        content: `# Chapter 2: The Council's Warning

The school bell had barely rung when Aria was summoned to the Headmistress's office. Her heart pounded as she walked through the marble halls, past portraits of famous mages who seemed to watch her with knowing eyes.

Headmistress Elena was not alone. Three figures in silver robes stood with her—members of the Crystal Council, the kingdom's highest authority on magic.

"Miss Aria," the Headmistress said, her voice unusually gentle, "these Council members wish to speak with you."

The eldest Council member, a woman with hair like spun silver, stepped forward. "We have felt a disturbance in the crystal network. A new voice. Young, but powerful." Her eyes fixed on Aria's pendant. "We believe it may be connected to you."

Aria's throat went dry. "I... I don't know what you mean."

"The crystals are dying, child." Another Council member spoke, his voice heavy with concern. "The Great Crystal most of all. We need to find someone who can speak to them, who can understand what's happening."

"And you think that's me?" Aria's voice cracked.

The silver-haired woman smiled sadly. "We know it is. The question is: are you brave enough to accept your destiny?"

---

That night, Aria sat on her bed, staring at the pendant. "What do you want from me?" she whispered.

The crystal pulsed with warm light, and this time the voices came clearly—not one, but thousands, all speaking in harmony:

*The darkness comes. Only you can bring the light. Journey to the Forgotten Mountains. Find the Source. Save us all.*

Aria closed her eyes. When she opened them, her decision was made.

She was going to the mountains, whether the Council approved or not.`,
        order: 2,
        status: ChapterStatus.PUBLISHED,
        publishedAt: new Date('2024-01-08'),
        wordCount: 310,
        viewsCount: 620,
        likesCount: 38,
      },
    }),
    prisma.chapter.create({
      data: {
        workId: work.id,
        title: 'The Journey Begins',
        content: `# Chapter 3: The Journey Begins

Aria left at midnight, when the twin moons hung low over the horizon. She had packed light—some food, water, a change of clothes, and her grandmother's journal, which she had found hidden in the attic.

The journal spoke of the Forgotten Mountains, of ancient paths and older magic. Her grandmother, it seemed, had known more about crystals than anyone had realized.

*I always knew you were special,* she remembered her grandmother saying. *One day, you'll understand.*

Now, finally, she was beginning to.

---

The village gates were unguarded at this hour, but Aria froze when she saw a familiar figure waiting by the road.

"Tomas? What are you doing here?"

Her friend grinned, adjusting the pack on his shoulders. "You didn't think I'd let you go alone, did you? I've been your friend since we were five. I know when you're planning something crazy."

"This isn't a game, Tomas. It could be dangerous."

"I know." His expression grew serious. "That's exactly why you need someone watching your back."

Aria wanted to argue, but the truth was, she was terrified. Having Tomas along made everything feel less impossible.

"Fine," she said. "But we do this my way. And if things get bad—"

"They won't," Tomas said with confidence she didn't feel. "We're going to save the kingdom, Aria. How hard can it be?"

She laughed despite herself, and together they set off toward the mountains that loomed against the star-filled sky.

The journey had begun.

*To be continued...*`,
        order: 3,
        status: ChapterStatus.PUBLISHED,
        publishedAt: new Date('2024-01-15'),
        wordCount: 295,
        viewsCount: 480,
        likesCount: 52,
      },
    }),
  ]);

  // Create Chapter Comments
  console.log('💬 Creating chapter comments...');
  await prisma.chapterComment.createMany({
    data: [
      {
        userId: regularUser.id,
        chapterId: chapters[0]!.id,
        body: 'Great opening chapter! I love the world-building with the crystals. Looking forward to reading more!',
        detectedLanguage: 'en',
      },
      {
        userId: brazilianUser.id,
        chapterId: chapters[0]!.id,
        body: 'Muito interessante! A ideia dos cristais mágicos é bem original.',
        detectedLanguage: 'pt',
      },
      {
        userId: regularUser.id,
        chapterId: chapters[2]!.id,
        body: 'Tomas is such a good friend! Can\'t wait for the next chapter!',
        detectedLanguage: 'en',
      },
    ],
  });

  // Create Chapter Progress
  console.log('📊 Creating chapter progress...');
  await prisma.chapterProgress.createMany({
    data: [
      {
        userId: regularUser.id,
        chapterId: chapters[0]!.id,
        progressPercent: 100,
        completedAt: new Date('2024-01-02'),
      },
      {
        userId: regularUser.id,
        chapterId: chapters[1]!.id,
        progressPercent: 100,
        completedAt: new Date('2024-01-09'),
      },
      {
        userId: regularUser.id,
        chapterId: chapters[2]!.id,
        progressPercent: 75,
      },
      {
        userId: brazilianUser.id,
        chapterId: chapters[0]!.id,
        progressPercent: 100,
        completedAt: new Date('2024-01-05'),
      },
    ],
  });

  // Create Follows
  console.log('👥 Creating follows...');
  await prisma.follow.createMany({
    data: [
      { followerId: regularUser.id, followingId: authorUser.id },
      { followerId: brazilianUser.id, followingId: authorUser.id },
      { followerId: regularUser.id, followingId: brazilianUser.id },
    ],
  });

  // Create Audit Logs
  console.log('📋 Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SEED_DATABASE',
        entityType: 'SYSTEM',
        entityId: 'seed',
        metadata: { message: 'Database seeded with sample data' },
      },
    ],
  });

  console.log('✅ Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${categories.length} categories`);
  console.log(`   - 4 users (admin, author, regular, brazilian)`);
  console.log(`   - ${books.length} books`);
  console.log(`   - 6 shelf entries`);
  console.log(`   - ${reviews.length} reviews`);
  console.log(`   - 1 work with ${chapters.length} chapters`);
  console.log('\n🔑 Test accounts:');
  console.log('   - admin@bookapp.com / Password123!');
  console.log('   - author@bookapp.com / Password123!');
  console.log('   - user@bookapp.com / Password123!');
  console.log('   - leitor@bookapp.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
