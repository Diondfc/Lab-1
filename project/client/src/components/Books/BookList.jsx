import React from "react";
import { Link } from "react-router-dom";
import { FiStar, FiArrowRight } from "react-icons/fi";
import Book1 from "../../images/Sedgewick.png";
import Book2 from "../../images/TheCivilWar.png";
import Book3 from "../../images/Sedgewick.png";
import Book4 from "../../images/TheCivilWar.png";
import Book5 from "../../images/Sedgewick.png";
import Book6 from "../../images/TheCivilWar.png";
import Book7 from "../../images/Sedgewick.png";
import Book8 from "../../images/TheCivilWar.png";

const booksData = [
    {
        id: 1,
        img: Book1,
        title: "The Computer Science Book",
        author: "Thomas Johnson",
    },
    {
        id: 2,
        img: Book2,
        title: "The Nature of Code",
        author: "Daniel Shiffman",
    },
    {
        id: 3,
        img: Book3,
        title: "Structure and Interpretation of Computer Programs",
        author: "Gerald Jay Sussman, Hal Abelson, and Julie Sussman",
    },
    {
        id: 4,
        img: Book4,
        title: "Introduction to Java Programming",
        author: "K. Somasundaram",
    },
    {
        id: 5,
        img: Book5,
        title: "The Code Book",
        author: "Simon Singh",
    },
    {
        id: 6,
        img: Book6,
        title: "Algorithms",
        author: "Robert Sedgewick, Kevin Wayne",
    },
    {
        id: 7,
        img: Book7,
        title: "Computer Science: An Interdisciplinary Approach",
        author: "Robert Sedgewick, Kevin Wayne",
    },
    {
        id: 8,
        img: Book8,
        title: "Clean Code",
        author: "Robert Cecil Martin",
    },
];

const BookList = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-16">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">Library Collection</h1>
                    <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-600 to-green-800 mx-auto rounded-full mb-6"></div>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore our comprehensive collection of computer science resources, programming guides, and academic literature.
                    </p>
                </div>

                {/* Card Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {booksData.map((book) => (
                        <div
                            key={book.id}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col group"
                        >
                            <div className="h-64 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-6 relative overflow-hidden">
                                <div className="absolute w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                                <img
                                    src={book.img}
                                    alt={book.title}
                                    className="h-full object-contain relative z-10 drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm shadow-sm px-2.5 py-1 rounded-full flex items-center text-sm font-semibold text-gray-700 z-20">
                                    <FiStar className="text-yellow-400 mr-1.5" />
                                    4.8
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex-grow">
                                    <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                                        {book.title}
                                    </h2>
                                    <p className="text-sm text-gray-600 line-clamp-2">By {book.author}</p>
                                </div>

                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50">
                                    <Link
                                        // to={`/book-details/${book.id}`}
                                        className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center text-sm group/link"
                                    >
                                        View Details
                                        <FiArrowRight className="ml-1.5 transform group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        Available
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default BookList;