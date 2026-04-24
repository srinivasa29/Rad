const axios = require('axios');

const USER_AGENT = "ProjectRADAR contact@projectradar.com";

const fetchCompanyFilings = async (cik) => {
    try {
        const paddedCik = cik.toString().padStart(10, '0');
        const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept-Encoding': 'gzip, deflate'
            },
            timeout: 8000
        });

        const filings = response.data.filings.recent;
        const recentFilings = [];
        for (let i = 0; i < Math.min(10, filings.accessionNumber.length); i++) {
            recentFilings.push({
                form: filings.form[i],
                filingDate: filings.filingDate[i],
                reportDate: filings.reportDate[i],
                accessionNumber: filings.accessionNumber[i],
                primaryDocument: filings.primaryDocument[i],
                description: filings.primaryDocDescription[i]
            });
        }

        return recentFilings;

    } catch (error) {
        console.error(`SEC EDGAR Error for CIK ${cik}:`, error.message);
        return [];
    }
};

const getFilingsForSymbol = async (symbol) => {
    const cikMap = {
        'AAPL': '320193',
        'TSLA': '1318605',
        'NVDA': '1045810',
        'MSFT': '789019',
        'GOOGL': '1652044'
    };

    const cik = cikMap[symbol.toUpperCase()];
    if (!cik) return [];

    return await fetchCompanyFilings(cik);
};

module.exports = { getFilingsForSymbol };
