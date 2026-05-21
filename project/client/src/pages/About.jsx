import React from 'react';
import { FiBook, FiUsers, FiClock, FiMapPin, FiPhone, FiMail, FiAward } from 'react-icons/fi';
import LibraryImage from '../images/LibraryImage.mp4';
import TeamImage from '../images/HeroSection.mp4';

const About = () => {
    const libraryStats = [
        { value: "50,000+", label: "Physical Books", icon: <FiBook className="text-3xl" /> },
        { value: "24/7", label: "Digital Resources", icon: <FiClock className="text-3xl" /> },
        { value: "100+", label: "Study Spaces", icon: <FiUsers className="text-3xl" /> },
        { value: "2010", label: "Established", icon: <FiAward className="text-3xl" /> }
    ];

    const services = [
        {
            title: "Book Search",
            description: "Quickly find any book in our physical collection through our comprehensive search system.",
            icon: <FiBook className="text-indigo-700 text-2xl" />
        },
        {
            title: "Book Club Chatrooms",
            description: "Join genre-specific discussion groups and connect with fellow readers.",
            icon: <FiUsers className="text-indigo-700 text-2xl" />
        },
        {
            title: "Loan Management",
            description: "Manage book loans and track due dates easily.",
            icon: <FiClock className="text-indigo-700 text-2xl" />
        }
    ];

    const contactInfo = [
        { icon: <FiMapPin className="text-indigo-700 text-xl" />, title: "Location", details: ["University for Business and Technology", "Library Building, Floor 2", "Pristina, Kosovo"] },
        { icon: <FiClock className="text-indigo-700 text-xl" />, title: "Hours", details: ["Monday-Friday: 8:00 AM - 8:00 PM", "Saturday: 10:00 AM - 4:00 PM", "Sunday: Closed"] },
        { icon: <FiMail className="text-indigo-700 text-xl" />, title: "Email", details: ["ubt.library.gateway@ubt-uni.net"] },
        { icon: <FiPhone className="text-indigo-700 text-xl" />, title: "Phone", details: ["+383 38 541 400"] }
    ];

    return (
        <div className="font-poppins bg-white dark:bg-slate-900 transition-colors duration-300">
            {/* Hero */}
            <div className="relative bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white py-20 rounded-b-[3rem] shadow-xl transition-colors duration-300">
                <div className="absolute inset-0 z-0 rounded-b-[3rem] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-950/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/40 transition-colors duration-300" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                </div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-slate-900 dark:text-white">
                        About <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-teal-400 dark:from-indigo-400 dark:to-teal-300">
                            UBT Library Gateway
                        </span>
                    </h1>
                    <p className="text-xl max-w-2xl mx-auto text-slate-500 dark:text-slate-400 leading-relaxed transition-colors duration-300">
                        Connecting knowledge seekers with world-class resources since 2010
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {libraryStats.map((stat, index) => (
                        <div 
                            key={index} 
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-white dark:border-slate-700 hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center text-center"
                        >
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                                {stat.icon}
                            </div>
                            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{stat.value}</h3>
                            <p className="text-slate-400 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mission */}
            <div className="py-16 bg-gray-50 dark:bg-slate-800/50 transition-colors duration-300">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 mb-8 md:pr-10">
                        <video autoPlay loop muted className="w-full rounded-xl shadow-lg">
                            <source src={LibraryImage} type="video/mp4" />
                        </video>
                    </div>
                    <div className="md:w-1/2">
                        <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-green-800 mb-6"></div>
                        <h2 className="text-3xl font-bold mb-4 dark:text-white">Our Mission</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-4">
                            We provide seamless access to knowledge and academic resources.
                        </p>
                        <p className="text-gray-600 dark:text-slate-400">
                            Our goal is to support learning, research, and innovation.
                        </p>
                    </div>
                </div>
            </div>

            {/* Team */}
            <div className="py-16 bg-white dark:bg-slate-900 transition-colors duration-300">
                <div className="container mx-auto px-4 flex flex-col md:flex-row-reverse items-center">
                    <div className="md:w-1/2 mb-8 md:pl-10">
                        <video autoPlay loop muted className="w-full rounded-xl shadow-lg">
                            <source src={TeamImage} type="video/mp4" />
                        </video>
                    </div>
                    <div className="md:w-1/2">
                        <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-green-800 mb-6"></div>
                        <h2 className="text-3xl font-bold mb-4 dark:text-white">Our Team</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-4">
                            A dedicated team supporting your academic journey.
                        </p>
                        <p className="text-gray-600 dark:text-slate-400">
                            Experts in research, tech, and library systems.
                        </p>
                    </div>
                </div>
            </div>

            {/* Services */}
            <div className="py-16 bg-gray-50 dark:bg-slate-800/50 transition-colors duration-300">
                <div className="container mx-auto px-4 text-center mb-12">
                    <h2 className="text-3xl font-bold mb-2 dark:text-white">Our Services</h2>
                    <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-green-800 mx-auto"></div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 px-4">
                    {services.map((service, index) => (
                        <div key={index} className="p-8 rounded-xl border border-indigo-700 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-700/10 dark:hover:bg-indigo-500/10 transition">
                            <div className="w-14 h-14 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                                {service.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-center">{service.title}</h3>
                            <p className="text-center">{service.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact */}
            <div className="py-16 bg-white dark:bg-slate-900 transition-colors duration-300">
                <div className="container mx-auto px-4 text-center mb-12">
                    <h2 className="text-3xl font-bold mb-2 dark:text-white">Contact Us</h2>
                    <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-green-800 mx-auto"></div>
                </div>

                <div className="rounded-xl p-8 border border-indigo-700 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400 mx-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {contactInfo.map((info, index) => (
                            <div key={index} className="text-center">
                                <div className="p-3 rounded-full border border-indigo-700 inline-block mb-4">
                                    {info.icon}
                                </div>
                                <h3 className="font-bold text-lg mb-2">{info.title}</h3>
                                {info.details.map((detail, i) => (
                                    <p key={i}>{detail}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonial */}
            <div className="py-16 bg-gradient-to-r from-indigo-600/10 to-green-800/10 dark:from-indigo-900/30 dark:to-green-900/30 transition-colors duration-300">
                <div className="container mx-auto px-4">
                    <div className="rounded-xl border border-indigo-700 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400 p-8 md:p-12 max-w-4xl mx-auto text-center">
                        <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-green-800 mx-auto mb-6"></div>
                        <h2 className="text-3xl font-bold mb-6">What Our Community Says</h2>
                        <p className="italic text-lg mb-6">
                            "The UBT Library Gateway transformed how I conduct research."
                        </p>
                        <p className="font-bold">- Dr. Arbër Kadriu</p>
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div className="py-16 bg-white dark:bg-slate-900 transition-colors duration-300">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-2 dark:text-white">UBT Location in Pristina</h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-indigo-600 to-green-800 mx-auto"></div>
                    </div>
                    
                    <div className="max-w-6xl mx-auto bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-3 shadow-lg">
                        <iframe
                            title="UBT Location in Pristina"
                            src="https://maps.google.com/maps?q=UBT-Dukagjini,%20Prishtina&t=&z=16&ie=UTF8&iwloc=&output=embed"
                            className="w-full h-[300px] md:h-[450px] rounded-xl"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;