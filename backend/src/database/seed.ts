import bcrypt from 'bcryptjs';
import { queryOne, run } from './db';

const CATEGORIES = [
  {
    id: 'programming',
    name: 'Programming',
    description: 'Programming languages, software development, and coding.',
    iconName: 'Laptop'
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'HTML, CSS, JavaScript, and web application development.',
    iconName: 'Globe'
  },
  {
    id: 'python-data',
    name: 'Python & Data',
    description: 'Python programming, data analysis, and data science.',
    iconName: 'Binary'
  },
  {
    id: 'artificial-intelligence',
    name: 'Artificial Intelligence & Machine Learning',
    description: 'Artificial intelligence, machine learning, and intelligent systems.',
    iconName: 'Atom'
  },
  {
    id: 'networking',
    name: 'Computer Networks',
    description: 'Computer networking, internet technologies, and network systems.',
    iconName: 'Globe'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Cybersecurity, information security, and secure computing.',
    iconName: 'Shield'
  },
  {
    id: 'databases',
    name: 'Databases',
    description: 'Database systems, SQL, data management, and database design.',
    iconName: 'Database'
  },
  {
    id: 'career',
    name: 'IT Career & Professional Skills',
    description: 'Technical interviews, productivity, and professional development.',
    iconName: 'Sparkles'
  }
];

const BOOKS = [
  {
    id: 'book-clean-code',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    categoryId: 'programming',
    description:
      'A practical guide to writing readable, maintainable, and professional software.',
    year: 2008,
    pages: 464,
    language: 'English',
    isbn: '978-0132350884',
    publisher: 'Prentice Hall',
    featured: true
  },
  {
    id: 'book-web-development',
    title: 'Web Development with HTML, CSS & JavaScript',
    author: 'Jon Duckett',
    categoryId: 'web-development',
    description:
      'A visual introduction to creating websites using HTML, CSS, and JavaScript.',
    year: 2014,
    pages: 640,
    language: 'English',
    isbn: '978-1118871652',
    publisher: 'Wiley',
    featured: true
  },
  {
    id: 'book-python-everybody',
    title: 'Python for Everybody',
    author: 'Charles Severance',
    categoryId: 'python-data',
    description:
      'A beginner-friendly introduction to programming and problem solving using Python.',
    year: 2016,
    pages: 300,
    language: 'English',
    isbn: '978-1530051120',
    publisher: 'CreateSpace',
    featured: true
  },
  {
    id: 'book-ai-modern-approach',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell & Peter Norvig',
    categoryId: 'artificial-intelligence',
    description:
      'A comprehensive introduction to artificial intelligence and intelligent agents.',
    year: 2021,
    pages: 1136,
    language: 'English',
    isbn: '978-0134610993',
    publisher: 'Pearson',
    featured: true
  },
  {
    id: 'book-networking-top-down',
    title: 'Computer Networking: A Top-Down Approach',
    author: 'James Kurose & Keith Ross',
    categoryId: 'networking',
    description:
      'A practical introduction to modern computer networking using a top-down approach.',
    year: 2021,
    pages: 800,
    language: 'English',
    isbn: '978-0136681557',
    publisher: 'Pearson',
    featured: true
  },
  {
    id: 'book-computer-security',
    title: 'Computer Security: Principles and Practice',
    author: 'William Stallings & Lawrie Brown',
    categoryId: 'cybersecurity',
    description:
      'Fundamentals of cybersecurity, threats, security mechanisms, and defensive practices.',
    year: 2018,
    pages: 800,
    language: 'English',
    isbn: '978-0134794105',
    publisher: 'Pearson',
    featured: false
  },
  {
    id: 'book-database-system-concepts',
    title: 'Database System Concepts',
    author: 'Abraham Silberschatz, Henry Korth & S. Sudarshan',
    categoryId: 'databases',
    description:
      'A comprehensive introduction to database systems, SQL, transactions, and database design.',
    year: 2019,
    pages: 1376,
    language: 'English',
    isbn: '978-0078022159',
    publisher: 'McGraw Hill',
    featured: true
  },
  {
    id: 'book-python-data-analysis',
    title: 'Python for Data Analysis',
    author: 'Wes McKinney',
    categoryId: 'python-data',
    description:
      'Practical data analysis using Python, pandas, NumPy, and related tools.',
    year: 2022,
    pages: 579,
    language: 'English',
    isbn: '978-1098104030',
    publisher: "O'Reilly Media",
    featured: false
  },
  {
    id: 'book-coding-interview',
    title: 'Cracking the Coding Interview',
    author: 'Gayle Laakmann McDowell',
    categoryId: 'career',
    description:
      'Technical interview preparation covering programming problems, algorithms, and problem solving.',
    year: 2015,
    pages: 708,
    language: 'English',
    isbn: '978-0984782857',
    publisher: 'CareerCup',
    featured: true
  },
  {
    id: 'book-deep-work',
    title: 'Deep Work',
    author: 'Cal Newport',
    categoryId: 'career',
    description:
      'Strategies for focused work, concentration, learning, and professional development.',
    year: 2016,
    pages: 304,
    language: 'English',
    isbn: '978-1455586691',
    publisher: 'Grand Central Publishing',
    featured: false
  }
];

