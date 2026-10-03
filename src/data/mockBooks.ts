import { Book, CategoryInfo, LibraryStats } from '../types';

export const CATEGORIES_DATA: CategoryInfo[] = [
  {
    id: 'programming-software-development',
    name: 'Programming & Software Development',
    description:
      'Programming languages, software development, algorithms, web development, and software engineering.',
    iconName: 'Laptop',
    bookCount: 6,
    featuredAuthors: [
      'Robert C. Martin',
      'Andy Hunt',
      'Thomas H. Cormen',
      'Brian Kernighan'
    ],
    bgGradient: 'from-emerald-500/10 to-teal-500/10'
  },
  {
    id: 'artificial-intelligence-machine-learning',
    name: 'Artificial Intelligence & Machine Learning',
    description:
      'Artificial intelligence, machine learning, data science, generative AI, and intelligent systems.',
    iconName: 'Atom',
    bookCount: 4,
    featuredAuthors: [
      'Stuart Russell',
      'Peter Norvig',
      'Aurélien Géron',
      'Ian Goodfellow'
    ],
    bgGradient: 'from-blue-500/10 to-cyan-500/10'
  },
  {
    id: 'computer-networks-cybersecurity',
    name: 'Computer Networks & Cybersecurity',
    description:
      'Computer networks, internet technologies, information security, cybersecurity, and ethical security practices.',
    iconName: 'Globe',
    bookCount: 4,
    featuredAuthors: [
      'Andrew S. Tanenbaum',
      'James Kurose',
      'Keith Ross',
      'William Stallings'
    ],
    bgGradient: 'from-indigo-500/10 to-violet-500/10'
  },
  {
    id: 'databases-data-analytics',
    name: 'Databases & Data Analytics',
    description:
      'Database systems, SQL, data management, data analytics, visualization, and information systems.',
    iconName: 'Binary',
    bookCount: 4,
    featuredAuthors: [
      'Abraham Silberschatz',
      'Ramez Elmasri',
      'Martin Kleppmann',
      'Wes McKinney'
    ],
    bgGradient: 'from-yellow-500/10 to-amber-500/10'
  },
  {
    id: 'digital-literacy-computer-fundamentals',
    name: 'Digital Literacy & Computer Fundamentals',
    description:
      'Computer fundamentals, digital literacy, internet skills, productivity tools, and essential digital knowledge.',
    iconName: 'BookOpen',
    bookCount: 3,
    featuredAuthors: [
      'Charles Severance',
      'Peter Norton',
      'Brian Kernighan'
    ],
    bgGradient: 'from-rose-500/10 to-pink-500/10'
  },
  {
    id: 'it-career-professional-skills',
    name: 'IT Career & Professional Skills',
    description:
      'IT careers, interview preparation, communication, professional development, and workplace skills.',
    iconName: 'Sparkles',
    bookCount: 4,
    featuredAuthors: [
      'Gayle Laakmann McDowell',
      'Cal Newport',
      'Eric Ries',
      'Scott Berkun'
    ],
    bgGradient: 'from-teal-500/10 to-emerald-500/10'
  }
];

export const MOCK_LIBRARY_STATS: LibraryStats = {
  totalBooks: 25,
  totalCategories: 6,
  availableToRead: 25,
  activeMembers: 0,
  monthlyBorrows: 0
};

