import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Send, ArrowRight, Loader2 } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import api from '../api/api';

export default function VerifyEmail() {
    const { token: routeToken } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = routeToken || searchParams.get('token');

    const [status, setStatus] = useState(token ? 'loading' : 'idle');
    const [message, setMessage] = useState('');
    const [resendEmail, setResendEmail] = useState('');
    const [resendStatus, setResendStatus] = useState('idle'); // idle, loading, success, error
    const [resendMessage, setResendMessage] = useState('');

    useEffect(() => {
        if (token) {
            verifyToken();
        } else {
            const queryEmail = searchParams.get('email');
            if (queryEmail) {
                setResendEmail(queryEmail);
            }
        }
    }, [token, searchParams]);

    const verifyToken = async () => {
        try {
            setStatus('loading');
            const res = await api.get(`/auth/verify-email/${token}`);
            setStatus('success');
            setMessage(res.data.message || 'Your email has been verified successfully!');
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.error || 'Invalid or expired email verification link.');
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();
        if (!resendEmail) {
            setResendStatus('error');
            setResendMessage('Please enter your email address');
            return;
        }

        setResendStatus('loading');
        try {
            const res = await api.post('/auth/resend-verification', { email: resendEmail });
            setResendStatus('success');
            setResendMessage(res.data.message || 'Verification link sent successfully!');
        } catch (error) {
            setResendStatus('error');
            setResendMessage(error.response?.data?.error || 'Failed to send verification link.');
        }
    };

    return (
        <AuthLayout>
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-['Plus_Jakarta_Sans'] tracking-tight">
                    Account Verification
                </h2>
                <p className="text-gray-500 text-sm font-medium">
                    Confirm your email to unlock all terminal features.
                </p>
            </div>

            {status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="w-10 h-10 text-[#10706B] animate-spin mb-4" />
                    <p className="text-gray-600 text-sm font-semibold">Verifying your email address...</p>
                </div>
            )}

            {status === 'success' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-100 rounded-xl p-8 text-center"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg mb-2">Verified!</h3>
                    <p className="text-gray-500 text-sm mb-6">{message}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-[#10706B] text-white font-bold py-4 rounded-xl hover:bg-[#0D5C58] transition-all shadow-lg shadow-[#10706B]/20 text-sm tracking-[0.1em] uppercase flex items-center justify-center gap-2"
                    >
                        Go to Login <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {(status === 'error' || status === 'idle') && (
                <div className="space-y-6">
                    {status === 'error' && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Verification Failed</span>
                                <p className="mt-1 text-xs text-red-500">{message}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleResend} className="space-y-4">
                        <div className="border-t border-gray-100 pt-6">
                            <h4 className="text-sm font-bold text-gray-900 mb-2">Resend Verification Email</h4>
                            <p className="text-gray-500 text-xs mb-4">
                                Enter your email below to receive a new verification link.
                            </p>

                            {resendStatus === 'success' && (
                                <div className="p-3 mb-4 bg-green-50 text-green-600 text-xs rounded-lg border border-green-100">
                                    {resendMessage}
                                </div>
                            )}

                            {resendStatus === 'error' && (
                                <div className="p-3 mb-4 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    {resendMessage}
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="email"
                                    value={resendEmail}
                                    onChange={(e) => setResendEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#10706B] focus:ring-4 focus:ring-[#10706B]/5 hover:border-[#10706B]/50 transition-all text-sm font-medium"
                                    placeholder="Email Address"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={resendStatus === 'loading'}
                            className="w-full bg-[#10706B] text-white font-bold py-4 rounded-xl hover:bg-[#0D5C58] transition-all shadow-lg shadow-[#10706B]/20 text-sm tracking-[0.1em] uppercase flex items-center justify-center gap-2"
                        >
                            {resendStatus === 'loading' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Request New Link
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <a href="/login" className="text-[#10706B] font-bold text-sm hover:underline">
                            Back to Login
                        </a>
                    </div>
                </div>
            )}
        </AuthLayout>
    );
}
