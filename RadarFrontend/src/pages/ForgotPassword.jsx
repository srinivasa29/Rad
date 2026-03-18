import { useState } from 'react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) {
            setStatus('error');
            setMessage('Please enter your email address');
            return;
        }
        setStatus('loading');

        setTimeout(() => {
            setStatus('success');
            setMessage('Password reset link sent to ' + email);
        }, 1500);
    };

    return (
        <AuthLayout>
            <a href="/login" className="inline-flex items-center text-gray-500 hover:text-[#10706B] transition-colors mb-8 text-sm group font-medium">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Login
            </a>

            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-['Plus_Jakarta_Sans'] tracking-tight">Recover your account</h2>
                <p className="text-gray-500 text-sm font-medium">Enter your email to receive a reset link.</p>
            </div>

            {status === 'success' ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-100 rounded-xl p-8 text-center"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg mb-2">Check your inbox</h3>
                    <p className="text-gray-500 text-sm mb-6">{message}</p>
                    <button
                        onClick={() => setStatus('idle')}
                        className="text-[#10706B] text-sm hover:underline font-bold"
                    >
                        Try another email
                    </button>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {status === 'error' && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {message}
                        </div>
                    )}
                    <div>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#10706B] focus:ring-4 focus:ring-[#10706B]/5 hover:border-[#10706B]/50 transition-all text-sm font-medium"
                                placeholder="Email Address"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-[#10706B] text-white font-bold py-4 rounded-xl hover:bg-[#0D5C58] transition-all shadow-lg shadow-[#10706B]/20 text-sm tracking-[0.1em] uppercase mt-4"
                    >
                        {status === 'loading' ? 'SENDING LINK...' : 'SEND RESET LINK'}
                    </button>
                </form>
            )}

        </AuthLayout>
    );
}