export async function seedDatabase(): Promise<void> {
  console.log('Checking starter catalog seed...');

  // ---------------------------------------------------------
  // 1. Default admin
  // ---------------------------------------------------------

  const existingAdmin = await queryOne(
    'SELECT id FROM users WHERE email = ?',
    ['admin@communitylibrary.local']
  );

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPass123!', 12);

    await run(
      `
      INSERT INTO users (
        id,
        full_name,
        email,
        password_hash,
        phone,
        role,
        library_card_number,
        membership_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        'user-admin',
        'Library Administrator',
        'admin@communitylibrary.local',
        passwordHash,
        '',
        'admin',
        'ADMIN-0001',
        'Administrator'
      ]
    );

    console.log('Default admin created.');
  }

  // ---------------------------------------------------------
  // 2. Default member
  // ---------------------------------------------------------

  const existingMember = await queryOne(
    'SELECT id FROM users WHERE email = ?',
    ['member@communitylibrary.local']
  );

  if (!existingMember) {
    const passwordHash = await bcrypt.hash('MemberPass123!', 12);

    await run(
      `
      INSERT INTO users (
        id,
        full_name,
        email,
        password_hash,
        phone,
        role,
        library_card_number,
        membership_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        'user-member',
        'Community Member',
        'member@communitylibrary.local',
        passwordHash,
        '',
        'user',
        'MEMBER-0001',
        'General'
      ]
    );

    console.log('Default member created.');
  }

  const existingBookCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) AS count FROM books'
  );

  if (Number(existingBookCount?.count || 0) > 0) {
    console.log('Catalog already contains books. Skipping starter catalog seed.');
    return;
  }

  // ---------------------------------------------------------
  // 3. Clear any partial starter catalog state.
  // ---------------------------------------------------------

  console.log('Preparing starter catalog seed...');

  await run('DELETE FROM reservations');
  await run('DELETE FROM reviews');
  await run('DELETE FROM reading_progress');
  await run('DELETE FROM bookmarks');
  await run('DELETE FROM borrowings');
  await run('DELETE FROM books');
  await run('DELETE FROM categories');

  // ---------------------------------------------------------
  // 4. Create fresh categories
  // ---------------------------------------------------------

  for (const category of CATEGORIES) {
    await run(
      `
      INSERT INTO categories (
        id,
        name,
        description,
        icon_name
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        category.id,
        category.name,
        category.description,
        category.iconName
      ]
    );
  }

  // ---------------------------------------------------------
  // 5. Create only the required starter books
  // ---------------------------------------------------------

  for (const book of BOOKS) {
    await run(
      `
      INSERT INTO books (
        id,
        title,
        author,
        category_id,
        description,
        publication_year,
        pages,
        language,
        isbn,
        cover_path,
        pdf_path,
        is_available,
        publisher,
        featured,
        chapters_json,
        rating,
        reviews_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        book.id,
        book.title,
        book.author,
        book.categoryId,
        book.description,
        book.year,
        book.pages,
        book.language,
        book.isbn,
        null,
        null,
        true,
        book.publisher,
        book.featured,
        null,
        0,
        0
      ]
    );
  }

  console.log(`Fresh catalog created: ${BOOKS.length} books.`);
  console.log(`Fresh categories created: ${CATEGORIES.length}.`);
  console.log('Seed complete.');
}
