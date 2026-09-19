// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";

// Firebase is replaced wholesale - these tests are about the role logic in
// AuthContext, not about Firebase itself.
const mocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({ default: {} }));

vi.mock("firebase/auth", () => ({
  getAuth: () => ({}),
  onAuthStateChanged: mocks.onAuthStateChanged,
  GoogleAuthProvider: class {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: "local",
  browserSessionPersistence: "session",
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: () => ({}),
  // Keep the collection name so getDoc can tell the two lookups apart.
  doc: (_db, collection, id) => ({ collection, id }),
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
}));

const { AuthProvider, useAuth } = await import("@/contexts/AuthContext");

const USER = { uid: "uid-1", email: "student@example.com", displayName: "Sam" };

function Probe() {
  const { loading, userRole, roleStatus } = useAuth();
  if (loading) return <div>loading</div>;
  return <div data-testid="role">{`${userRole ?? "none"}/${roleStatus ?? "none"}`}</div>;
}

/** Renders the provider with `user` signed in, and waits for the role to settle. */
async function renderAs(user) {
  mocks.onAuthStateChanged.mockImplementation((_auth, cb) => {
    cb(user);
    return () => {};
  });
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await waitFor(() => expect(screen.getByTestId("role")).toBeTruthy());
  return screen.getByTestId("role").textContent;
}

/** Builds a getDoc that answers each collection from `docs`. */
function firestoreWith(docs) {
  return async (ref) => {
    const value = docs[ref.collection];
    if (!value) return { exists: () => false };
    return { exists: () => true, data: () => value };
  };
}

beforeEach(() => {
  mocks.getDoc.mockReset();
  mocks.setDoc.mockReset();
});

afterEach(() => cleanup());

describe("AuthContext role resolution", () => {
  it("treats a master admin as master/active", async () => {
    mocks.getDoc.mockImplementation(firestoreWith({ master_admins: { admin: true } }));

    expect(await renderAs(USER)).toBe("master/active");
  });

  it("does not consult user_roles once master admin matches", async () => {
    mocks.getDoc.mockImplementation(firestoreWith({ master_admins: { admin: true } }));
    await renderAs(USER);

    const collections = mocks.getDoc.mock.calls.map(([ref]) => ref.collection);
    expect(collections).toContain("master_admins");
    expect(collections).not.toContain("user_roles");
  });

  it("reads role and status from user_roles", async () => {
    mocks.getDoc.mockImplementation(
      firestoreWith({ user_roles: { role: "organizer", status: "pending" } })
    );

    expect(await renderAs(USER)).toBe("organizer/pending");
  });

  it("defaults a user_roles record with no role to student/active", async () => {
    mocks.getDoc.mockImplementation(firestoreWith({ user_roles: { email: "a@b.com" } }));

    expect(await renderAs(USER)).toBe("student/active");
  });

  it("defaults to student/active when the user has no role record", async () => {
    mocks.getDoc.mockImplementation(firestoreWith({}));

    expect(await renderAs(USER)).toBe("student/active");
  });

  it("falls open to student/active when Firestore throws", async () => {
    // Worth stating plainly: a failed role lookup grants student access
    // rather than denying it. That is the current design - this test pins it
    // so a change to fail-closed is a deliberate decision, not a surprise.
    mocks.getDoc.mockRejectedValue(new Error("permission-denied"));

    expect(await renderAs(USER)).toBe("student/active");
  });

  it("clears the role when no one is signed in", async () => {
    mocks.getDoc.mockImplementation(firestoreWith({ user_roles: { role: "organizer" } }));

    expect(await renderAs(null)).toBe("none/none");
    expect(mocks.getDoc).not.toHaveBeenCalled();
  });
});
