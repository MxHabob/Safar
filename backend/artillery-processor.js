/**
 * Artillery processor for custom logic
 */

module.exports = {
  // Generate timestamps for check-in/check-out dates
  timestamp: function(offset) {
    const now = new Date();
    const match = offset.match(/([+-])(\d+)([dhm])/);
    if (!match) return now.toISOString();
    
    const [, sign, amount, unit] = match;
    const value = parseInt(amount) * (sign === '+' ? 1 : -1);
    
    switch (unit) {
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
    }
    
    return now.toISOString();
  }
};

