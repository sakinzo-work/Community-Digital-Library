import { Book, CategoryInfo, LibraryStats } from '../types';

export const CATEGORIES_DATA: CategoryInfo[] = [
  {
    id: 'computer-information-technology',
    name: 'Computer & Information Technology',
    description: 'Software architecture, programming craftsmanship, algorithms, and computing systems.',
    iconName: 'Laptop',
    bookCount: 4,
    featuredAuthors: ['Robert C. Martin', 'Andy Hunt', 'Martin Kleppmann', 'Thomas H. Cormen'],
    bgGradient: 'from-emerald-500/10 to-teal-500/10'
  },
  {
    id: 'science-mathematics',
    name: 'Science & Mathematics',
    description: 'Empirical discovery, astrophysics, cosmology, and mathematical beauty.',
    iconName: 'Atom',
    bookCount: 6,
    featuredAuthors: ['Stephen Hawking', 'Carl Sagan', 'Steven Strogatz', 'Simon Singh', 'Douglas Hofstadter'],
    bgGradient: 'from-blue-500/10 to-cyan-500/10'
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Curriculum modules, pedagogy, educational resources, and academic study.',
    iconName: 'GraduationCap',
    bookCount: 1,
    featuredAuthors: ['SARXNGG'],
    bgGradient: 'from-indigo-500/10 to-violet-500/10'
  },
  {
    id: 'self-development-psychology',
    name: 'Self Development & Psychology',
    description: 'Personal growth, habit formation, behavioral psychology, and mindfulness.',
    iconName: 'Sparkles',
    bookCount: 3,
    featuredAuthors: ['James Clear', 'Cal Newport', 'Daniel Kahneman'],
    bgGradient: 'from-yellow-500/10 to-amber-500/10'
  },
  {
    id: 'arts-humanities',
    name: 'Arts & Humanities',
    description: 'History, classical literature, philosophy, culture, and human civilization.',
    iconName: 'Landmark',
    bookCount: 9,
    featuredAuthors: ['Matt Haig', 'Harper Lee', 'Yuval Noah Harari', 'Homer', 'Jared Diamond'],
    bgGradient: 'from-rose-500/10 to-pink-500/10'
  },
  {
    id: 'general-knowledge-reference',
    name: 'General Knowledge & Reference',
    description: 'Encyclopedias, compendiums, curiosities, and foundational reference works.',
    iconName: 'Globe',
    bookCount: 2,
    featuredAuthors: ['Bill Bryson', 'James Gleick'],
    bgGradient: 'from-teal-500/10 to-emerald-500/10'
  }
];

export const MOCK_LIBRARY_STATS: LibraryStats = {
  totalBooks: 25,
  totalCategories: 6,
  availableToRead: 22,
  activeMembers: 3420,
  monthlyBorrows: 812
};

