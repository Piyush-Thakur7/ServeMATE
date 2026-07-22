import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Default Mock User Profile (Donor Student from GL Bajaj)
  const [user, setUser] = useState({
    id: 'usr_101',
    name: 'Piyush Singh',
    email: 'piyush@resence.in',
    role: 'donor', // Roles: donor | leader | ngo | volunteer | admin
    college: 'GL Bajaj Institute of Management',
    communityCode: 'GLBAJAJ',
    communityName: 'GL Bajaj AI Club',
    xp: 450,
    level: 2,
    levelTitle: 'Active Changemaker',
    totalDonated: 120,
    contributionsCount: 6,
    badges: [
      { id: 'b1', name: 'First Micro-Give', icon: '🌱', date: '2026-06-27' },
      { id: 'b2', name: 'Campus Pioneer', icon: '🏫', date: '2026-07-01' },
      { id: 'b3', name: '3-Week Streak', icon: '🔥', date: '2026-07-15' }
    ]
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Helper to switch roles easily during testing/demoing
  const switchRole = (newRole) => {
    setUser((prev) => ({ ...prev, role: newRole }));
  };

  const addXP = (points) => {
    setUser((prev) => {
      const newXP = prev.xp + points;
      const newLevel = Math.floor(newXP / 500) + 1;
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        totalDonated: prev.totalDonated + points,
        contributionsCount: prev.contributionsCount + 1
      };
    });
  };

  const login = (email, role = 'donor') => {
    setIsAuthenticated(true);
    switchRole(role);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, switchRole, addXP, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
