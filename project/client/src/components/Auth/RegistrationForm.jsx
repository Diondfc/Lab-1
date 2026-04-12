import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RegistrationForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Student',
        colorCode: '#FFFFFF'
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Password needs one uppercase letter';
        if (!/[a-z]/.test(formData.password)) newErrors.password = 'Password needs one lowercase letter';
        if (!/\d/.test(formData.password)) newErrors.password = 'Password needs one number';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const payload = {
                Name: formData.name.trim(),
                Email: formData.email.trim().toLowerCase(),
                Password: formData.password,
                Role: formData.role,
                ColorCode: formData.colorCode
            };

            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setSuccessMessage('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            console.error('Registration Error:', error);
            setErrors({ api: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white p-8 md:p-10 space-y-5"
                >
                    <div className="text-center">
                        <h2 className="text-4xl font-extrabold text-slate-800">Create Account</h2>
                        <p className="text-slate-500 mt-2 text-sm">
                            Join the Library Management System
                        </p>
                    </div>

                    {successMessage && (
                        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm">
                            {successMessage}
                        </div>
                    )}

                    {errors.api && (
                        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {errors.api}
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-700 font-semibold mb-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                                errors.name
                                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-2">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                                errors.email
                                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="At least 8 characters"
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                                errors.password
                                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-2 leading-6">
                                {errors.password}
                                <br />
                                Requirements: Uppercase, lowercase, number
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-2">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat your password"
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                                errors.confirmPassword
                                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-2">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <input type="hidden" name="role" value="Student" />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-200 shadow-md ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </button>

                    <p className="text-center text-slate-600 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                            Login here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegistrationForm;