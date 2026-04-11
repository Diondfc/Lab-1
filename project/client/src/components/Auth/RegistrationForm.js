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
        <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] px-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md space-y-4">
                <h2 className="text-3xl font-bold text-[#036280] text-center">Sign Up</h2>
                
                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {successMessage}
                    </div>
                )}

                {errors.api && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {errors.api}
                    </div>
                )}

                {/* Name Field */}
                <div>
                    <label className="block text-[#012F4A] font-medium mb-1">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Email Field */}
                <div>
                    <label className="block text-[#012F4A] font-medium mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div>
                    <label className="block text-[#012F4A] font-medium mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="At least 8 characters"
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.password}
                            <br />
                            Requirements: Uppercase, lowercase, number
                        </p>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label className="block text-[#012F4A] font-medium mb-1">Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* Hidden Role Field (default 'Student' per your schema) */}
                <input type="hidden" name="role" value="Student" />

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full bg-[#00509D] text-white py-2 rounded-lg hover:bg-[#003f7d] transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? 'Creating Account...' : 'Register'}
                </button>

                <p className="text-center">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#00509D] hover:underline">
                        Login here
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default RegistrationForm;