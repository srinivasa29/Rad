import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ContactForm from './components/ContactForm';
import ContactInfo from './components/ContactInfo';
import FAQAccordion from './components/FAQAccordion';
import { fetchSupportMeta } from '../../api/supportApi';
import './HelpSupportPage.css';

const DEFAULT_SUPPORT_META = {
  contact: {
    email: 'srinivasamannepula7@gmail.com',
    phone: '+91 9391 143 994',
    hours: 'Monday - Friday, 9 AM - 6 PM IST',
    note: 'Your feedback helps us improve every day',
  },
  topics: ['Dashboard Issue', 'Data Issue', 'Login Issue', 'Feedback'],
  faqs: [],
  profile: {
    name: '',
    email: 'srinivasamannepula7@gmail.com',
  },
};

const HelpSupportPage = ({ embedded = false, dashboardPath = '/trader/dashboard' } = {}) => {
  const navigate = useNavigate();
  const [supportMeta, setSupportMeta] = useState(DEFAULT_SUPPORT_META);

  useEffect(() => {
    let mounted = true;
    fetchSupportMeta()
      .then((data) => {
        if (!mounted) return;
        setSupportMeta({
          ...DEFAULT_SUPPORT_META,
          ...data,
          contact: { ...DEFAULT_SUPPORT_META.contact, ...(data?.contact || {}) },
          profile: { ...DEFAULT_SUPPORT_META.profile, ...(data?.profile || {}) },
          topics: Array.isArray(data?.topics) && data.topics.length ? data.topics : DEFAULT_SUPPORT_META.topics,
          faqs: Array.isArray(data?.faqs) ? data.faqs : DEFAULT_SUPPORT_META.faqs,
        });
      })
      .catch(() => {
        if (mounted) setSupportMeta(DEFAULT_SUPPORT_META);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleBackToDashboard = () => {
    navigate(dashboardPath);
  };

  return (
    <div className="help-support-page">
      {/* Gradient Background */}
      <div className="help-gradient-bg" />

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="help-header"
      >
        <div className="help-header-content">
          <div className="help-header-left">
            {!embedded && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToDashboard}
                className="back-to-dashboard-btn help-back-left-btn"
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </motion.button>
            )}
            <h1 className="help-title">Help & Support</h1>
            <p className="help-subtitle">
              Get help with insights, charts, and account access
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Container */}
      <div className="help-container">
        {/* Two-Column Layout */}
        <div className="help-main-content">
          <div className="help-left-column">
            <ContactForm profile={supportMeta.profile} topics={supportMeta.topics} />
          </div>
          <div className="help-middle-column">
            <ContactInfo contact={supportMeta.contact} />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="help-faq-container">
          <FAQAccordion items={supportMeta.faqs} />
        </div>
      </div>
    </div>
  );
};

export default HelpSupportPage;
