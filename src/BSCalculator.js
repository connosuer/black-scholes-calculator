import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BSCalculator = () => {
  const [inputs, setInputs] = useState({
    spot: 1800,
    strike: 1800,
    rate: 1,
    days: 30,
    volatility: 20,
  });
  const [results, setResults] = useState({});
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    calculateAndUpdateChart();
  }, [inputs]);

  const handleInputChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const calculateBS = (spot, strike, rate, days, volatility) => {
    const t = days / 365;
    const r = rate / 100;
    const sigma = volatility / 100;
  
    const d1 = (Math.log(spot / strike) + (r + sigma ** 2 / 2) * t) / (sigma * Math.sqrt(t));
    const d2 = d1 - sigma * Math.sqrt(t);
  
    const nd1 = normalCDF(d1);
    const nd2 = normalCDF(d2);
    const nnd1 = normalCDF(-d1);
    const nnd2 = normalCDF(-d2);
  
    const callPrice = spot * nd1 - strike * Math.exp(-r * t) * nd2;
    const putPrice = strike * Math.exp(-r * t) * nnd2 - spot * nnd1;
  
    const callDelta = nd1;
    const putDelta = callDelta - 1;
  
    const gamma = Math.exp(-(d1 ** 2) / 2) / (spot * sigma * Math.sqrt(2 * Math.PI * t));
    const vega = spot * Math.sqrt(t) * Math.exp(-(d1 ** 2) / 2) / Math.sqrt(2 * Math.PI) / 100;
  
    const callTheta = (-spot * sigma * Math.exp(-(d1 ** 2) / 2) / (2 * Math.sqrt(2 * Math.PI * t)) - r * strike * Math.exp(-r * t) * nd2) / 365;
    const putTheta = (-spot * sigma * Math.exp(-(d1 ** 2) / 2) / (2 * Math.sqrt(2 * Math.PI * t)) + r * strike * Math.exp(-r * t) * nnd2) / 365;
  
    const callRho = strike * t * Math.exp(-r * t) * nd2 / 100;
    const putRho = -strike * t * Math.exp(-r * t) * nnd2 / 100;
  
    return {
      callPrice,
      putPrice,
      callDelta,
      putDelta,
      gamma,
      vega,
      callTheta,
      putTheta,
      callRho,
      putRho
    };
  };
  
  const normalCDF = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) prob = 1 - prob;
    return prob;
  };

  const calculateAndUpdateChart = () => {
    const { spot, strike, rate, days, volatility } = inputs;
    const results = calculateBS(spot, strike, rate, days, volatility);
    setResults(results);

    const newChartData = [];
    for (let i = -10; i <= 10; i++) {
      const spotPrice = spot * (1 + i / 100);
      const pointResults = calculateBS(spotPrice, strike, rate, days, volatility);
      newChartData.push({
        spot: spotPrice,
        callPrice: pointResults.callPrice,
        putPrice: pointResults.putPrice
      });
    }
    setChartData(newChartData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg p-6 rounded-lg">
      <h2 className="text-3xl font-bold text-center mb-6">Black-Scholes Option Calculator</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {Object.entries(inputs).map(([key, value]) => (
            <div key={key} className="mb-4">
              <label htmlFor={key} className="block text-sm font-medium mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  name={key}
                  id={key}
                  value={value}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-1/3 mr-4 text-black px-2 py-1 rounded"
                />
                <input
                  type="range"
                  min={0}
                  max={key === 'volatility' || key === 'rate' ? 100 : 5000}
                  step={1}
                  value={value}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-2/3"
                />
              </div>
            </div>
          ))}
          <button 
            onClick={calculateAndUpdateChart} 
            className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Calculate
          </button>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Results:</h3>
          {Object.entries(results).map(([key, value]) => (
            <p key={key} className="mb-2">
              <span className="font-medium">{key}:</span> {value.toFixed(4)}
            </p>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Option Price vs Spot Price</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="spot" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="callPrice" stroke="#8884d8" name="Call Price" />
            <Line type="monotone" dataKey="putPrice" stroke="#82ca9d" name="Put Price" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BSCalculator;