import { useEffect, useState } from "react";
import api from "../services/api";
import { saveUser } from "../services/auth";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function Profile() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);

  useEffect(() => {
    let active = true;
    api.get("/users/me")
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        setFullName(data.user.full_name || "");
      })
      .catch((error) => {
        if (active) setNameError(error.response?.data?.message || "Could not load your profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleNameSubmit = async (event) => {
    event.preventDefault();
    setNameError("");
    setNameSuccess("");
    const trimmedName = fullName.trim();
    const nameLength = [...trimmedName].length;
    if (nameLength < 3 || nameLength > 100) {
      setNameError("Enter a full name between 3 and 100 characters.");
      return;
    }

    setSavingName(true);
    try {
      const { data } = await api.put("/users/me", { full_name: trimmedName });
      setUser(data.user);
      setFullName(data.user.full_name);
      saveUser(data.user);
      setNameSuccess("Your full name was updated.");
    } catch (error) {
      setNameError(error.response?.data?.message || "Could not update your full name.");
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (new TextEncoder().encode(passwordForm.newPassword).length > 72) {
      setPasswordError("New password must not exceed 72 bytes.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Password confirmation does not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const { data } = await api.put("/users/me/password", passwordForm);
      setPasswordForm(emptyPasswordForm);
      setPasswordSuccess(data.message || "Your password was changed.");
    } catch (error) {
      setPasswordError(error.response?.data?.message || "Could not change your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <main className="container"><p className="loading">Loading your profile…</p></main>;
  if (!user) return <main className="container"><p className="error">{nameError || "Could not load your profile."}</p></main>;

  return (
    <main className="container profile-page">
      <header className="page-header">
        <div>
          <h1>My Profile</h1>
          <p className="page-subtitle">View your account details and keep your information up to date.</p>
        </div>
      </header>

      <section className="section-card profile-information" aria-labelledby="profile-information-title">
        <div className="profile-section-heading">
          <div><h2 id="profile-information-title">Profile information</h2><p>Account details linked to your course management account.</p></div>
          <span className="role-badge">{user.role}</span>
        </div>
        <dl className="profile-details">
          <div><dt>User ID</dt><dd>{user.id}</dd></div>
          <div><dt>Username</dt><dd>{user.username}</dd></div>
          <div><dt>Full name</dt><dd>{user.full_name}</dd></div>
          <div><dt>Role</dt><dd>{user.role}</dd></div>
        </dl>
      </section>

      <section className="section-card profile-form-card" aria-labelledby="profile-name-title">
        <h2 id="profile-name-title">Change full name</h2>
        <p className="page-subtitle">Your username and account role cannot be changed here.</p>
        <form className="form profile-form" onSubmit={handleNameSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="profile-full-name">Full name</label>
            <input id="profile-full-name" className={`input${nameError ? " input-error" : ""}`} value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={3} maxLength={100} required aria-describedby={nameError ? "profile-name-error" : undefined} />
            {nameError && <span className="field-error" id="profile-name-error" role="alert">{nameError}</span>}
          </div>
          {nameSuccess && <p className="success" role="status">{nameSuccess}</p>}
          <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={savingName}>{savingName ? "Saving…" : "Save full name"}</button></div>
        </form>
      </section>

      <section className="section-card profile-form-card" aria-labelledby="profile-password-title">
        <h2 id="profile-password-title">Change password</h2>
        <p className="page-subtitle">Choose a password with at least 8 characters.</p>
        <form className="form profile-form" onSubmit={handlePasswordSubmit} noValidate>
          <div className="form-group"><label htmlFor="current-password">Current password</label><input id="current-password" className="input" type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required /></div>
          <div className="form-group"><label htmlFor="new-password">New password</label><input id="new-password" className="input" type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} minLength={8} required /></div>
          <div className="form-group"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" className="input" type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required /></div>
          {passwordError && <p className="field-error" role="alert">{passwordError}</p>}
          {passwordSuccess && <p className="success" role="status">{passwordSuccess}</p>}
          <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={savingPassword}>{savingPassword ? "Changing…" : "Change password"}</button></div>
        </form>
      </section>
    </main>
  );
}

export default Profile;
