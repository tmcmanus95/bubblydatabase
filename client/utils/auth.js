// Sign-in state on the client (P1-6). The session itself lives in httpOnly cookies the page can't read;
// the server also sets "bubbly_signed_in=1" (no secret) so the UI knows whether to show signed-in parts.
//
// Older visits stored a 1-year token in localStorage ("id_token"). Until the server's grace date it still
// counts: App.jsx sends it once so the server can move this browser onto cookies, then deletes it.
const LEGACY_TOKEN = "id_token";
const SIGNED_IN_COOKIE = "bubbly_signed_in";

class AuthService {
  loggedIn() {
    return document.cookie.split("; ").includes(`${SIGNED_IN_COOKIE}=1`) || Boolean(this.legacyToken());
  }

  legacyToken() {
    try {
      return localStorage.getItem(LEGACY_TOKEN);
    } catch {
      return null;
    }
  }

  forgetLegacyToken() {
    try {
      localStorage.removeItem(LEGACY_TOKEN);
    } catch {
      // Storage blocked: nothing was saved there either
    }
  }

  // Called after login/signup succeeds; the response has already set the session cookies
  login() {
    this.forgetLegacyToken();
    window.location.assign("/");
  }

  // Ends the cookie session on the server, then forgets any old stored token
  async logout() {
    try {
      await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ query: "mutation { logout }" }),
      });
    } catch {
      // Offline: the cookies expire on their own; still sign out locally
    }
    this.forgetLegacyToken();
    window.location.assign("/");
  }

  // One-time move from an old stored token to cookies: the server upgrades this request, then the token
  // is deleted whether or not it still worked
  async upgradeLegacyToken() {
    const token = this.legacyToken();
    if (!token) return;
    try {
      await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "same-origin",
        body: JSON.stringify({ query: "{ meId { _id } }" }),
      });
    } catch {
      return; // offline: try again next visit
    }
    this.forgetLegacyToken();
  }
}

export default new AuthService();
