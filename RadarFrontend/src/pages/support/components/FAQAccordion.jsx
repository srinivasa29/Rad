import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQAccordion = ({ items }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const fallbackItems = [
    {
      question: 'Why is chart data delayed?',
      answer:
        'Chart data may be delayed due to market data latency or API processing time. Our system fetches data from multiple sources to ensure accuracy. Real-time data updates typically reflect market changes within seconds.',
    },
    {
      question: 'Why is data not loading?',
      answer:
        'Data loading issues can occur due to network connectivity, market data provider downtime, or API rate limits. Try refreshing the page or checking your internet connection. If the issue persists, contact our support team.',
    },
    {
      question: 'How often is data updated?',
      answer:
        'Market data is updated in real-time during trading hours (9:15 AM - 3:30 PM IST for Indian markets). After-hours data is updated with a slight delay. Chart data is aggregated based on your selected timeframe.',
    },
    {
      question: 'How do I customize my watchlist?',
      answer:
        'You can customize your watchlist by clicking the "Add" button in the watchlist section. Search for stocks, select your preferred chart timeframes, and organize them into folders for better organization.',
    },
    {
      question: 'Is my data secure and private?',
      answer:
        'Yes, all user data is encrypted and stored securely. We comply with industry-standard security protocols and never share your personal information with third parties without consent.',
    },
  ];
  const faqItems = Array.isArray(items) && items.length ? items : fallbackItems;

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="help-faq-section"
    >
      <div className="faq-header">
        <h3 className="faq-title">Frequently Asked Questions</h3>
        <p className="faq-subtitle">Find answers to common questions</p>
      </div>

      <div className="faq-accordion">
        {faqItems.map((item, index) => (
          <div key={index} className="faq-item">
            <motion.button
              onClick={() => toggleAccordion(index)}
              className={`faq-question ${openIndex === index ? 'active' : ''}`}
              whileHover={{ backgroundColor: 'rgba(34, 211, 238, 0.05)' }}
            >
              <span className="faq-question-text">{item.question}</span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="faq-chevron"
              >
                <ChevronDown size={20} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="faq-answer-container"
                >
                  <p className="faq-answer">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default FAQAccordion;
