import { motion } from "framer-motion";
import StockCard from "./StockCard.jsx";

export default function StockCardGrid({ stocks, onSelect, selectedSymbol, onDeepResearch }) {
  return (
    <div className="stock-grid">
      {stocks.map((stock, index) => (
        <motion.div
          key={stock.symbol}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <StockCard 
            stock={stock} 
            isSelected={selectedSymbol === stock.symbol}
            onClick={() => onSelect(stock.symbol)}
            onDeepResearch={onDeepResearch}
          />
        </motion.div>
      ))}
    </div>
  );
}