export const MOCK_BOOKS: Book[] = [
  {
    id: 'bk-01',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Programming & Software Development',
    year: 2008,
    pages: 464,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0132350884',
    publisher: 'Prentice Hall',
    featured: true,
    rating: 4.7,
    ratingCount: 220,
    coverColor: '#047857',
    cover:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Practical principles and techniques for writing readable, maintainable, and professional software.',
    description:
      'A practical guide to software craftsmanship covering clean code principles, meaningful names, functions, comments, formatting, error handling, testing, and maintainable software design.'
  },
  {
    id: 'bk-02',
    title: 'The Pragmatic Programmer',
    author: 'Andy Hunt & Dave Thomas',
    category: 'Programming & Software Development',
    year: 1999,
    pages: 352,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0135957059',
    publisher: 'Addison-Wesley Professional',
    featured: true,
    rating: 4.8,
    ratingCount: 380,
    coverColor: '#0f766e',
    cover:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Practical advice and principles for becoming a better software developer.',
    description:
      'A collection of practical software development techniques covering programming habits, debugging, testing, automation, design, and professional craftsmanship.'
  },
  {
    id: 'bk-03',
    title: 'Introduction to Algorithms',
    author:
      'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest & Clifford Stein',
    category: 'Programming & Software Development',
    year: 2009,
    pages: 1312,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0262033848',
    publisher: 'MIT Press',
    featured: true,
    rating: 4.8,
    ratingCount: 390,
    coverColor: '#111827',
    cover:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A comprehensive university-level introduction to algorithms and algorithmic problem solving.',
    description:
      'Covers sorting, searching, data structures, graph algorithms, dynamic programming, greedy algorithms, and algorithm analysis.'
  },
  {
    id: 'bk-04',
    title: 'The C Programming Language',
    author: 'Brian W. Kernighan & Dennis M. Ritchie',
    category: 'Programming & Software Development',
    year: 1988,
    pages: 272,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0131103627',
    publisher: 'Prentice Hall',
    featured: false,
    rating: 4.8,
    ratingCount: 310,
    coverColor: '#1e3a8a',
    cover:
      'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A classic introduction to the C programming language and fundamental programming concepts.',
    description:
      'Introduces C syntax, data types, operators, functions, pointers, arrays, structures, input and output, and practical programming techniques.'
  },
  {
    id: 'bk-05',
    title: 'Java: The Complete Reference',
    author: 'Herbert Schildt',
    category: 'Programming & Software Development',
    year: 2021,
    pages: 1248,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1260463415',
    publisher: 'McGraw Hill',
    featured: false,
    rating: 4.6,
    ratingCount: 190,
    coverColor: '#b45309',
    cover:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A comprehensive reference covering Java programming from fundamentals to advanced features.',
    description:
      'Covers Java fundamentals, object-oriented programming, exceptions, collections, multithreading, generics, GUI programming, and modern Java features.'
  },
  {
    id: 'bk-06',
    title: 'Web Development with HTML, CSS & JavaScript',
    author: 'Jon Duckett',
    category: 'Programming & Software Development',
    year: 2014,
    pages: 640,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1118871652',
    publisher: 'Wiley',
    featured: false,
    rating: 4.7,
    ratingCount: 250,
    coverColor: '#0369a1',
    cover:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A visual introduction to building modern websites with HTML, CSS, and JavaScript.',
    description:
      'Introduces the core technologies used to create websites and web applications, including structure, styling, interaction, and responsive design.'
  },

  {
    id: 'bk-07',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell & Peter Norvig',
    category: 'Artificial Intelligence & Machine Learning',
    year: 2021,
    pages: 1136,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0134610993',
    publisher: 'Pearson',
    featured: true,
    rating: 4.8,
    ratingCount: 410,
    coverColor: '#1e40af',
    cover:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A comprehensive introduction to artificial intelligence and intelligent agents.',
    description:
      'Covers intelligent agents, search, knowledge representation, reasoning, planning, machine learning, natural language processing, robotics, and AI ethics.'
  },
  {
    id: 'bk-08',
    title: 'Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow',
    author: 'Aurélien Géron',
    category: 'Artificial Intelligence & Machine Learning',
    year: 2022,
    pages: 864,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1098125974',
    publisher: "O'Reilly Media",
    featured: true,
    rating: 4.8,
    ratingCount: 350,
    coverColor: '#7c3aed',
    cover:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Practical machine learning using popular Python-based frameworks and tools.',
    description:
      'Introduces supervised and unsupervised learning, neural networks, deep learning, model evaluation, preprocessing, and practical machine learning workflows.'
  },
  {
    id: 'bk-09',
    title: 'Deep Learning',
    author: 'Ian Goodfellow, Yoshua Bengio & Aaron Courville',
    category: 'Artificial Intelligence & Machine Learning',
    year: 2016,
    pages: 800,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0262035613',
    publisher: 'MIT Press',
    featured: false,
    rating: 4.7,
    ratingCount: 280,
    coverColor: '#312e81',
    cover:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A detailed foundation in deep learning and modern neural network techniques.',
    description:
      'Explains mathematical foundations, neural networks, optimization, convolutional networks, sequence models, representation learning, and practical deep learning concepts.'
  },
  {
    id: 'bk-10',
    title: 'Machine Learning for Beginners',
    author: 'Various Technical Authors',
    category: 'Artificial Intelligence & Machine Learning',
    year: 2023,
    pages: 320,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0000000000',
    publisher: 'Community Digital Learning Series',
    featured: false,
    rating: 4.5,
    ratingCount: 85,
    coverColor: '#0891b2',
    cover:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'An introductory guide to machine learning concepts for beginners.',
    description:
      'Introduces datasets, features, supervised learning, classification, regression, model evaluation, and basic machine learning workflows.'
  },

  {
    id: 'bk-11',
    title: 'Computer Networks',
    author: 'Andrew S. Tanenbaum & David J. Wetherall',
    category: 'Computer Networks & Cybersecurity',
    year: 2010,
    pages: 960,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0132126953',
    publisher: 'Pearson',
    featured: true,
    rating: 4.7,
    ratingCount: 340,
    coverColor: '#1d4ed8',
    cover:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A comprehensive introduction to computer networking principles and technologies.',
    description:
      'Covers network architecture, physical and data-link layers, routing, transport protocols, network security, wireless networks, and the internet.'
  },
  {
    id: 'bk-12',
    title: 'Computer Networking: A Top-Down Approach',
    author: 'James Kurose & Keith Ross',
    category: 'Computer Networks & Cybersecurity',
    year: 2021,
    pages: 800,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0136681557',
    publisher: 'Pearson',
    featured: true,
    rating: 4.8,
    ratingCount: 290,
    coverColor: '#0369a1',
    cover:
      'https://images.unsplash.com/photo-1551808525-51a94da548ce?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A practical top-down approach to understanding modern computer networking.',
    description:
      'Explains application-layer protocols, transport services, network layer routing, data-link concepts, wireless networking, and network security.'
  },
  {
    id: 'bk-13',
    title: 'Computer Security: Principles and Practice',
    author: 'William Stallings & Lawrie Brown',
    category: 'Computer Networks & Cybersecurity',
    year: 2018,
    pages: 800,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0134794105',
    publisher: 'Pearson',
    featured: false,
    rating: 4.6,
    ratingCount: 210,
    coverColor: '#334155',
    cover:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Fundamentals of cybersecurity, security mechanisms, threats, and defensive practices.',
    description:
      'Covers security threats, cryptography, authentication, network security, operating system security, malware, secure software, and security management.'
  },
  {
    id: 'bk-14',
    title: 'Cybersecurity Fundamentals',
    author: 'Thomas J. Mowbray',
    category: 'Computer Networks & Cybersecurity',
    year: 2014,
    pages: 400,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1118877776',
    publisher: 'Wiley',
    featured: false,
    rating: 4.5,
    ratingCount: 145,
    coverColor: '#0f172a',
    cover:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'An introduction to cybersecurity concepts, threats, controls, and safe computing.',
    description:
      'Introduces common cyber threats, security principles, risk management, authentication, access control, network protection, and security awareness.'
  },

  {
    id: 'bk-15',
    title: 'Database System Concepts',
    author: 'Abraham Silberschatz, Henry Korth & S. Sudarshan',
    category: 'Databases & Data Analytics',
    year: 2019,
    pages: 1376,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0078022159',
    publisher: 'McGraw Hill',
    featured: true,
    rating: 4.7,
    ratingCount: 310,
    coverColor: '#7c2d12',
    cover:
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A comprehensive introduction to database systems, SQL, transactions, and database design.',
    description:
      'Covers relational databases, SQL, database design, storage, indexing, transactions, concurrency, recovery, and distributed databases.'
  },
  {
    id: 'bk-16',
    title: 'Fundamentals of Database Systems',
    author: 'Ramez Elmasri & Shamkant Navathe',
    category: 'Databases & Data Analytics',
    year: 2016,
    pages: 1272,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0133970777',
    publisher: 'Pearson',
    featured: false,
    rating: 4.6,
    ratingCount: 240,
    coverColor: '#854d0e',
    cover:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A detailed guide to database modeling, relational systems, SQL, and database applications.',
    description:
      'Explains entity-relationship modeling, relational databases, SQL, normalization, database security, transactions, and modern database technologies.'
  },
  {
    id: 'bk-17',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Databases & Data Analytics',
    year: 2017,
    pages: 616,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1449373320',
    publisher: "O'Reilly Media",
    featured: true,
    rating: 4.9,
    ratingCount: 340,
    coverColor: '#1e293b',
    cover:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Architecture and engineering principles for reliable, scalable, data-intensive applications.',
    description:
      'Explores data models, storage engines, distributed systems, replication, partitioning, transactions, batch processing, and stream processing.'
  },
  {
    id: 'bk-18',
    title: 'Python for Data Analysis',
    author: 'Wes McKinney',
    category: 'Databases & Data Analytics',
    year: 2022,
    pages: 579,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1098104030',
    publisher: "O'Reilly Media",
    featured: false,
    rating: 4.7,
    ratingCount: 260,
    coverColor: '#15803d',
    cover:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Practical data analysis using Python, pandas, NumPy, and related tools.',
    description:
      'Covers data cleaning, preparation, manipulation, visualization, time series, grouping, aggregation, and practical analysis with Python.'
  },

  {
    id: 'bk-19',
    title: 'Python for Everybody',
    author: 'Charles Severance',
    category: 'Digital Literacy & Computer Fundamentals',
    year: 2016,
    pages: 300,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1530051120',
    publisher: 'CreateSpace',
    featured: true,
    rating: 4.8,
    ratingCount: 360,
    coverColor: '#1d4ed8',
    cover:
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A beginner-friendly introduction to programming and digital problem solving using Python.',
    description:
      'Introduces programming fundamentals, variables, conditionals, loops, functions, data structures, files, databases, and basic web data processing.'
  },
  {
    id: 'bk-20',
    title: 'Computer Fundamentals',
    author: 'Peter Norton',
    category: 'Digital Literacy & Computer Fundamentals',
    year: 2018,
    pages: 720,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1259001149',
    publisher: 'McGraw Hill',
    featured: false,
    rating: 4.5,
    ratingCount: 180,
    coverColor: '#475569',
    cover:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Essential computer concepts for beginners and new digital users.',
    description:
      'Covers computer hardware, software, operating systems, files, internet fundamentals, applications, security, and everyday computer use.'
  },
  {
    id: 'bk-21',
    title: 'The Internet: A Beginner’s Guide',
    author: 'Various Technical Authors',
    category: 'Digital Literacy & Computer Fundamentals',
    year: 2023,
    pages: 280,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0000000001',
    publisher: 'Community Digital Learning Series',
    featured: false,
    rating: 4.5,
    ratingCount: 95,
    coverColor: '#0891b2',
    cover:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A beginner-friendly guide to internet use, online services, and digital safety.',
    description:
      'Explains browsers, search engines, email, online services, cloud tools, passwords, privacy, safe browsing, and responsible internet use.'
  },

  {
    id: 'bk-22',
    title: 'Cracking the Coding Interview',
    author: 'Gayle Laakmann McDowell',
    category: 'IT Career & Professional Skills',
    year: 2015,
    pages: 708,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0984782857',
    publisher: 'CareerCup',
    featured: true,
    rating: 4.8,
    ratingCount: 450,
    coverColor: '#111827',
    cover:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Technical interview preparation covering programming problems, algorithms, and problem solving.',
    description:
      'Provides technical interview strategies, data structures, algorithms, problem-solving approaches, and guidance for software engineering interviews.'
  },
  {
    id: 'bk-23',
    title: 'Deep Work',
    author: 'Cal Newport',
    category: 'IT Career & Professional Skills',
    year: 2016,
    pages: 304,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1455586691',
    publisher: 'Grand Central Publishing',
    featured: false,
    rating: 4.7,
    ratingCount: 390,
    coverColor: '#92400e',
    cover:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Strategies for focused work and learning in a highly distracted digital environment.',
    description:
      'Explores focused work, concentration, productivity, learning difficult skills, reducing distraction, and building valuable professional abilities.'
  },
  {
    id: 'bk-24',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    category: 'IT Career & Professional Skills',
    year: 2011,
    pages: 336,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0307887894',
    publisher: 'Crown Business',
    featured: false,
    rating: 4.6,
    ratingCount: 260,
    coverColor: '#0369a1',
    cover:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'A framework for developing products, testing ideas, and learning from users.',
    description:
      'Introduces experimentation, validated learning, minimum viable products, product development, feedback loops, and startup innovation.'
  },
  {
    id: 'bk-25',
    title: 'The Art of Software Engineering',
    author: 'Scott Berkun',
    category: 'IT Career & Professional Skills',
    year: 2023,
    pages: 320,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0000000002',
    publisher: 'Community Digital Learning Series',
    featured: false,
    rating: 4.5,
    ratingCount: 110,
    coverColor: '#4338ca',
    cover:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=600',
    shortDescription:
      'Professional guidance on software development, teamwork, communication, and engineering practice.',
    description:
      'Introduces software engineering practices, teamwork, communication, project planning, problem solving, documentation, and professional development.'
  }
];