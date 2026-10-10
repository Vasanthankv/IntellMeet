import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Utility to convert ArrayBuffer to Base64 (for storage)
const bufferToBase64 = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

export default function PasskeysPage() {
  const [passkeys, setPasskeys] = useState([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load passkeys from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('intellmeet_passkeys');
    if (stored) {
      try {
        setPasskeys(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse passkeys', e);
      }
    }
  }, []);

  // Save passkeys to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('intellmeet_passkeys', JSON.stringify(passkeys));
  }, [passkeys]);

  const handleAddPasskey = async () => {
    // Check if the browser supports WebAuthn
    if (!window.PublicKeyCredential) {
      toast.error('Passkeys are not supported by this browser or device.');
      return;
    }

    setIsAuthenticating(true);

    try {
      // 1. Generate a random challenge (in a real app, this comes from the backend)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // 2. Generate a random user ID
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      // 3. Request passkey creation from the OS / Browser
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: {
            name: "IntellMeet App",
            // localhost is a valid RP ID for local development
            id: window.location.hostname 
          },
          user: {
            id: userId,
            name: "user@intellmeet.io",
            displayName: "IntellMeet User"
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },  // ES256
            { type: "public-key", alg: -257 } // RS256
          ],
          authenticatorSelection: {
            userVerification: "preferred"
          },
          timeout: 60000,
          attestation: "none"
        }
      });

      if (credential) {
        // 4. In a real app, you would send credential.response.attestationObject to your backend.
        // For now, we store a reference locally.
        const newPasskey = {
          id: credential.id,
          name: `Passkey Device (${navigator.platform})`,
          date: new Date().toLocaleDateString()
        };
        
        setPasskeys([...passkeys, newPasskey]);
        toast.success('Passkey successfully created and securely stored!');
      }
    } catch (error) {
      console.error('Passkey creation failed:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Passkey creation was cancelled.');
      } else {
        toast.error('Failed to create passkey. See console for details.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRemovePasskey = (id) => {
    setPasskeys(passkeys.filter(pk => pk.id !== id));
    toast.success('Passkey securely removed from your account.');
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* We assume AppLayout sidebar is already handled by routing, so this is just the content area */}
      <div className="max-w-4xl mx-auto w-full py-10 px-6">
        
        <div className="mb-6 flex items-center gap-3 text-gray-500 text-sm font-medium">
          <Link to="/profile" className="hover:text-blue-600 transition-colors">My Account</Link>
          <span>/</span>
          <span className="text-gray-900">Passkeys</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Passkeys</h1>
              <p className="text-sm text-gray-600 max-w-xl leading-relaxed">
                Passkeys allow you to securely sign in to your IntellMeet account using your device's fingerprint, face unlock, or screen lock. The cryptographic keys are stored securely on your device.
              </p>
            </div>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-inner">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Your registered passkeys</h2>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{passkeys.length} of 5</span>
            </div>

            {passkeys.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No passkeys set up yet</h3>
                <p className="text-sm text-gray-500 mb-6">You haven't registered any devices for passwordless sign-in.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {passkeys.map((pk) => (
                  <div key={pk.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{pk.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Added on {pk.date}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono truncate max-w-[200px]">ID: {pk.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemovePasskey(pk.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleAddPasskey}
                disabled={isAuthenticating || passkeys.length >= 5}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors ${
                  isAuthenticating || passkeys.length >= 5 
                  ? 'bg-blue-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isAuthenticating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add a passkey
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