export const MOCK_BOOKS: Book[] = [
  {
    id: 'bk-01',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    category: 'Arts & Humanities',
    year: 2020,
    pages: 288,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0525559474',
    publisher: 'Viking Books',
    featured: true,
    rating: 4.8,
    ratingCount: 142,
    coverColor: '#1e293b',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'Between life and death there is a library where shelves go on forever and every book offers a chance to try another life.',
    description: 'Somewhere out beyond the edge of the universe there is a library that contains an infinite number of books, each one the story of another reality. One tells the story of your life as it is, along with another book for the other life you could have lived if you had made a different choice at any point in your life. Nora Seed finds herself faced with the possibility of changing her life for a new one.',
    content: {
      tableOfContents: ['A Conversation About Rain', 'The Nineteen Years Later', 'The Man at the Door', 'The Library of Infinite Possibilities', 'The Midnight Hour'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: A Conversation About Rain',
          pages: [
            'Nineteen years before she decided to die, Nora Seed sat in the warmth of the small library at Hazeldene School in the town of Bedford. She was staring at a chessboard on a low table, hands tucked inside the sleeves of her wool sweater.\n\n"Rain again," Mrs. Elm said, her fingers clicking over a wooden rook. "It always rains when Mrs. Bancroft does the garden show." Mrs. Elm had worked in the school library for longer than anyone remembered. Her silver spectacles hung from a beaded chain around her collar.\n\nNora moved her pawn to E4. She loved the silence of libraries, the dust motes dancing in the amber shafts of window light, the feeling that every single shelf contained thousands of whispered adventures.',
            'Mrs. Elm leaned forward, peering at Nora with gentle curiosity. "You have your whole life ahead of you, Nora. You can be anything. A swimmer, an astronomer, a musician, a botanist. That is the great mystery of youth."\n\nNora smiled faintly, though her stomach carried a knot of quiet anxieties. Her father wanted her in the pool. Her brother wanted her on stage with their band. Her own desires were fragmented like autumn leaves caught in a gust.\n\n"Sometimes," Nora murmured, "having too many choices feels exactly like having none at all."'
          ]
        },
        {
          id: 2,
          title: 'Chapter 2: The Library of Infinite Possibilities',
          pages: [
            'The clock stood still at precisely 00:00:00. The air smelled of old paper, binding glue, and a faint hint of peppermint tea.\n\nNora opened her eyes to discover endless shelves stretching into the celestial mist. Tall emerald shelves with dark wooden ladders on rolling brass tracks. There were no walls, no ceiling—only millions of volumes bound in rich shades of green, midnight blue, and burgundy.\n\n"Welcome back, Nora," a familiar voice echoed softly.\n\nStanding behind a long desk made of polished mahogany was Mrs. Elm, smiling warmly as if nineteen years had never slipped by.',
            '"Are you dead?" Nora whispered, her breath visible in the chilled quiet.\n\n"Not dead," replied Mrs. Elm. "Between life and death there is a library. Every book here represents an alternate path. A life where you became a glaciologist in Svalbard. A life where you married Dan. A life where you stayed with The Labyrinths. Would you like to read one?"'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-02',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    category: 'Science & Mathematics',
    year: 1988,
    pages: 256,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0553380163',
    publisher: 'Bantam Books',
    featured: true,
    rating: 4.9,
    ratingCount: 310,
    coverColor: '#0f172a',
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'Hawking’s landmark survey of cosmology explores black holes, time travel, and the origins of our universe.',
    description: 'A landmark volume in science writing by one of the great minds of our time, Stephen Hawking’s book explores such profound questions as: How did the universe begin? Can time leap backward? Is there an ultimate theory of everything? With clarity and wit, Hawking guides readers across spacetime, black holes, quarks, and general relativity.',
    content: {
      tableOfContents: ['Our Picture of the Universe', 'Space and Time', 'The Expanding Universe', 'The Uncertainty Principle'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: Our Picture of the Universe',
          pages: [
            'A well-known scientist once gave a public lecture on astronomy. He described how the earth orbits around the sun and how the sun, in turn, orbits around the center of a vast collection of stars called our galaxy.\n\nAt the end of the lecture, a little old lady at the back of the room got up and said: "What you have told us is rubbish. The world is really a flat plate supported on the back of a giant tortoise."\n\nThe scientist gave a superior smile before replying, "What is the tortoise standing on?"\n\n"You\'re very clever, young man, very clever," said the old lady. "But it\'s turtles all the way down!"',
            'Most people would find the picture of our universe as an infinite tower of tortoises rather ridiculous, but why do we think we know better? What do we know about the universe, and how do we know it? Where did the universe come from, and where is it going? Did the universe have a beginning, and if so, what happened before then? What is the nature of time? Will it ever come to an end?\n\nRecent breakthroughs in physics, made possible in part by fantastic new technologies, suggest answers to some of these longstanding questions.'
          ]
        },
        {
          id: 2,
          title: 'Chapter 2: Space and Time',
          pages: [
            'Our present ideas about the motion of bodies date back to Galileo and Newton. Before them, people believed Aristotle, who stated that the natural state of a body was to be at rest and that it moved only if driven by a force or impulse.\n\nIt followed that a heavy body should fall faster than a light one because it would have a greater pull toward the earth. The Aristotelian tradition held sway for nearly two thousand years until Galileo showed experimentally that bodies of different weights accelerate at identical rates in the absence of air resistance.',
            'Newton used Galileo’s measurements as the foundation for his laws of motion. But Newton was also deeply troubled by the lack of an absolute standard of rest. Two centuries later, Albert Einstein completed the revolution with the Special Theory of Relativity: space and time are not separate entities, but woven together into a dynamic spacetime fabric.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-03',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Computer & Information Technology',
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
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'A handbook of agile software craftsmanship for creating readable, robust, and maintainable software systems.',
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. Clean Code presents revolutionary principles, patterns, and practices of writing clean, elegant code with clarity.',
    content: {
      tableOfContents: ['Clean Code Principles', 'Meaningful Names', 'Functions', 'Comments and Formatting'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: Clean Code Principles',
          pages: [
            'There are two things required for writing clean software: knowledge and work. Knowledge teaches you principles, patterns, practices, and heuristics. Work is the deliberate craftsmanship of doing it over and over again.\n\nLook at your codebase. Does it read like well-written prose? Can another engineer understand the intent of your functions within ten seconds?\n\nBjarne Stroustrup, inventor of C++, said: "I like my code to be elegant and efficient. The logic should be straightforward to make it hard for bugs to hide, the dependencies minimal to ease maintenance."',
            'Grady Booch noted: "Clean code is simple and direct. Clean code never obscures the designer’s intent but rather is full of crisp abstractions and straightforward lines of control."\n\nThe Boy Scout Rule applies directly to software: Leave the campground cleaner than you found it. Whenever you check in a module, make it slightly better than when you checked it out.'
          ]
        },
        {
          id: 2,
          title: 'Chapter 2: Meaningful Names',
          pages: [
            'Names are everywhere in software. We name our variables, our functions, our arguments, classes, and packages. We name our source files and the directories that contain them.\n\nBecause we do so much of it, we’d better do it well. A good name should answer all the big questions: Why does it exist? What does it do? How is it used?\n\nIf a variable requires a comment to explain what it holds, the name has failed. Prefer `elapsedTimeInDays` over `d` or `val`. Clarity always trumps clever brevity.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-04',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    category: 'Arts & Humanities',
    year: 2014,
    pages: 443,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0062316097',
    publisher: 'Harper',
    featured: true,
    rating: 4.9,
    ratingCount: 480,
    coverColor: '#78350f',
    cover: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'Explores how an insignificant ape became the ruler of planet Earth through three major revolutions.',
    description: 'One hundred thousand years ago, at least six different species of humans inhabited Earth. Yet today there is only one: Homo sapiens. What happened to the others? And what may happen to us? Yuval Noah Harari spans the whole of human history, from the very first humans to walk the earth to the radical, and sometimes devastating, breakthroughs of the Cognitive, Agricultural, and Scientific Revolutions.',
    content: {
      tableOfContents: ['An Animal of No Significance', 'The Tree of Knowledge', 'A Day in the Life of Adam and Eve', 'The Flood'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: An Animal of No Significance',
          pages: [
            'About 13.5 billion years ago, matter, energy, time and space came into being in what is known as the Big Bang. The story of these fundamental features of our universe is called physics.\n\nAbout 300,000 years after their appearance, matter and energy started to coalesce into complex structures, called atoms, which then combined into molecules. The story of atoms, molecules and their interactions is called chemistry.',
            'About 3.8 billion years ago, on a planet called Earth, certain molecules combined to form particularly large and intricate structures called organisms. The story of organisms is called biology.\n\nAnd about 70,000 years ago, organisms belonging to the species Homo sapiens started to frame even more elaborate structures called cultures. The subsequent development of these human cultures is called history.\n\nThree important revolutions shaped the course of history: the Cognitive Revolution kick-started history about 70,000 years ago. The Agricultural Revolution sped it up about 12,000 years ago. The Scientific Revolution, which got under way only 500 years ago, may well end history and start something completely different.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-05',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self Development & Psychology',
    year: 2018,
    pages: 320,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0735211292',
    publisher: 'Avery',
    featured: true,
    rating: 4.9,
    ratingCount: 520,
    coverColor: '#b45309',
    cover: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'An easy and proven way to build good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.',
    description: 'No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear, one of the world’s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.',
    content: {
      tableOfContents: ['The Surprising Power of Atomic Habits', 'How Your Habits Shape Your Identity', 'The 4 Laws of Behavior Change'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: The Surprising Power of Atomic Habits',
          pages: [
            'The fate of British Cycling changed one day in 2003. The governing body for professional cycling in Great Britain hired Dave Brailsford as its new performance director.\n\nAt the time, professional cyclists in Great Britain had endured nearly one hundred years of mediocrity. Since 1907, British riders had won just a single gold medal at the Olympic Games. What made Brailsford different was his relentless commitment to a strategy that he referred to as "the aggregation of marginal gains."',
            'The whole principle came from the idea that if you broke down everything you could think of that goes into riding a bike, and then improved it by 1 percent, you will get a significant increase when you put them all together.\n\nBrailsford began by making small adjustments: redesigned bike seats for comfort, rubbing alcohol on tires for better grip, electrically heated overpants to maintain muscle temperature. In just five years, the British cycling team dominated the 2008 Olympic Games in Beijing, winning an astonishing 60 percent of the road and track cycling gold medals.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-06',
    title: 'The Joy of x',
    author: 'Steven Strogatz',
    category: 'Science & Mathematics',
    year: 2012,
    pages: 336,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0547517650',
    publisher: 'Houghton Mifflin Harcourt',
    featured: true,
    rating: 4.8,
    ratingCount: 165,
    coverColor: '#4338ca',
    cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'A guided tour of mathematics from one to infinity, connecting numbers to pop culture, literature, and philosophy.',
    description: 'Mathematics is all around us, often hidden in plain sight. Steven Strogatz presents a delightful guided tour of math, showing how numbers, arithmetic, geometry, calculus, and topology illuminate music, architecture, modern technology, and human relationships.',
    content: {
      tableOfContents: ['From One to Infinity', 'Shapes in Motion', 'The Power of Calculus'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: From One to Infinity',
          pages: [
            'I have a friend who hates math. He says numbers feel cold, tyrannical, and unforgiving. If a calculation is wrong, it is wrong, with no room for poetry or interpretation.\n\nYet to those who understand its song, mathematics is pure creative freedom. It is the language with which the universe whispers its deepest patterns. Look at the ripples on a pond when a pebble drops, or the spiral of sunflower seeds: mathematics is the invisible architecture of nature.',
            'Consider the humble concept of zero. Ancient civilizations flourished for millennia without it. The Romans built aqueducts and conquerors conquered empires with Roman numerals, but try multiplying CLXIV by LXXVIII by hand! The introduction of zero transformed human computation into an art form accessible to all.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-07',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    category: 'Arts & Humanities',
    year: 1960,
    pages: 336,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0061120084',
    publisher: 'J. B. Lippincott & Co.',
    featured: false,
    rating: 4.9,
    ratingCount: 890,
    coverColor: '#334155',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'A gripping, heart-wrenching tale of coming-of-age in a South poisoned by virulent prejudice.',
    description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. Harper Lee examines with gentle humor and tender compassion the themes of racial injustice, destruction of innocence, and the quiet courage of doing what is right.',
    content: {
      tableOfContents: ['Maycomb County', 'Boo Radley', 'Atticus Finch'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: Maycomb County',
          pages: [
            'When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow. When it healed, and Jem’s fears of never being able to play football were assuaged, he was seldom self-conscious about his injury.\n\nMaycomb was an old town, but it was a tired old town when I first knew it. In rainy weather the streets turned to red slop; grass grew on the sidewalks, the courthouse sagged in the square. Somehow it was hotter then: men’s stiff collars wilted by nine in the morning.',
            'People moved slowly then. They ambled across the square, shuffled in and out of the stores around it, took their time about everything. A day was twenty-four hours long but seemed longer. There was no hurry, for there was nowhere to go, nothing to buy and no money to buy it with, nothing to see outside the boundaries of Maycomb County.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-08',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    category: 'Arts & Humanities',
    year: 1925,
    pages: 180,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0743273565',
    publisher: 'Charles Scribner\'s Sons',
    featured: false,
    rating: 4.6,
    ratingCount: 650,
    coverColor: '#1e1b4b',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'The quintessential novel of the Jazz Age and the tragic romance of Jay Gatsby and Daisy Buchanan.',
    description: 'Set on the prosperous Long Island of 1922, this classic novel provides a critical social history of America during the Roaring Twenties. Jay Gatsby, a mysterious millionaire, hosts lavish parties in hopes of rekindling his lost romance with the elusive Daisy Buchanan.',
    content: {
      tableOfContents: ['In My Younger Years', 'The Valley of Ashes', 'Gatsby\'s Mansion'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: In My Younger Years',
          pages: [
            'In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing anyone," he told me, "just remember that all the people in this world haven’t had the advantages that you’ve had."\n\nHe didn’t say any more, but we’ve always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.',
            'In consequence, I’m inclined to reserve all judgements, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores. The abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-09',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    category: 'Arts & Humanities',
    year: 1813,
    pages: 432,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0141439518',
    publisher: 'T. Egerton',
    featured: false,
    rating: 4.8,
    ratingCount: 920,
    coverColor: '#be185d',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'A classic comedy of manners following Elizabeth Bennet as she navigates love, society, and Mr. Darcy.',
    description: 'Jane Austen\'s masterpiece sparkles with wit and romance as the spirited Elizabeth Bennet matches wits with the aristocratic and haughty Mr. Darcy in Regency-era England.',
    content: {
      tableOfContents: ['A Truth Universally Acknowledged', 'The Arrival of Mr. Bingley', 'The Netherfield Ball'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: A Truth Universally Acknowledged',
          pages: [
            'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.\n\nHowever little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.',
            '"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"\n\nMr. Bennet replied that he had not.\n\n"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."\n\nMr. Bennet made no answer.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-10',
    title: 'The Pragmatic Programmer',
    author: 'Andy Hunt & Dave Thomas',
    category: 'Computer & Information Technology',
    year: 1999,
    pages: 352,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0201616224',
    publisher: 'Addison-Wesley Professional',
    featured: false,
    rating: 4.8,
    ratingCount: 380,
    coverColor: '#0f766e',
    cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'Your journey to mastery: practical advice and philosophies for software engineers of all experience levels.',
    description: 'The Pragmatic Programmer cuts through the increasing specialization and technicalities of modern software development to examine the core process: taking a requirement and producing working, maintainable code that delights users.',
    content: {
      tableOfContents: ['A Pragmatic Philosophy', 'A Pragmatic Approach', 'The Basic Tools'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: A Pragmatic Philosophy',
          pages: [
            'What distinguishes a pragmatic programmer? A pragmatist looks beyond the immediate problem, always seeking to place it in its larger context, always striving to be aware of the bigger picture.\n\nTip 1: Care About Your Craft. Why spend your life developing software unless you care about doing it well?\n\nTip 2: Think! About Your Work. Turn off the autopilot and take control. Constantly critique and appraise your work.',
            'Provide Options, Don’t Make Lame Excuses. When you find yourself saying, "I couldn’t get it to work," stop and examine why. Before you approach anyone to explain why something can’t be done, pause and listen to yourself. Run the conversation by another person or yourself in a mirror.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-11',
    title: 'Cosmos: A Personal Voyage',
    author: 'Carl Sagan',
    category: 'Science & Mathematics',
    year: 1980,
    pages: 365,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0345539434',
    publisher: 'Random House',
    featured: false,
    rating: 4.9,
    ratingCount: 410,
    coverColor: '#1e3a8a',
    cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'The story of fifteen billion years of cosmic evolution transforming matter and life into consciousness.',
    description: 'Cosmos traces fifteen billion years of cosmic evolution that transformed matter into life and consciousness, exploring science, history, human curiosity, and our fragile place on a pale blue dot.',
    content: {
      tableOfContents: ['The Shores of the Cosmic Ocean', 'One Voice in the Cosmic Fugue', 'The Harmony of Worlds'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: The Shores of the Cosmic Ocean',
          pages: [
            'The Cosmos is all that is or was or ever will be. Our feeblest contemplations of the Cosmos stir us—there is a tingling in the spine, a catch in the voice, a faint sensation, as if a distant memory, of falling from a height.\n\nWe know we are approaching the greatest of mysteries. The size and age of the Cosmos are beyond ordinary human understanding. Lost somewhere between immensity and eternity is our tiny planetary home.',
            'We are a way for the Cosmos to know itself. Some part of our being knows this is where we came from. We long to return. And we can, because the cosmos is also within us. We\'re made of star-stuff.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-12',
    title: 'Deep Work',
    author: 'Cal Newport',
    category: 'Self Development & Psychology',
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
    cover: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'Rules for focused success in a distracted world, teaching how to master complicated information and produce better results in less time.',
    description: 'Deep work is the ability to focus without distraction on a cognitively demanding task. It’s a skill that allows you to quickly master complicated information and produce better results in less time. Deep work will make you better at what you do and provide the sense of true fulfillment that comes from craftsmanship.',
    content: {
      tableOfContents: ['Deep Work is Valuable', 'Deep Work is Rare', 'Deep Work is Meaningful'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: Deep Work is Valuable',
          pages: [
            'In the winter of 1922, Carl Jung made a bold move. He began construction on a stone tower in the village of Bollingen. He chose to live without electricity or telephone, chopping his own wood and pumping his own water.\n\nWhy did one of the most prominent intellectuals of Europe do this? Because Jung understood that breakthrough psychological insight demanded sustained, uninterrupted concentration.',
            'To thrive in the modern economy, you must master two core abilities:\n1. The ability to quickly master hard things.\n2. The ability to produce at an elite level, in terms of both quality and speed.\n\nNeither of these can be accomplished while tab-switching every three minutes.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-13',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Computer & Information Technology',
    year: 2017,
    pages: 616,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1449373320',
    publisher: 'O\'Reilly Media',
    featured: false,
    rating: 4.9,
    ratingCount: 340,
    coverColor: '#1e293b',
    cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'The definitive guide to the architecture, storage, and processing systems powering modern distributed platforms.',
    description: 'Data is at the center of many challenges in system design today. Difficult issues need to be figured out, such as scalability, consistency, reliability, efficiency, and maintainability. In addition, we have an overwhelming variety of tools to choose from. Martin Kleppmann helps you navigate this diverse landscape.',
    content: {
      tableOfContents: ['Reliable, Scalable, and Maintainable', 'Data Models and Query Languages', 'Storage and Retrieval'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: Reliable, Scalable, and Maintainable Systems',
          pages: [
            'Today, many applications are data-intensive, as opposed to compute-intensive. Raw CPU power is rarely a limiting factor for these applications—bigger problems are usually the amount of data, the complexity of data, and the speed at which it is changing.\n\nA data-intensive application is typically built from standard building blocks that provide commonly needed functionality: databases, caches, search indexes, stream processing, and batch processing.',
            'Three concerns are paramount in most software systems:\n\n1. Reliability: The system should continue to work correctly even in the face of adversity (hardware faults, software bugs, human error).\n2. Scalability: As the system grows in data volume, traffic volume, or complexity, there should be reasonable ways of dealing with that growth.\n3. Maintainability: Over time, many different people will work on the system, and they should all be able to work on it productively.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-14',
    title: 'The Silk Roads: A New History of the World',
    author: 'Peter Frankopan',
    category: 'Arts & Humanities',
    year: 2015,
    pages: 656,
    language: 'English',
    available: false,
    hasDigitalVersion: false,
    isbn: '978-1101912379',
    publisher: 'Bloomsbury Publishing',
    featured: false,
    rating: 4.7,
    ratingCount: 290,
    coverColor: '#854d0e',
    cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'An illuminating exploration of the networks that connected civilisations across Asia, the Middle East, and Europe.',
    description: 'For centuries, fame and fortune were to be found in the West—in the New World of the Americas. Today, it is the East which is calling those in search of adventure and riches. The Silk Roads is an ambitious and major reassessment of world history from an eastern vantage point.',
    content: undefined
  },
  {
    id: 'bk-15',
    title: 'Gödel, Escher, Bach',
    author: 'Douglas Hofstadter',
    category: 'Science & Mathematics',
    year: 1979,
    pages: 777,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0465026562',
    publisher: 'Basic Books',
    featured: false,
    rating: 4.8,
    ratingCount: 310,
    coverColor: '#4f46e5',
    cover: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'An eternal golden braid examining the mysteries of self-reference, cognition, symmetry, and intelligence.',
    description: 'Douglas Hofstadter’s Pulitzer Prize–winning book explores fascinating commonalities in the lives and works of logician Kurt Gödel, artist M.C. Escher, and composer Johann Sebastian Bach, exploring the nature of human consciousness and machine intelligence.',
    content: {
      tableOfContents: ['The Three-Part Invention', 'Two-Part Invention', 'Sonata into Cannon'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: The Three-Part Invention',
          pages: [
            'Achilles and the Tortoise are strolling along a tranquil garden path, exchanging philosophical reflections on music and geometry.\n\n"You see," Achilles muses, "there is a peculiar beauty in a fugue where voices chase one another in intricate inversions, yet harmonize perfectly into a higher unity."',
            '"Indeed," replies the Tortoise, adjusting his spectacles. "And what could be more intriguing than a statement that talks about itself? It is like a hand drawing the very hand that is drawing it."'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-16',
    title: 'The Odyssey',
    author: 'Homer',
    category: 'Arts & Humanities',
    year: 800,
    pages: 416,
    language: 'English (Translated)',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0140268866',
    publisher: 'Penguin Classics',
    featured: false,
    rating: 4.7,
    ratingCount: 420,
    coverColor: '#881337',
    cover: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'The epic ancient Greek poem recounting Odysseus’ ten-year voyage home from the Trojan War.',
    description: 'One of the foundation stones of Western literature, Homer’s epic tells of Odysseus’ decade-long peril-filled journey home to Ithaca after the fall of Troy, meeting Cyclopes, Sirens, and vengeful gods.',
    content: {
      tableOfContents: ['The Wanderer', 'The Lotus Eaters', 'The Return to Ithaca'],
      chapters: [
        {
          id: 1,
          title: 'Book 1: The Wanderer',
          pages: [
            'Sing to me of the man, Muse, the man of twists and turns driven time and again off course, once he had plundered the hallowed heights of Troy.\n\nMany cities of men he saw and learned their minds, many pains he suffered, heartsick on the open sea, fighting to save his life and bring his comrades home.',
            'Launch out on his story, Muse, daughter of Zeus, start from where you will—sing for our time too.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-17',
    title: 'A Short History of Nearly Everything',
    author: 'Bill Bryson',
    category: 'General Knowledge & Reference',
    year: 2003,
    pages: 544,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0767908184',
    publisher: 'Broadway Books',
    featured: false,
    rating: 4.8,
    ratingCount: 470,
    coverColor: '#0d9488',
    cover: 'https://images.unsplash.com/photo-1507842229450-76c12361fe16?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'A witty, accessible quest from the Big Bang to the rise of human civilisation by master travel writer Bill Bryson.',
    description: 'Bill Bryson took himself off on a journey to discover how we got from there being nothing at all to there being us. The result is a profoundly entertaining and clear journey across geology, physics, paleontology, and astronomy.',
    content: {
      tableOfContents: ['How to Build a Universe', 'Welcome to the Solar System', 'The Size of the Earth'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: How to Build a Universe',
          pages: [
            'Tune your television to any channel it doesn\'t receive, and about 1 percent of the dancing static you see is accounted for by the ancient remnant of the Big Bang. The next time you complain that there is nothing on, remember you can always watch the birth of the universe.\n\nConsider what had to happen for you to be here right now. Atoms had to assemble themselves in a precise, exquisitely cooperative arrangement to produce you.',
            'Why atoms take this trouble is a bit of a puzzle. Being you is not a gratifying experience at the atomic level. For all their devoted attention to you, your atoms don\'t actually care about you—indeed, don\'t even know that you are there.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-18',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    category: 'Self Development & Psychology',
    year: 2011,
    pages: 499,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0374533557',
    publisher: 'Farrar, Straus and Giroux',
    featured: false,
    rating: 4.7,
    ratingCount: 560,
    coverColor: '#d97706',
    cover: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'Nobel laureate Daniel Kahneman explains the two systems that drive the way we think: intuition and deliberative logic.',
    description: 'In the international bestseller, Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think: System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical.',
    content: {
      tableOfContents: ['Two Systems', 'Heuristics and Biases', 'Overconfidence'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: Two Systems',
          pages: [
            'To observe your mind in automatic mode, glance at the expression on the face of a passerby. In an instant, you know she is cheerful, distracted, or angry.\n\nNow look at the following problem: 17 × 24. You know immediately that this is a multiplication problem, and you probably know that you can solve it. But without a bit of effort, you cannot know the answer instantly.',
            'Psychologists Keith Stanovich and Richard West proposed the terms System 1 and System 2 to describe these two distinct cognitive engines.\nSystem 1 operates automatically and quickly, with little or no effort.\nSystem 2 allocates attention to effortful mental operations that demand it.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-19',
    title: 'The Information: A History, a Theory, a Flood',
    author: 'James Gleick',
    category: 'General Knowledge & Reference',
    year: 2011,
    pages: 544,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-1400096237',
    publisher: 'Pantheon',
    featured: false,
    rating: 4.8,
    ratingCount: 210,
    coverColor: '#0f766e',
    cover: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'The story of how information transformed human thought from African talking drums to the bits and bytes of the internet.',
    description: 'A fascinating chronicle of how human culture has communicated through drums, alphabets, telegraphs, and code, leading to our present age of digital saturation.',
    content: {
      tableOfContents: ['Drums That Talk', 'The Persistence of the Word', 'Two Decisive Bits'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: Drums That Talk',
          pages: [
            'In 1877, when the explorer Henry Morton Stanley was canoeing down the Congo River, he heard drums sounding warnings ahead of him from village to village.\n\nThe drums were not merely sending signals like smoke in the wind; they were speaking in poetry and syntax.',
            'To the European ear, it was primitive noise. To the listeners in the rainforest, it was high-bandwidth communication carrying intricate warnings and council announcements across hundreds of miles of jungle canopy.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-20',
    title: 'Fermat\'s Enigma',
    author: 'Simon Singh',
    category: 'Science & Mathematics',
    year: 1997,
    pages: 315,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0385493628',
    publisher: 'Anchor',
    featured: false,
    rating: 4.9,
    ratingCount: 275,
    coverColor: '#3730a3',
    cover: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'The epic 350-year intellectual quest to solve the greatest mathematical puzzle of all time.',
    description: 'In 1963, a ten-year-old schoolboy named Andrew Wiles stumbled across a math book containing Fermat\'s Last Theorem. Thirty years later, after seven years of secret solitary work in an attic, he announced to a stunned audience that the puzzle was solved.',
    content: {
      tableOfContents: ['"I Think I\'ll Stop Here"', 'The Riddler', 'A Disgrace to Mathematics'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: "I Think I\'ll Stop Here"',
          pages: [
            'It was the most important mathematics lecture of the century. Two hundred mathematicians sat spellbound in the auditorium of the Isaac Newton Institute in Cambridge.\n\nAndrew Wiles wrote on the blackboard the final equation connecting modular forms and elliptic curves. He turned to the audience, put down the chalk, and said quietly: "I think I\'ll stop here."\n\nStunned silence gave way to thunderous applause.',
            'Pierre de Fermat had scribbled in the margin of his copy of Diophantus’ Arithmetica in 1637: "I have discovered a truly marvelous proof of this theorem, but this margin is too narrow to contain it." For three and a half centuries, that margin haunted mathematics.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-21',
    title: 'Guns, Germs, and Steel',
    author: 'Jared Diamond',
    category: 'Arts & Humanities',
    year: 1997,
    pages: 480,
    language: 'English',
    available: false,
    hasDigitalVersion: false,
    isbn: '978-0393317558',
    publisher: 'W. W. Norton & Company',
    featured: false,
    rating: 4.6,
    ratingCount: 420,
    coverColor: '#57534e',
    cover: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'The fates of human societies explained through geographic and environmental factors rather than biology.',
    description: 'Diamond convincingly argues that geographical and environmental factors shaped the modern world. Societies that had a head start in food production advanced past hunter-gatherer stages, leading to the development of writing, technology, government, and resistance to germs.',
    content: undefined
  },
  {
    id: 'bk-22',
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    category: 'Computer & Information Technology',
    year: 2009,
    pages: 1312,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0262033848',
    publisher: 'MIT Press',
    featured: false,
    rating: 4.8,
    ratingCount: 390,
    coverColor: '#111827',
    cover: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'The foundational university text covering algorithmic design, asymptotic notation, data structures, and graph algorithms.',
    description: 'Commonly known as CLRS, this comprehensive textbook combines rigor and comprehensiveness. It covers sorting, trees, dynamic programming, greedy algorithms, and graph theory with mathematical precision.',
    content: {
      tableOfContents: ['The Role of Algorithms in Computing', 'Getting Started', 'Growth of Functions'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: The Role of Algorithms in Computing',
          pages: [
            'What are algorithms? Informally, an algorithm is any well-defined computational procedure that takes some value, or set of values, as input and produces some value, or set of values, as output.\n\nAn algorithm is thus a sequence of computational steps that transform the input into the output.\n\nWe can also view an algorithm as a tool for solving a well-specified computational problem.',
            'For example, one might need to sort a sequence of numbers into nondecreasing order. This problem arises frequently in practice and provides fertile ground for introducing many standard design techniques and analysis tools.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-23',
    title: 'Man\'s Search for Meaning',
    author: 'Viktor E. Frankl',
    category: 'Arts & Humanities',
    year: 1946,
    pages: 165,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0807014295',
    publisher: 'Beacon Press',
    featured: false,
    rating: 4.9,
    ratingCount: 710,
    coverColor: '#701a75',
    cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'Psychiatrist Viktor Frankl\'s memoir of life in Nazi death camps and his development of logotherapy.',
    description: 'Frankl argues that we cannot avoid suffering, but we can choose how to cope with it, find meaning in it, and move forward with renewed purpose. A profound testament to the resilience of the human spirit.',
    content: {
      tableOfContents: ['Experiences in a Concentration Camp', 'Logotherapy in a Nutshell', 'Postscript 1984'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: Experiences in a Concentration Camp',
          pages: [
            'This book does not claim to be an account of facts and events, but of personal experiences, experiences which millions of prisoners have suffered over and over again.\n\nIt is the inside story of a concentration camp, told by one of its survivors.',
            'Everything can be taken from a man but one thing: the last of the human freedoms—to choose one’s attitude in any given set of circumstances, to choose one’s own way.'
          ]
        }
      ]
    }
  },
  {
    id: 'bk-24',
    title: 'The Selfish Gene',
    author: 'Richard Dawkins',
    category: 'Science & Mathematics',
    year: 1976,
    pages: 360,
    language: 'English',
    available: true,
    hasDigitalVersion: true,
    isbn: '978-0199291151',
    publisher: 'Oxford University Press',
    featured: false,
    rating: 4.7,
    ratingCount: 310,
    coverColor: '#0369a1',
    cover: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=600',
    shortDescription: 'The revolutionary evolutionary biology book that introduced the gene-centered view of evolution and the word "meme".',
    description: 'Dawkins argues that natural selection acts on the level of the replicator—the gene—rather than the individual organism or species, reshaping modern understanding of biology and social behavior.',
    content: {
      tableOfContents: ['Why Are People?', 'The Replicators', 'Immortal Coils'],
      chapters: [
        {
          id: 1,
          title: 'Chapter 1: Why Are People?',
          pages: [
            'Intelligent life on a planet comes of age when it first works out the reason for its own existence. If superior creatures from space ever visit earth, the first question they will ask, in order to assess the level of our civilization, is: "Have they discovered evolution yet?"\n\nLiving organisms had existed on earth, without ever knowing why, for over three thousand million years before the truth finally dawned on one of them. His name was Charles Darwin.',
            'We are survival machines—robot vehicles blindly programmed to preserve the selfish molecules known as genes. This is a truth which still fills me with astonishment.'
          ]
        }
      ]
    }
  }
];
