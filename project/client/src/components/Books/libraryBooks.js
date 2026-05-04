import imgAcademic from '../../images/AcademicBook.png'
import imgJournal from '../../images/JournalBook.png'
import imgCivilWar from '../../images/TheCivilWar.png'
import imgNovel from '../../images/NovelBook.png'
import imgSedgewick from '../../images/Sedgewick.png'

/** @typedef {'academic' | 'journal' | 'novel'} LibraryCategory */

/**
 * @typedef {{
 *   id: number,
 *   img: string,
 *   title: string,
 *   author: string,
 *   rating: number,
 *   summary: string,
 *   status: 'available' | 'on-loan',
 *   category: LibraryCategory,
 *   genre?: string
 * }} LibraryBook
 */

/**
 * Demo catalog: cover art is placeholder stock from the repo; summaries describe the real titles where applicable.
 * @type {LibraryBook[]}
 */
export const books = [
  {
    id: 1,
    img: imgAcademic,
    category: 'academic',
    title: 'The Computer Science Book',
    author: 'Thomas Johnson',
    rating: 4.6,
    status: 'available',
    summary:
      'A wide-angle introduction to computer science—how programs represent information, how algorithms solve problems, and how all the pieces fit together for newcomers.',
  },
  {
    id: 2,
    img: imgNovel,
    category: 'novel',
    genre: 'Fiction',
    title: 'The Nature of Code',
    author: 'Daniel Shiffman',
    rating: 4.9,
    status: 'available',
    summary:
      'Builds simulations and visual sketches (often with Processing) by borrowing ideas from physics and biology—excellent if you learn by coding motion, forces, and systems.',
  },
  {
    id: 3,
    img: imgJournal,
    category: 'journal',
    title: 'Structure and Interpretation of Computer Programs',
    author: 'Harold Abelson, Gerald Jay Sussman, and Julie Sussman',
    rating: 4.8,
    status: 'available',
    summary:
      'The influential “SICP” curriculum: programs as symbolic expressions, abstraction, recursion, and interpreters—usually taught with Scheme, with lessons that carry over to any language.',
  },
  {
    id: 4,
    img: imgAcademic,
    category: 'academic',
    title: 'Introduction to Java Programming',
    author: 'K. Somasundaram',
    rating: 4.4,
    status: 'available',
    summary:
      'A practical path through Java syntax, object-oriented design, and core APIs, with exercises aimed at students getting comfortable writing and debugging real programs.',
  },
  {
    id: 5,
    img: imgCivilWar,
    category: 'journal',
    title: 'The Code Book',
    author: 'Simon Singh',
    rating: 4.7,
    status: 'available',
    summary:
      'A popular history of cryptography—from ancient substitution ciphers to Enigma and public-key crypto—written for a general audience, with the politics and personalities behind the math.',
  },
  {
    id: 6,
    img: imgSedgewick,
    category: 'academic',
    title: 'Algorithms',
    author: 'Robert Sedgewick and Kevin Wayne',
    rating: 4.8,
    status: 'available',
    summary:
      'Algorithms and data structures with clear explanations and code, aligned with the Princeton/online treatment—strong for analysis, proofs, and implementation practice.',
  },
  {
    id: 7,
    img: imgSedgewick,
    category: 'academic',
    title: 'Computer Science: An Interdisciplinary Approach',
    author: 'Robert Sedgewick and Kevin Wayne',
    rating: 4.7,
    status: 'available',
    summary:
      'Companion to their broader CS program: programming, scientific computation, and data—connecting code to math, science, and real datasets rather than isolated syntax drills.',
  },
  {
    id: 8,
    img: imgNovel,
    category: 'novel',
    genre: 'Fiction',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    rating: 4.5,
    status: 'available',
    summary:
      'Software craftsmanship through naming, small functions, error handling, and refactoring patterns—focused on keeping large systems readable as teams and requirements change.',
  },
]

/**
 * @param {string | undefined} rawId
 * @returns {LibraryBook | undefined}
 */
export function getBookById(rawId) {
  if (rawId == null || rawId === '') return undefined
  return books.find((b) => String(b.id) === String(rawId))
}

/**
 * @param {LibraryCategory} category
 * @returns {LibraryBook[]}
 */
export function getBooksByCategory(category) {
  return books.filter((b) => b.category === category)
}

/**
 * @param {string | undefined} rawId
 * @returns {{ prev?: LibraryBook, next?: LibraryBook }}
 */
export function getAdjacentBooks(rawId) {
  const idx = books.findIndex((b) => String(b.id) === String(rawId))
  if (idx === -1) return {}
  return {
    prev: books[idx - 1],
    next: books[idx + 1],
  }
}
