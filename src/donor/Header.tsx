import React from "react";

interface HeaderProps {
  donorName: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ donorName, onLogout }) => {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      backgroundColor: "#e53935",
      color: "white",
      padding: "15px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      zIndex: 100
    }}>
      <h1 style={{ margin: 0 }}>Welcome, {donorName}</h1>
      <button 
        onClick={onLogout}
        style={{
          backgroundColor: "white",
          color: "#e53935",
          border: "none",
          padding: "8px 16px",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Logout
      </button>
    </header>
  );
};

export default Header;