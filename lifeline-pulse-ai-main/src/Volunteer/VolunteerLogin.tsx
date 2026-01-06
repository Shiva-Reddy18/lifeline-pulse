import { useState, CSSProperties } from "react";

export default function VolunteerLogin() {
  const [email, setEmail] = useState("");

  const handleLogin = () => {
    const volunteer = JSON.parse(
      localStorage.getItem("volunteer") || "{}"
    );

    if (!volunteer.email || volunteer.email !== email) {
      alert("Invalid email");
      return;
    }

    localStorage.setItem(
      "volunteer",
      JSON.stringify({
        ...volunteer,
        isLoggedIn: true,
      })
    );

    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <h2>Volunteer Login</h2>

      <input
        style={styles.input}
        placeholder="Registered Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button style={styles.button} onClick={handleLogin}>
        Login
      </button>
    </div>
  );
}

/* ✅ IMPORTANT FIX IS HERE */
const styles: {
  container: CSSProperties;
  input: CSSProperties;
  button: CSSProperties;
} = {
  container: {
    maxWidth: "400px",
    margin: "100px auto",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 0 10px #ddd",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
  },
};
