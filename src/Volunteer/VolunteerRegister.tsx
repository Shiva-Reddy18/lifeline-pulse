import { useState, CSSProperties } from "react";

export default function VolunteerRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleRegister = () => {
    if (!name || !email || !phone) {
      alert("Please fill all fields");
      return;
    }

    localStorage.setItem(
      "volunteer",
      JSON.stringify({
        isRegistered: true,
        isLoggedIn: false,
        name,
        email,
        phone,
      })
    );

    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <h2>Volunteer Registration</h2>

      <input
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        style={styles.input}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button style={styles.button} onClick={handleRegister}>
        Register as Volunteer
      </button>
    </div>
  );
}

/* ✅ FIX: typed styles */
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
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
  },
};
