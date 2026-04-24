import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertCircle, CheckCircle } from 'lucide-react';

const AlertsPanel = ({ alerts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const activeAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id));

  const handleDismiss = (id) => {
    setDismissedAlerts((prev) => new Set([...prev, id]));
  };

  return (
    <>
      {}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 p-3.5 rounded-full bg-gradient-to-br from-blue-500/80 to-blue-600 border border-blue-400/50 text-white shadow-lg hover:shadow-blue-500/50 transition-all z-30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell size={24} />
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {activeAlerts.length}
          </motion.div>
        )}
      </motion.button>

      {}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-8 w-96 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl shadow-2xl overflow-hidden z-30"
          >
            {}
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-900/40 border-b border-slate-700/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-blue-400" />
                <span className="font-semibold text-slate-100">{activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            {}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/30">
              {activeAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-100 text-sm">{alert.symbol}</p>
                      <p className="text-xs text-slate-400 mt-1">{alert.condition}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(alert.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="p-1.5 rounded hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-slate-200 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AlertsPanel;
