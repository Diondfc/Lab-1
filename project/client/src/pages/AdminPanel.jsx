import React from 'react';
import Book from '../images/JournalBook.png';
import Loans from '../images/NovelBook.png';
import Dashboard from '../images/Logo.png';
import JournalsChat from '../images/TheCivilWar.png';
import AcademicChat from '../images/Sedgewick.png';
import NovelsChat from '../images/WhiteNights.png.webp';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const navigate = useNavigate();

    return (
        <div className="flex w-full max-w-6xl flex-col items-center self-center px-4 py-4">
            <h2 className="grid w-full place-items-center rounded-lg bg-gradient-to-r from-emerald-600 to-green-800 py-3 font-poppins text-3xl font-bold text-white">Administrator Panel</h2>
            <div className="flex justify-center space-x-4 mb-8">
                <div className="bg-gradient-to-r from-emerald-600/50 to-green-800/50 rounded-lg p-4 w-1/4 flex flex-col items-center">
                    <img src={Book} alt="Book" className="mb-2 rounded-lg" />
                    <button
                        className="border border-emerald-700 text-emerald-700 hover:bg-emerald-700/10 font-poppins rounded-xl px-4 py-2 w-full bg-transparent"
                        onClick={() => navigate('/admin/add-book')}
                    >
                        Add Book
                    </button>
                </div>
                <div className="bg-gradient-to-r from-emerald-600/50 to-green-800/50 rounded-lg p-4 w-1/4 flex flex-col items-center">
                    <img src={Loans} alt="Loans" className="mb-2 rounded-lg" />
                    <button
                        className="border border-emerald-700 text-emerald-700 hover:bg-emerald-700/10 font-poppins rounded-xl px-4 py-2 w-full bg-transparent"
                        onClick={() => navigate('/admin/journals-dashboard')}
                    >
                        Journals Dashboard
                    </button>
                </div>
                <div className="bg-gradient-to-r from-emerald-600/50 to-green-800/50 rounded-lg p-4 w-1/4 flex flex-col items-center">
                    <img src={Dashboard} alt="Dashboard" className="mb-2 rounded-lg" />
                    <button
                        className="border border-emerald-700 text-emerald-700 hover:bg-emerald-700/10 font-poppins rounded-xl px-4 py-2 w-full bg-transparent"
                        onClick={() => navigate('/events/dashboard')}
                    >
                        Events Dashboard
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="bg-gradient-to-r from-emerald-600/50 to-green-800/50 rounded-lg p-4 w-1/4 min-w-[200px] flex flex-col items-center">
                    <img src={AcademicChat} alt="Academic dashboard" className="mb-2 rounded-lg" />
                    <button
                        className="border border-emerald-700 text-emerald-700 hover:bg-emerald-700/10 font-poppins rounded-xl px-4 py-2 w-full bg-transparent"
                        onClick={() => navigate('/admin/academic-dashboard')}
                    >
                        Academic Dashboard
                    </button>
                </div>
                <div className="bg-gradient-to-r from-emerald-600/50 to-green-800/50 rounded-lg p-4 w-1/4 min-w-[200px] flex flex-col items-center">
                    <img src={NovelsChat} alt="Novels dashboard" className="mb-2 rounded-lg" />
                    <button
                        className="border border-emerald-700 text-emerald-700 hover:bg-emerald-700/10 font-poppins rounded-xl px-4 py-2 w-full bg-transparent"
                        onClick={() => navigate('/admin/novels-dashboard')}
                    >
                        Novels Dashboard
                    </button>
                </div>
            </div>
            <h2 className="mt-4 grid w-full place-items-center rounded-lg bg-gradient-to-r from-emerald-600 to-green-800 py-3 font-poppins text-3xl font-bold text-white">Bookclub Chatrooms</h2>
            <div className="flex justify-center space-x-4 mb-8">
                <div className="bg-gradient-to-r from-emerald-600/50 to-green-800/50 rounded-lg p-4 w-1/4 flex flex-col items-center">
                    <img src={JournalsChat} alt="JournalsChat" className="mb-2 rounded-lg" />
                    <button
                        className="border border-emerald-700 text-emerald-700 hover:bg-emerald-700/10 font-poppins rounded-xl px-4 py-2 w-full bg-transparent"
                        onClick={() => navigate('/journals')}
                    >
                        Journals
                    </button>
                </div>
                <div className="bg-gradient-to-r from-emerald-600/50 to-green-800/50 rounded-lg p-4 w-1/4 flex flex-col items-center">
                    <img src={AcademicChat} alt="AcademicChat" className="mb-2 rounded-lg" />
                    <button
                        className="border border-emerald-700 text-emerald-700 hover:bg-emerald-700/10 font-poppins rounded-xl px-4 py-2 w-full bg-transparent"
                        onClick={() => navigate('/academic')}
                    >
                        Academic Literature
                    </button>
                </div>
                <div className="bg-gradient-to-r from-emerald-600/50 to-green-800/50 rounded-lg p-4 w-1/4 flex flex-col items-center">
                    <img src={NovelsChat} alt="NovelsChat" className="mb-2 rounded-lg" />
                    <button
                        className="border border-emerald-700 text-emerald-700 hover:bg-emerald-700/10 font-poppins rounded-xl px-4 py-2 w-full bg-transparent"
                        onClick={() => navigate('/novels')}
                    >
                        Novels
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;